import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

/**
 * Trigger: onCreate borang document.
 * Automatically appends a 'cipta_borang' entry onto the audit logs ledger.
 */
export const logBorangCreated = onDocumentCreated(
  "borang/{borangId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const docId = event.params.borangId;
    const db = admin.firestore();

    const namaInstitusi = data.namaInstitusi || "Pendidikan Swasta";
    const jenisBorang = data.jenisBorang || "Borang Rasmi";
    const statusAwal = data.status || "draf";
    const userEmail = data.pegawai || data.userEmail || "system@moe.gov.my";

    try {
      await db.collection("audit_logs").add({
        entityType: "borang",
        entityId: docId,
        actionType: "cipta_borang",
        description: `[Server Audit] Borang "${jenisBorang}" di bawah premis "${namaInstitusi}" dibina dengan status permulaan: "${statusAwal}".`,
        performedBy: userEmail === "system@moe.gov.my" ? "Sistem PPD" : "Pegawai Cawangan/IPS",
        performedEmail: userEmail,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          noRujukan: data.noRujukan || "DRAF-AUTO",
          source: "Cloud Trigger (onCreate)"
        }
      });
      console.log(`[Audit Trigger] Cipta Audit Log berjaya bagi borang ${docId}`);
    } catch (err: any) {
      console.error("[Audit Trigger Error] Gagal merekod log cipta borang:", err);
    }
  }
);

/**
 * Trigger: onUpdate borang document.
 * Records state transitioning of forms dynamically (e.g. Draf -> Kemukakan -> Lulus).
 */
export const logBorangStatusUpdated = onDocumentUpdated(
  "borang/{borangId}",
  async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) return;

    const oldStatus = beforeData.status;
    const newStatus = afterData.status;
    const docId = event.params.borangId;
    const db = admin.firestore();

    // Check if status actually changed
    if (oldStatus !== newStatus) {
      const jenisBorang = afterData.jenisBorang || "Borang Rasmi";
      const namaInstitusi = afterData.namaInstitusi || "Nama Premis";
      const userEmail = afterData.pegawai || "system@moe.gov.my";

      try {
        await db.collection("audit_logs").add({
          entityType: "borang",
          entityId: docId,
          actionType: "tukar_status",
          description: `[Server Audit] Status urusan "${jenisBorang}" bagi "${namaInstitusi}" berubah drastik daripada [${oldStatus.toUpperCase()}] kepada [${newStatus.toUpperCase()}].`,
          performedBy: userEmail === "system@moe.gov.my" ? "Automasi SPS PPD" : "Pegawai Penyunting",
          performedEmail: userEmail,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            oldStatus,
            newStatus,
            source: "Cloud Trigger (onUpdate)"
          }
        });
        console.log(`[Audit Trigger] Rekod peralihan status [${oldStatus} -> ${newStatus}] berjaya digazetkan.`);
      } catch (err: any) {
        console.error("[Audit Trigger Error] Gagal merekod peralihan status:", err);
      }
    }
  }
);
