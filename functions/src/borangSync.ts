import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

/**
 * Firestore Trigger: Runs whenever a 'borang' document is updated.
 * Checks for status transitions to 'lulus' (or specific status for statistics)
 * and secure syncs parameters to the associated 'institusi' document.
 */
export const syncBorangToInstitusiTrigger = onDocumentUpdated(
  "borang/{borangId}",
  async (event) => {
    const change = event.data;
    if (!change) {
      console.log("Tiada data ditemui dalam perubahan.");
      return;
    }

    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) {
      console.log("Gagal membaca data keadaan sebelum/selepas.");
      return;
    }

    const docId = event.params.borangId;
    const oldStatus = beforeData.status;
    const newStatus = afterData.status;
    const jenisBorang = afterData.jenisBorang || "";
    const institusiId = afterData.institusiId;

    if (!institusiId) {
      console.warn(`[Functions Sync] Borang ${docId} tidak mempunyai institusiId.`);
      return;
    }

    // Determine the raw form category prefix or code
    // Normalize comparison values
    const normalizedBorang = jenisBorang.toUpperCase();

    // 1. STATISTIC DATA (BPS_DATA_01)
    // Run sync when status changes to dikemukakan/lulus/diproses OR when fields are modified while in those statuses
    const isStatistikType = normalizedBorang.includes("BPS DATA 01") || normalizedBorang.includes("BPS_DATA_01");
    const isStatusActive = ["dikemukakan", "lulus", "diproses"].includes(newStatus);
    const wasStatusActive = ["dikemukakan", "lulus", "diproses"].includes(oldStatus);

    const triggerStatistik = isStatistikType && (
      (oldStatus !== newStatus && isStatusActive) ||
      (wasStatusActive && JSON.stringify(change.before.data().detailFields) !== JSON.stringify(change.after.data().detailFields))
    );

    const db = admin.firestore();

    if (triggerStatistik) {
      const fields = afterData.detailFields || {};
      const bil_murid = Number(fields.bil_murid_jumlah || 0);
      const bil_guru = Number(fields.bil_guru_berkelayakan || 0) + Number(fields.bil_guru_tidak_berkelayakan || 0);
      const tahun_dikemaskini = String(fields.tahun_data || new Date().getFullYear().toString());

      try {
        await db.collection("institusi").doc(institusiId).set({
          bil_murid,
          bil_guru,
          bilGuru: bil_guru,
          tahun_dikemaskini,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Server Audit Logging
        await db.collection("audit_logs").add({
          entityType: "institusi",
          entityId: institusiId,
          actionType: "sync_institusi",
          description: `[Server Sync] Data statistik e-profil diselaraskan secara automatik daripada BPS DATA 01 (Murid: ${bil_murid}, Guru: ${bil_guru}, Tahun: ${tahun_dikemaskini})`,
          performedBy: "SPS Backend Automation",
          performedEmail: "system@moe.gov.my",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: { triggerBorangId: docId, source: "Cloud Functions" }
        });

        console.log(`[Functions Sync] Berjaya menyelaraskan statistik murid/guru bagi institusi ${institusiId}`);
      } catch (err: any) {
        console.error(`[Functions Sync Error] Gagal menyelaraskan statistik: ${err.message}`);
        
        await db.collection("audit_logs").add({
          entityType: "borang",
          entityId: docId,
          actionType: "sync_error",
          description: `[Functions Error] Kegagalan selaras data statistik untuk institusi ${institusiId}: ${err.message}`,
          performedBy: "SPS Backend Automation",
          performedEmail: "system@moe.gov.my",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: { error: err.message }
        });
      }
    }

    // 2. STATUS-TRIGGERED ALIGNED CHANGELOGS (Strictly on transition to "lulus")
    if (oldStatus !== newStatus && newStatus === "lulus") {
      let updatePayload: Record<string, any> = {};
      let syncLogMsg = "";

      const fields = afterData.detailFields || {};

      if (normalizedBorang.includes("BPS XII") || normalizedBorang.includes("BPS_XII")) {
        const namaBaru = String(fields.nama_baharu || "");
        if (namaBaru) {
          updatePayload = {
            nama_gb: namaBaru,
            namaGB: namaBaru,
            nama_pengetua: namaBaru,
            namaPengetua: namaBaru,
            pengelola: namaBaru
          };
          syncLogMsg = `Kepimpinan/SPS Guru Besar baru didaftarkan kepada "${namaBaru}"`;
        }
      } else if (normalizedBorang.includes("BPS IV") || normalizedBorang.includes("BPS_IV")) {
        const yuranCadangan = Number(fields.yuran_cadangan || 0);
        if (yuranCadangan > 0) {
          updatePayload = {
            yuran_semasa: yuranCadangan,
            yuranSemasa: yuranCadangan
          };
          syncLogMsg = `Struktur kadar yuran pengajian rujukan diselaraskan kepada RM${yuranCadangan}`;
        }
      } else if (normalizedBorang.includes("BPS VI") || normalizedBorang.includes("BPS_VI")) {
        const alamatBaharu = String(fields.alamat_baharu || "");
        if (alamatBaharu) {
          updatePayload = {
            alamat_premis: alamatBaharu,
            alamat: alamatBaharu
          };
          syncLogMsg = `Premis berlesen dipindahkan ke alamat baru: "${alamatBaharu}"`;
        }
      } else if (normalizedBorang.includes("BPS VII") || normalizedBorang.includes("BPS_VII")) {
        const namaBaharu = String(fields.nama_baharu_dicadangkan || "");
        if (namaBaharu) {
          updatePayload = {
            nama: namaBaharu,
            namaInstitusi: namaBaharu
          };
          syncLogMsg = `Nama rasmi institusi diselaraskan kepada "${namaBaharu}"`;
        }
      } else if (normalizedBorang.includes("BPS VIII") || normalizedBorang.includes("BPS_VIII")) {
        updatePayload = {
          statusOperasi: "tidak aktif",
          status: "Tidak Aktif"
        };
        syncLogMsg = "Pemberhentian urusan operasi berjaya, status diubah kepada Tidak Aktif";
      } else if (normalizedBorang.includes("BORANG A") || normalizedBorang.includes("BORANG_A")) {
        updatePayload = {
          statusOperasi: "aktif",
          status: "Aktif / Berdaftar"
        };
        syncLogMsg = "Pengesindiran kelulusan pendaftaran berjaya, status diubah kepada Aktif";
      }

      if (Object.keys(updatePayload).length > 0) {
        try {
          updatePayload.updatedAt = admin.firestore.FieldValue.serverTimestamp();
          await db.collection("institusi").doc(institusiId).set(updatePayload, { merge: true });

          // Server audit log for this sync action
          await db.collection("audit_logs").add({
            entityType: "institusi",
            entityId: institusiId,
            actionType: "sync_institusi",
            description: `[Server Sync] ${syncLogMsg} (Berasaskan trigger borang rujukan ${jenisBorang})`,
            performedBy: "SPS Backend Automation",
            performedEmail: "system@moe.gov.my",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: { triggerBorangId: docId, payload: updatePayload, source: "Cloud Functions" }
          });

          console.log(`[Functions Sync] Berjaya melakukan sync dua hala lulus untuk borang ${docId} -> institusi ${institusiId}`);
        } catch (err: any) {
          console.error(`[Functions Sync Error] Gagal melakukan sync lulus : ${err.message}`);
          
          await db.collection("audit_logs").add({
            entityType: "borang",
            entityId: docId,
            actionType: "sync_error",
            description: `[Functions Error] Gagal menyelaraskan kemas kini lulus untuk institusi ${institusiId}: ${err.message}`,
            performedBy: "SPS Backend Automation",
            performedEmail: "system@moe.gov.my",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: { error: err.message }
          });
        }
      }
    }
  }
);
