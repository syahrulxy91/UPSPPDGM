import { collection, getDocs, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../../lib/firebase";
import { PematuhanRecord, StatusDokumen } from "../../../types/pematuhan";
import { InstitusiKategori } from "../../../types/institusi";

export async function createPematuhanRecord(record: Omit<PematuhanRecord, "id"> & Record<string, any>): Promise<string> {
  const path = "pematuhan";
  try {
    const docRef = await addDoc(collection(db, path), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getPematuhanList(): Promise<PematuhanRecord[]> {
  const path = "pematuhan";
  try {
    const q = query(collection(db, path), orderBy("namaInstitusi", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();

      const namaInstitusi = String(data.namaInstitusi ?? data.institusiNama ?? "");
      
      const rawKategori = String(data.kategori ?? data.jenis ?? "tadika swasta").toLowerCase();
      let kategori: InstitusiKategori = "tadika swasta";
      if (rawKategori.includes("sekolah")) kategori = "sekolah swasta";
      else if (rawKategori.includes("tuisyen")) kategori = "pusat tuisyen";

      const zon = String(data.zon ?? data.daerah ?? "");
      const jenisDokumen = String(data.jenisDokumen ?? data.catatan ?? "Surat Kebenaran Premis");

      const rawStatus = String(data.statusDokumen ?? data.statusPematuhan ?? "lengkap").toLowerCase();
      let statusDokumen: StatusDokumen = "lengkap";
      if (rawStatus.includes("tidak") || rawStatus === "tidak lengkap") {
        statusDokumen = "tidak lengkap";
      } else if (rawStatus.includes("syarat") || rawStatus.includes("hampir") || rawStatus === "hampir luput") {
        statusDokumen = "hampir luput";
      }

      const tarikhTamat = data.tarikhTamat ?? data.tarikhPemeriksaan ? String(data.tarikhTamat ?? data.tarikhPemeriksaan) : "";
      
      // tindakanSegera is true if set explicitly or if status is tidak lengkap/tidak patuh
      const tindakanSegera = Boolean(data.tindakanSegera ?? (rawStatus.includes("tidak")));

      const pegawai = data.pegawai ?? data.pegawaiPemeriksa ? String(data.pegawai ?? data.pegawaiPemeriksa) : "";

      return {
        id: doc.id,
        namaInstitusi,
        kategori,
        zon,
        jenisDokumen,
        statusDokumen,
        tarikhTamat,
        tindakanSegera,
        pegawai,
      };
    });
  } catch (err: any) {
    try {
      const qFallback = query(collection(db, path));
      const snapshot = await getDocs(qFallback);
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();

        const namaInstitusi = String(data.namaInstitusi ?? data.institusiNama ?? "");
        
        const rawKategori = String(data.kategori ?? data.jenis ?? "tadika swasta").toLowerCase();
        let kategori: InstitusiKategori = "tadika swasta";
        if (rawKategori.includes("sekolah")) kategori = "sekolah swasta";
        else if (rawKategori.includes("tuisyen")) kategori = "pusat tuisyen";

        const zon = String(data.zon ?? data.daerah ?? "");
        const jenisDokumen = String(data.jenisDokumen ?? data.catatan ?? "Surat Kebenaran Premis");

        const rawStatus = String(data.statusDokumen ?? data.statusPematuhan ?? "lengkap").toLowerCase();
        let statusDokumen: StatusDokumen = "lengkap";
        if (rawStatus.includes("tidak") || rawStatus === "tidak lengkap") {
          statusDokumen = "tidak lengkap";
        } else if (rawStatus.includes("syarat") || rawStatus.includes("hampir") || rawStatus === "hampir luput") {
          statusDokumen = "hampir luput";
        }

        const tarikhTamat = data.tarikhTamat ?? data.tarikhPemeriksaan ? String(data.tarikhTamat ?? data.tarikhPemeriksaan) : "";
        const tindakanSegera = Boolean(data.tindakanSegera ?? (rawStatus.includes("tidak")));
        const pegawai = data.pegawai ?? data.pegawaiPemeriksa ? String(data.pegawai ?? data.pegawaiPemeriksa) : "";

        return {
          id: doc.id,
          namaInstitusi,
          kategori,
          zon,
          jenisDokumen,
          statusDokumen,
          tarikhTamat,
          tindakanSegera,
          pegawai,
        };
      });
      return list.sort((a, b) => a.namaInstitusi.localeCompare(b.namaInstitusi));
    } catch (fallbackErr) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }
}

export default getPematuhanList;
