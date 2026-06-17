import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../../lib/firebase";

export interface KelasRecord {
  id: string;
  namaKelas: string;
  tahap: string;
  bilanganMurid: number;
  kapasitiMaksimum?: number;
}

export interface MuridRecord {
  id: string;
  nama: string;
  kelasId: string;
  kelasNama: string;
  jantina: "Lelaki" | "Perempuan";
  umur: number;
  umurTahun?: number;
}

export interface GuruRecord {
  id: string;
  nama: string;
  icNumber: string; // Will show masked in UI: XXXXXX-XX-XXXX
  jawatan: string;
  subjek: string;
  status: "Aktif" | "Cuti" | "Keluar";
  jantina?: "Lelaki" | "Perempuan" | "Lain-lain" | string;
  noPermit?: string;
  tarikhMulaPermit?: string;
  tarikhTamatPermit?: string;
  tahapPendidikanSemasa?: string;
}

export interface ProgramRecord {
  id: string;
  nama: string;
  tarikh: string;
  penerangan: string;
  bilPeserta: number;
  status: "Dirancang" | "Selesai" | "Dibatalkan";
}

// 2A: Profil Institusi Functions
export async function getPortalProfile(institusiId: string) {
  const path = `institusi/${institusiId}`;
  try {
    const docRef = doc(db, "institusi", institusiId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function updatePortalProfile(institusiId: string, data: any) {
  const path = `institusi/${institusiId}`;
  try {
    const docRef = doc(db, "institusi", institusiId);
    
    // Simulate completion calculation for demo
    let statusProfil = data.statusProfil || "belum-mula";
    let completionPercentage = data.completionPercentage || 0;
    
    // If the data has profile updates
    if (data.namaInstitusi || data.pengelola || data.telefon || data.alamat) {
      completionPercentage = Math.min(100, (completionPercentage || 0) + 25);
      statusProfil = completionPercentage >= 100 ? "lengkap" : "sedang-dikemaskini";
    }

    const mergedData = { 
        ...data, 
        statusProfil, 
        completionPercentage 
    };

    await setDoc(docRef, mergedData, { merge: true });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 2B: Kelas & Murid Functions
export async function getKelasList(institusiId: string): Promise<KelasRecord[]> {
  const path = `institusi/${institusiId}/kelas`;
  try {
    const collRef = collection(db, "institusi", institusiId, "kelas");
    const snap = await getDocs(query(collRef, orderBy("namaKelas", "asc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as KelasRecord));
  } catch (err: any) {
    // If not found or subcollection is empty/not configured
    try {
      const collRef = collection(db, "institusi", institusiId, "kelas");
      const snap = await getDocs(collRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as KelasRecord));
    } catch (fallback) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  }
}

export async function triggerProgressUpdate(institusiId: string, addedPct: number) {
  try {
    const docRef = doc(db, "institusi", institusiId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    
    let currentPct = snap.data().completionPercentage || 0;
    let newPct = Math.min(100, currentPct + addedPct);
    let newStatus = newPct >= 100 ? "lengkap" : "sedang-dikemaskini";

    await setDoc(docRef, {
      completionPercentage: newPct,
      statusProfil: newStatus
    }, { merge: true });
  } catch (err) {
    console.warn("Failed to trigger progress update:", err);
  }
}

export async function addKelasRecord(institusiId: string, record: Omit<KelasRecord, "id">): Promise<string> {
  const path = `institusi/${institusiId}/kelas`;
  try {
    const collRef = collection(db, "institusi", institusiId, "kelas");
    const docRef = await addDoc(collRef, record);
    await triggerProgressUpdate(institusiId, 5);
    return docRef.id;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function getMuridList(institusiId: string): Promise<MuridRecord[]> {
  const path = `institusi/${institusiId}/murid`;
  try {
    const collRef = collection(db, "institusi", institusiId, "murid");
    const snap = await getDocs(query(collRef, orderBy("nama", "asc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MuridRecord));
  } catch (err: any) {
    try {
      const collRef = collection(db, "institusi", institusiId, "murid");
      const snap = await getDocs(collRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MuridRecord));
    } catch (fallback) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  }
}

export async function addMuridRecord(institusiId: string, record: Omit<MuridRecord, "id">): Promise<string> {
  const path = `institusi/${institusiId}/murid`;
  try {
    const collRef = collection(db, "institusi", institusiId, "murid");
    const docRef = await addDoc(collRef, record);
    return docRef.id;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

// 2C: Guru Functions
export async function getGuruList(institusiId: string): Promise<GuruRecord[]> {
  const path = `institusi/${institusiId}/guru`;
  try {
    const collRef = collection(db, "institusi", institusiId, "guru");
    const snap = await getDocs(query(collRef, orderBy("nama", "asc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GuruRecord));
  } catch (err: any) {
    try {
      const collRef = collection(db, "institusi", institusiId, "guru");
      const snap = await getDocs(collRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as GuruRecord));
    } catch (fallback) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  }
}

export async function addGuruRecord(institusiId: string, record: Omit<GuruRecord, "id">): Promise<string> {
  const path = `institusi/${institusiId}/guru`;
  try {
    const collRef = collection(db, "institusi", institusiId, "guru");
    const docRef = await addDoc(collRef, record);
    return docRef.id;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

// 2D: Program Functions
export async function getProgramList(institusiId: string): Promise<ProgramRecord[]> {
  const path = `institusi/${institusiId}/program`;
  try {
    const collRef = collection(db, "institusi", institusiId, "program");
    const snap = await getDocs(query(collRef, orderBy("tarikh", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProgramRecord));
  } catch (err: any) {
    try {
      const collRef = collection(db, "institusi", institusiId, "program");
      const snap = await getDocs(collRef);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProgramRecord));
    } catch (fallback) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  }
}

export async function addProgramRecord(institusiId: string, record: Omit<ProgramRecord, "id">): Promise<string> {
  const path = `institusi/${institusiId}/program`;
  try {
    const collRef = collection(db, "institusi", institusiId, "program");
    const docRef = await addDoc(collRef, record);
    return docRef.id;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}
