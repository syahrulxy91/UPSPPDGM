import { BorangRecord, BorangStatus } from "../../../types/borang";
import { getBorangList } from "./borangService";
import { updateInstitusiRecord } from "../../institusi/services/institusiService";
import { getBorangMetadata, BORANG_METADATA_REGISTRY } from "../constants/borangMetadata";

/**
 * =========================================================================
 * ARCHITECTURE FOR CLOUD FUNCTIONS MIGRATION (BACKEND-READY DESIGN)
 * =========================================================================
 * 
 * The business logics inside this domain can be easily ported to Firebase Cloud Functions:
 * 
 * 1. TWO-WAY DATA SYNCHRONIZATION (Firestore Trigger: Trigger'onWrite' or 'onUpdate'):
 *    --------------------------------------------------------------------------
 *    exports.syncBorangToInstitusi = functions.firestore
 *      .document('borang/{borangId}')
 *      .onUpdate(async (change, context) => {
 *        const before = change.before.data();
 *        const after = change.after.data();
 *        if (before.status !== after.status && after.status === 'lulus') {
 *          // Call domain sync engine
 *          await runSyncEngine(context.params.borangId, after);
 *        }
 *      });
 * 
 * 2. DAILY AUTOMATED REMINDERS (Pub/Sub Scheduled Cloud Function):
 *    --------------------------------------------------------------------------
 *    exports.scheduledReminderWorker = functions.pubsub
 *      .schedule('every 24 hours')
 *      .onRun(async (context) => {
 *         // Query draf > 7 days or dikemukakan > 14 days
 *         // Send email/push notification
 *      });
 */

interface SyncResult {
  success: boolean;
  message: string;
}

/**
 * Domain engine to run two-way synchronization from a Borang record onto the associated IPS (Institusi).
 * Made pure, decoupled, and reusable so it can be ported directly into Cloud Functions.
 */
export async function syncBorangToInstitusi(
  borang: BorangRecord,
  statusBaharu: BorangStatus,
  performer?: { email: string; role: string }
): Promise<SyncResult> {
  console.log("[Domain Logic] Memulakan penyelarasan data rujukan institusi...", {
    borangId: borang.id,
    status: statusBaharu,
    jenis: borang.jenisBorang,
  });

  // Extract the standard code from metadata center
  const jBorangCode = Object.keys(BORANG_METADATA_REGISTRY).find(
    key => BORANG_METADATA_REGISTRY[key].label === borang.jenisBorang || key === borang.jenisBorang
  ) || borang.jenisBorang;

  let syncSuccess = false;
  let message = "Tiada parameter perubahan khas dikesan untuk borang jenis ini.";

  try {
    // 1. STATISTIC DATA (BPS_DATA_01)
    if (jBorangCode === "BPS_DATA_01" && (statusBaharu === "dikemukakan" || statusBaharu === "lulus" || statusBaharu === "diproses")) {
      const bil_murid = Number(borang.detailFields?.bil_murid_jumlah || 0);
      const bil_guru = Number(borang.detailFields?.bil_guru_berkelayakan || 0) + Number(borang.detailFields?.bil_guru_tidak_berkelayakan || 0);
      const tahun_dikemaskini = String(borang.detailFields?.tahun_data || new Date().getFullYear().toString());

      await updateInstitusiRecord(borang.institusiId, {
        bil_murid,
        bil_guru,
        bilGuru: bil_guru,
        tahun_dikemaskini,
      }, performer);

      syncSuccess = true;
      message = `Data statistik berjaya diselaraskan secara automatik (Murid: ${bil_murid}, Guru: ${bil_guru}, Tahun: ${tahun_dikemaskini})`;
    }

    // 2. OTHER FORMS SYNCS (Only when approved - "lulus")
    if (statusBaharu === "lulus") {
      switch (jBorangCode) {
        case "BPS_XII": {
          const namaBaru = String(borang.detailFields?.nama_baharu || "");
          if (namaBaru) {
            await updateInstitusiRecord(borang.institusiId, {
              nama_gb: namaBaru,
              namaGB: namaBaru,
              nama_pengetua: namaBaru,
              namaPengetua: namaBaru,
              pengelola: namaBaru
            }, performer);
            syncSuccess = true;
            message = `Selesai lulus BPS XII: Kepimpinan/GB diselaraskan kepada "${namaBaru}" secara selamat.`;
          }
          break;
        }
        case "BPS_IV": {
          const yuranCadangan = Number(borang.detailFields?.yuran_cadangan || 0);
          if (yuranCadangan > 0) {
            await updateInstitusiRecord(borang.institusiId, {
              yuran_semasa: yuranCadangan,
              yuranSemasa: yuranCadangan
            }, performer);
            syncSuccess = true;
            message = `Selesai lulus BPS IV: Yuran pengajian rujukan kini berkuatkuasa RM${yuranCadangan}`;
          }
          break;
        }
        case "BPS_VI": {
          const alamatBaharu = String(borang.detailFields?.alamat_baharu || "");
          if (alamatBaharu) {
            await updateInstitusiRecord(borang.institusiId, {
              alamat_premis: alamatBaharu,
              alamat: alamatBaharu
            }, performer);
            syncSuccess = true;
            message = `Selesai lulus BPS VI: Rekod alamat rasmi premis telah dipindahkan ke "${alamatBaharu}"`;
          }
          break;
        }
        case "BPS_VII": {
          const namaBaharu = String(borang.detailFields?.nama_baharu_dicadangkan || "");
          if (namaBaharu) {
            await updateInstitusiRecord(borang.institusiId, {
              nama: namaBaharu,
              namaInstitusi: namaBaharu
            }, performer);
            syncSuccess = true;
            message = `Selesai lulus BPS VII: Tukar nama rasmi institusi kepada "${namaBaharu}"`;
          }
          break;
        }
        case "BPS_VIII": {
          await updateInstitusiRecord(borang.institusiId, {
            statusOperasi: "tidak aktif",
            status: "Tidak Aktif"
          }, performer);
          syncSuccess = true;
          message = "Selesai lulus BPS VIII: Status institusi kini diisytiharkan ditutup/TIDAK AKTIF";
          break;
        }
        case "BORANG_A": {
          await updateInstitusiRecord(borang.institusiId, {
            statusOperasi: "aktif",
            status: "Aktif / Berdaftar"
          }, performer);
          syncSuccess = true;
          message = "Selesai lulus BORANG A: Status institusi kini diisytiharkan AKTIF & BERDAFTAR";
          break;
        }
        default:
          break;
      }
    }

    return {
      success: syncSuccess,
      message,
    };
  } catch (error: any) {
    console.error("[Domain Error] Ralat semasa pelaksanaan sync automatik:", error);
    return {
      success: false,
      message: `Gagal menyelaraskan rekodi institusi berkaitan: ${error.message || error}`,
    };
  }
}
