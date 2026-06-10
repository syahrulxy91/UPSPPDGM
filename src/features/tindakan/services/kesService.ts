import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../../lib/firebase";
import { TindakanRecord, StatusKes, KeutamaanKes } from "../../../types/tindakan";

export async function getTindakanList(): Promise<TindakanRecord[]> {
  const path = "tindakan";
  try {
    const q = query(collection(db, path), orderBy("tarikhTindakan", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();

      const namaInstitusi = String(data.namaInstitusi ?? data.institusiNama ?? "");
      const jenisKes = String(data.jenisKes ?? data.jenisTindakan ?? "Penambahbaikan Premis");
      const pegawai = String(data.pegawai ?? "Pegawai PPD Gua Musang");

      const rawStatus = String(data.statusKes ?? data.statusTindakan ?? "baru").toLowerCase();
      let statusKes: StatusKes = "baru";
      if (rawStatus.includes("proses") || rawStatus.includes("tindakan") || rawStatus === "dalam tindakan") {
        statusKes = "dalam tindakan";
      } else if (rawStatus.includes("overdue") || rawStatus === "overdue") {
        statusKes = "overdue";
      } else if (rawStatus.includes("selesai") || rawStatus === "selesai") {
        statusKes = "selesai";
      }

      const rawKeutamaan = String(data.keutamaan ?? "sederhana").toLowerCase();
      let keutamaan: KeutamaanKes = "sederhana";
      if (rawKeutamaan === "tinggi") {
        keutamaan = "tinggi";
      } else if (rawKeutamaan === "rendah") {
        keutamaan = "rendah";
      }

      const tarikhTindakan = String(data.tarikhTindakan ?? data.tarikhRujukan ?? data.updatedAt ?? "");
      const jenisAktiviti = data.jenisAktiviti ? String(data.jenisAktiviti) : "";
      const catatan = data.catatan ?? data.keterangan ? String(data.catatan ?? data.keterangan) : "";

      return {
        id: doc.id,
        namaInstitusi,
        jenisKes,
        pegawai,
        statusKes,
        keutamaan,
        tarikhTindakan,
        jenisAktiviti,
        catatan,
      };
    });
  } catch (err: any) {
    try {
      const qFallback = query(collection(db, path));
      const snapshot = await getDocs(qFallback);
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();

        const namaInstitusi = String(data.namaInstitusi ?? data.institusiNama ?? "");
        const jenisKes = String(data.jenisKes ?? data.jenisTindakan ?? "Penambahbaikan Premis");
        const pegawai = String(data.pegawai ?? "Pegawai PPD Gua Musang");

        const rawStatus = String(data.statusKes ?? data.statusTindakan ?? "baru").toLowerCase();
        let statusKes: StatusKes = "baru";
        if (rawStatus.includes("proses") || rawStatus.includes("tindakan") || rawStatus === "dalam tindakan") {
          statusKes = "dalam tindakan";
        } else if (rawStatus.includes("overdue") || rawStatus === "overdue") {
          statusKes = "overdue";
        } else if (rawStatus.includes("selesai") || rawStatus === "selesai") {
          statusKes = "selesai";
        }

        const rawKeutamaan = String(data.keutamaan ?? "sederhana").toLowerCase();
        let keutamaan: KeutamaanKes = "sederhana";
        if (rawKeutamaan === "tinggi") {
          keutamaan = "tinggi";
        } else if (rawKeutamaan === "rendah") {
          keutamaan = "rendah";
        }

        const tarikhTindakan = String(data.tarikhTindakan ?? data.tarikhRujukan ?? data.updatedAt ?? "");
        const jenisAktiviti = data.jenisAktiviti ? String(data.jenisAktiviti) : "";
        const catatan = data.catatan ?? data.keterangan ? String(data.catatan ?? data.keterangan) : "";

        return {
          id: doc.id,
          namaInstitusi,
          jenisKes,
          pegawai,
          statusKes,
          keutamaan,
          tarikhTindakan,
          jenisAktiviti,
          catatan,
        };
      });
      // Sort desc by tarikhTindakan in memory
      return list.sort((a, b) => b.tarikhTindakan.localeCompare(a.tarikhTindakan));
    } catch (fallbackErr) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }
}

export default getTindakanList;
