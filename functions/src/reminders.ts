import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

/**
 * Core analysis engine to calculate and synchronize notifications.
 * Decoupled from the function wrappers to support both Scheduled Trigger and HTTP Manual Run.
 */
async function runReminderEngine(): Promise<{ created: number; resolved: number }> {
  const db = admin.firestore();
  const now = new Date();
  
  console.log("[Reminder Engine] Memulakan imbasan kesedaran status borang...");

  // 1. Fetch all borang records
  const borangSnap = await db.collection("borang").get();
  const activeBorangs = borangSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 2. Fetch all existing unresolved reminders to prevent duplicates
  const reminderSnap = await db.collection("reminders").where("resolved", "==", false).get();
  const unresolvedReminders = reminderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  let remindersCreated = 0;
  let remindersResolved = 0;

  // Track which borangs are flagged during this scan
  const currentlyFlaggedKeys = new Set<string>(); // key is: "borangId_type"

  for (const borang of activeBorangs) {
    const borangId = borang.id;
    const institusiId = borang.institusiId || "UNKNOWN_IPS";
    const namaInstitusi = borang.namaInstitusi || "Pendidikan Swasta";
    const jenisBorang = borang.jenisBorang || "Borang Rasmi";
    const status = borang.status || "";

    // Parse date for comparison
    let compareDate = now;
    if (borang.updatedAt) {
      if (typeof borang.updatedAt === "string") {
        compareDate = new Date(borang.updatedAt);
      } else if (borang.updatedAt.toDate) {
        compareDate = borang.updatedAt.toDate();
      }
    } else if (borang.tarikhKemuka) {
      compareDate = new Date(borang.tarikhKemuka);
    }

    const timeDiff = now.getTime() - compareDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    let shouldFlag = false;
    let reminderType: "kelengahan_draf" | "kelambatan_proses" = "kelengahan_draf";
    let severity: "sederhana" | "tinggi" = "sederhana";
    let title = "";
    let description = "";

    // Logic: Draft and idle for > 7 days
    if (status === "draf" && daysDiff > 7) {
      shouldFlag = true;
      reminderType = "kelengahan_draf";
      severity = "sederhana";
      title = `Draf Urusan Terbengkalai: ${jenisBorang}`;
      description = `Rekod permohonan berstatus Draf untuk premis ${namaInstitusi} belum dikemukakan selama ${daysDiff} hari. Urusan mohon perhatian segera.`;
    } 
    // Logic: Submitted or processed and pending action for > 14 days
    else if (["dikemukakan", "diproses"].includes(status) && daysDiff > 14) {
      shouldFlag = true;
      reminderType = "kelambatan_proses";
      severity = "tinggi";
      title = `Lengah Kelulusan KPI (>14 Hari): ${jenisBorang}`;
      description = `Dokumen berstatus ${status.toUpperCase()} bagi premis ${namaInstitusi} tertangguh lama (${daysDiff} hari) tanpa tindakan kelulusan atau ulasan.`;
    }

    if (shouldFlag) {
      const key = `${borangId}_${reminderType}`;
      currentlyFlaggedKeys.add(key);

      // Check if this reminder already exists
      const exists = unresolvedReminders.some(r => r.entityId === borangId && r.reminderType === reminderType);

      if (!exists) {
        // Create new reminder
        const id = `rem_${borangId}_${reminderType}`;
        await db.collection("reminders").doc(id).set({
          id,
          entityType: "borang",
          entityId: borangId,
          ipsId: institusiId,
          namaInstitusi,
          reminderType,
          severity,
          title,
          description,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          resolved: false,
          resolvedAt: null
        });
        remindersCreated++;
        console.log(`[Reminder Engine] Amaran dibina: ${id} (${title})`);
      }
    }
  }

  // 3. Auto-resolve reminders and warnings that are no longer active
  // i.e., if is in unresolvedReminders but its core conditions are not active (e.g. status changed to lulus, or draf submitted)
  for (const reminder of unresolvedReminders) {
    const borangId = reminder.entityId;
    const type = reminder.reminderType;
    const key = `${borangId}_${type}`;

    // If it was unresolved before, but is NOT flagged in this current scan (meaning it has been updated, submitted, or approved)
    if (!currentlyFlaggedKeys.has(key)) {
      await db.collection("reminders").doc(reminder.id).update({
        resolved: true,
        resolvedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      remindersResolved++;
      console.log(`[Reminder Engine] Selesai: Amaran ${reminder.id} ditandakan sebagai RESOLVED (Diatasi).`);
    }
  }

  return {
    created: remindersCreated,
    resolved: remindersResolved
  };
}

/**
 * Scheduled Cloud Function (v2): Runs once every 24 hours (nightly)
 */
export const runDailyReminderAnalyzer = onSchedule("0 2 * * *", async (event) => {
  console.log(`[Scheduler] Memulakan larian harian: ${event.scheduleTime}`);
  try {
    const counts = await runReminderEngine();
    console.log(`[Scheduler Selesai] Amaran baru ditubuhkan: ${counts.created}, Amaran diatasi: ${counts.resolved}`);
  } catch (err: any) {
    console.error("[Scheduler Error] Gagal merumuskan analisa amaran automatik:", err);
  }
});

/**
 * HTTP REST Cloud Function (v2): For testing, debugging and forced on-demand run.
 */
export const triggerReminderAnalyzerManual = onRequest({ cors: true }, async (req, res) => {
  console.log("[HTTP Trigger] Panggilan manual analisis borang diterima.");
  try {
    const counts = await runReminderEngine();
    res.status(200).json({
      status: "Berjaya",
      message: "Proses imbasan prapenerbitan amaran SPS selesai dijalankan secara sihat pada peringkat server.",
      parameters: {
        total_dicipta: counts.created,
        total_diselesaikan: counts.resolved
      },
      waktu_semakan: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[HTTP Trigger Error] Ralat semasa manual run:", err);
    res.status(500).json({
      status: "Gagal",
      message: `Kegagalan pelaksanaan backend: ${err.message || err}`
    });
  }
});
