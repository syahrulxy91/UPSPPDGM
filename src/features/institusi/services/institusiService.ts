import { collection, getDocs, getDoc, orderBy, query, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, functions, rawFirebaseConfig } from "../../../lib/firebase";
import { InstitusiRecord, InstitusiKategori, InstitusiStatus, PortalAccess } from "../../../types/institusi";
import { createAuditLog } from "../../../shared/services/auditLogService";
import { httpsCallable } from "firebase/functions";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";


export async function getInstitusiById(id: string): Promise<InstitusiRecord | null> {
  try {
    const docRef = doc(db, "institusi", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as InstitusiRecord;
    }
  } catch (err) {
    console.warn("getInstitusiById:", err);
  }
  return null;
}

export async function getInstitusiList(): Promise<InstitusiRecord[]> {
  const path = "institusi";
  try {
    console.log("Firebase DB instance:", db.app.name, db.type);
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => {
      const data = doc.data();
      
      const namaInstitusi = String(data.namaInstitusi ?? data.nama ?? "").trim();
      const rawKategori = String(data.kategori ?? data.jenis ?? "tadika swasta").toLowerCase();
      let kategori: InstitusiKategori = "tadika swasta";
      if (rawKategori.includes("sekolah")) kategori = "sekolah swasta";
      else if (rawKategori.includes("tuisyen")) kategori = "pusat tuisyen";
      
      const zon = String(data.zon ?? data.daerah ?? "");
      const mukim = String(data.mukim ?? "");
      
      const rawStatus = String(data.statusOperasi ?? data.statusPendaftaran ?? "aktif").toLowerCase();
      let statusOperasi: InstitusiStatus = "aktif";
      if (rawStatus.includes("tidak") || rawStatus === "tamat tempoh") {
        statusOperasi = "tidak aktif";
      } else if (rawStatus.includes("gantung")) {
        statusOperasi = "digantung";
      }

      const tarikhDaftar = String(data.tarikhDaftar ?? data.updatedAt ?? "");
      const noRujukan = String(data.noRujukan ?? data.kod ?? "");
      const alamat = String(data.alamat ?? "");
      const pengelola = data.pengelola ?? data.pendaftar ? String(data.pengelola ?? data.pendaftar) : "";
      const telefon = data.telefon ?? data.noTelefon ? String(data.telefon ?? data.noTelefon) : "";

      return {
        id: doc.id,
        namaInstitusi,
        kategori,
        zon,
        mukim,
        statusOperasi,
        tarikhDaftar,
        noRujukan,
        alamat,
        pengelola,
        telefon,
        yuran_semasa: data.yuran_semasa ? Number(data.yuran_semasa) : undefined,
        yuranSemasa: data.yuranSemasa ? Number(data.yuranSemasa) : undefined,
        nama_gb: data.nama_gb ? String(data.nama_gb) : undefined,
        namaGB: data.namaGB ? String(data.namaGB) : undefined,
        nama_pengetua: data.nama_pengetua ? String(data.nama_pengetua) : undefined,
        namaPengetua: data.namaPengetua ? String(data.namaPengetua) : undefined,
        alamat_premis: data.alamat_premis ? String(data.alamat_premis) : undefined,
        bil_murid: data.bil_murid ? Number(data.bil_murid) : undefined,
        bilGuru: data.bilGuru ? Number(data.bilGuru) : undefined,
        bil_guru: data.bil_guru ? Number(data.bil_guru) : undefined,
        tahun_dikemaskini: data.tahun_dikemaskini ? String(data.tahun_dikemaskini) : undefined,
        portalAccess: data.portalAccess || undefined,
        statusProfil: data.statusProfil || "belum-mula",
        statusPendaftaran: data.statusPendaftaran || "didaftarkan-awal",
        completionPercentage: typeof data.completionPercentage === 'number' ? data.completionPercentage : 0,
        source: data.source || "pendaftaran-baru"
      };
    });
    return list.sort((a, b) => a.namaInstitusi.localeCompare(b.namaInstitusi));
  } catch (err: any) {
    loggerErr(err);
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

function loggerErr(err: any) {
  console.warn("Fallback explicit error:", err);
}

export async function syncSingleInstitusiToPublic(id: string): Promise<void> {
  try {
    const docRef = doc(db, "institusi", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const pAcc = data.portalAccess || {};
      const isBound = !!(pAcc.boundGoogleEmail || pAcc.boundEmail);
      const isBlocked = !!(pAcc.enabled === false || pAcc.credentialStatus === "disekat" || pAcc.authStatus === "disekat");
      
      const publicData = {
        id,
        namaInstitusi: data.namaInstitusi || data.nama || "",
        noRujukan: data.noRujukan || "",
        statusOperasi: data.statusOperasi || data.statusPendaftaran || "aktif",
        portalAccess: {
          enabled: pAcc.enabled !== false,
          credentialStatus: pAcc.credentialStatus || "aktif",
          authStatus: pAcc.authStatus || "aktif",
          boundEmail: isBound ? (pAcc.boundEmail || pAcc.boundGoogleEmail) : null,
          boundGoogleEmail: isBound ? (pAcc.boundGoogleEmail || pAcc.boundEmail) : null,
        },
        _isBound: isBound,
        _boundEmail: isBound ? (pAcc.boundGoogleEmail || pAcc.boundEmail) : null,
        _isBlocked: isBlocked
      };
      await setDoc(doc(db, "institusiPublic", id), publicData, { merge: true });
      console.log(`[Automatic Provisioning] Synced ${id} to institusiPublic successfully.`);
    } else {
      await deleteDoc(doc(db, "institusiPublic", id));
      console.log(`[Automatic Provisioning] Deleted ${id} from institusiPublic.`);
    }
  } catch (err) {
    console.error(`Gagal syncSingleInstitusiToPublic untuk ${id}:`, err);
  }
}

export async function updateInstitusiRecord(
  id: string, 
  record: Partial<InstitusiRecord> & Record<string, any>,
  performer?: { email: string; role: string }
): Promise<void> {
  const path = "institusi";
  try {
    const docRef = doc(db, path, id);
    const updates = { ...record };
    delete updates.id;
    await setDoc(docRef, updates, { merge: true });

    // Try logging
    const updatedKeys = Object.keys(record).filter(k => k !== "id");
    await createAuditLog({
      entityType: "institusi",
      entityId: id,
      actionType: "kemas_kini",
      description: `Kemaskini maklumat institusi: [${updatedKeys.join(", ")}]`,
      performedBy: performer?.role || "pegawai_ppd",
      performedEmail: performer?.email || "unit.swasta@moe.gov.my",
      metadata: { recordKeys: updatedKeys }
    });

    // Auto-sync update to public credentials list
    await syncSingleInstitusiToPublic(id);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `${path}/${id}`);
  }
}

export interface CreateInstitusiResponse {
  id: string;
  namaInstitusi: string;
  status: string;
  createdAt: string;
}

export async function createInstitusiRecord(
  record: Omit<InstitusiRecord, "id"> & Record<string, any>,
  performer?: { email: string; role: string }
): Promise<CreateInstitusiResponse> {
  const path = "institusi";
  console.log("createInstitusiRecord start");
  try {
    const docRef = doc(collection(db, path));
    const newId = docRef.id;
    
    // Construct database document aligned with schemas (including compatibility)
    const writeData = {
      ...record,
      id: newId,
      // Compatibility attributes
      nama: record.namaInstitusi,
      jenis: record.kategori,
      daerah: record.zon,
      pendaftar: record.pengelola || "",
      noTelefon: record.telefon || record.noTelefon || "",
      statusPendaftaran: record.statusPendaftaran || "didaftarkan-awal",
      statusOperasi: record.statusOperasi || "aktif",
      status: record.status || record.statusOperasi || "aktif",
      kod: record.noRujukan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: record.source || "ppdgm-name-only-registration",
      portalAccess: record.portalAccess || {
        enabled: true,
        credentialStatus: "aktif",
        loginReady: true,
        authUid: newId,
        authStatus: "aktif"
      }
    };

    await setDoc(docRef, writeData);
    console.log("createInstitusiRecord success");

    // Auto-sync write to public collection so manual syncing is entirely redundant
    try {
      const pubRef = doc(db, "institusiPublic", newId);
      const pAcc = writeData.portalAccess || {};
      const isBound = !!(pAcc.boundGoogleEmail || pAcc.boundEmail);
      const isBlocked = !!(pAcc.enabled === false || pAcc.credentialStatus === "disekat" || pAcc.authStatus === "disekat");
      await setDoc(pubRef, {
        id: newId,
        namaInstitusi: writeData.namaInstitusi,
        noRujukan: writeData.noRujukan || "",
        statusOperasi: writeData.statusOperasi || "aktif",
        portalAccess: {
          enabled: pAcc.enabled !== false,
          credentialStatus: pAcc.credentialStatus || "aktif",
          authStatus: pAcc.authStatus || "aktif",
          boundEmail: isBound ? (pAcc.boundEmail || pAcc.boundGoogleEmail) : null,
          boundGoogleEmail: isBound ? (pAcc.boundGoogleEmail || pAcc.boundEmail) : null,
        },
        _isBound: isBound,
        _boundEmail: isBound ? (pAcc.boundGoogleEmail || pAcc.boundEmail) : null,
        _isBlocked: isBlocked
      }, { merge: true });
      console.log(`[Automatic Provisioning] Created public login record automatically for ${newId}`);
    } catch (pubErr) {
      console.warn("Gagal auto-sync institusiPublic pada pendaftaran awal:", pubErr);
    }

    // Create Audit Log with try-catch safety block to avoid trapping main submit flow
    try {
      await createAuditLog({
        entityType: "institusi",
        entityId: newId,
        actionType: "cipta",
        description: `Pendaftaran institusi baharu: ${record.namaInstitusi}`,
        performedBy: performer?.role || "pegawai_ppd",
        performedEmail: performer?.email || "unit.swasta@moe.gov.my",
        metadata: { recordKeys: Object.keys(writeData) }
      });
      console.log("audit log success");
    } catch (auditError: any) {
      console.warn("Sistem gagal mencatatkan audit log, pendaftaran utama diteruskan:", auditError);
      console.log("audit log fail");
    }

    return {
      id: newId,
      namaInstitusi: record.namaInstitusi,
      status: record.statusOperasi || "aktif",
      createdAt: writeData.createdAt
    };
  } catch (err: any) {
    console.log("createInstitusiRecord fail:", err?.message || err);
    if (err?.message?.includes("Missing or insufficient permissions") || err?.code === "permission-denied") {
      throw new Error("Akses mencipta rekod institusi tidak dibenarkan oleh dasar keselamatan semasa. Sila semak konfigurasi akses pegawai PPDGM atau format borang.");
    }
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function updateInstitusiAccess(
  id: string,
  portalAccess: NonNullable<InstitusiRecord["portalAccess"]>,
  performer?: { email: string; role: string },
  actionMsg?: string
): Promise<void> {
  const path = "institusi";
  try {
    const docRef = doc(db, path, id);
    await setDoc(docRef, { portalAccess }, { merge: true });

    // Create Audit Log
    await createAuditLog({
      entityType: "institusi",
      entityId: id,
      actionType: "tukar_status",
      description: actionMsg || `Pengurusan akses portal dikemaskini bagi institusi ini.`,
      performedBy: performer?.role || "pegawai_ppd",
      performedEmail: performer?.email || "unit.swasta@moe.gov.my",
      metadata: { credentialStatus: portalAccess.credentialStatus, enabled: portalAccess.enabled }
    });

    // Auto-sync update to public credentials list
    await syncSingleInstitusiToPublic(id);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `${path}/${id}`);
  }
}



export async function bindInstitutionAccessClient(
  institusiId: string,
  user: any,
  pAcc: any
): Promise<{ success: boolean; bindingCreated: boolean }> {
  try {
    const normalizedEmail = user.email.toLowerCase().trim();
    
    // Check if already explicitly blocked
    const isExplicitlyBlocked = pAcc && (pAcc.credentialStatus === "disekat" || pAcc.authStatus === "disekat" || (pAcc.enabled === false && pAcc.credentialStatus !== "belum-diset" && pAcc.credentialStatus !== undefined));
    if (isExplicitlyBlocked) {
      throw new Error(`Akses portal bagi institusi ini telah disekat. Sila hubungi Pegawai Swasta PPD Gua Musang.`);
    }

    const boundEmail = pAcc?.boundGoogleEmail || pAcc?.boundEmail;
    
    let updatedPortalAccess;
    let bindingCreated = false;

    if (!boundEmail) {
      // First time bind
      updatedPortalAccess = {
        ...(pAcc || {}),
        enabled: true,
        credentialStatus: "aktif",
        authStatus: "aktif",
        loginReady: true,
        authMode: "google-first-bind",
        boundGoogleEmail: normalizedEmail,
        boundGoogleUid: user.uid,
        boundGoogleDisplayName: user.displayName || null,
        boundAt: new Date().toISOString(),
        boundBy: "self-first-login",
        bindingLocked: true,
        authUid: user.uid,
        boundEmail: normalizedEmail,
        boundUid: user.uid,
      };
      bindingCreated = true;
    } else {
      const normalizedBound = boundEmail.toLowerCase().trim();
      if (normalizedBound === normalizedEmail) {
        // Just sync uid
        updatedPortalAccess = {
          ...pAcc,
          authUid: user.uid,
          boundGoogleUid: user.uid,
          boundUid: user.uid
        };
      } else {
        throw new Error("Institusi ini telah dipautkan kepada akaun Google yang lain. Sila hubungi pegawai PPDGM.");
      }
    }

    const docRef = doc(db, "institusi", institusiId);
    await setDoc(docRef, { portalAccess: updatedPortalAccess }, { merge: true });
    
    // create audit log
    if (bindingCreated) {
      await createAuditLog({
        entityType: "institusi",
        entityId: institusiId,
        actionType: "kemas_kini",
        description: `[Pautan Pertama] Berjaya memautkan emel Google ${normalizedEmail} kepada IPS secara automatik.`,
        performedBy: "institusi",
        performedEmail: normalizedEmail,
        metadata: { boundBy: "self-first-login" }
      }).catch(e => console.warn("Log error", e));
    }

    // Auto-sync update to public credentials list
    await syncSingleInstitusiToPublic(institusiId);

    return { success: true, bindingCreated };
  } catch (err: any) {
    console.error("Client fallback bind error:", err);
    throw new Error(err.message || "Gagal membuat pautan IPS.");
  }
}

/**
 * Orchestrator: callResetInstitutionBinding
 * Resets/clears the bound Google Account for an institution so that they can do a new self-binding.
 */
export async function callResetInstitutionBinding(
  institusiId: string,
  performedBy?: string,
  namaInstitusi?: string
): Promise<{ success: boolean }> {
  // Try Cloud Function
  try {
    const fn = httpsCallable<any, any>(functions, "resetInstitutionBinding");
    const result = await fn({
      institusiId,
      performedBy
    });
    if (result.data && result.data.success) {
      return { success: true };
    }
  } catch (err: any) {
    console.warn("Cloud Function 'resetInstitutionBinding' error or unavailable. Trying resetInstitutionGoogleEmail next:", err.message || err);
    try {
      const fnLegacy = httpsCallable<any, any>(functions, "resetInstitutionGoogleEmail");
      const resultLegacy = await fnLegacy({
        institusiId,
        performedBy
      });
      if (resultLegacy.data && resultLegacy.data.success) {
        return { success: true };
      }
    } catch (errLegacy: any) {
      console.error("Cloud Function 'resetInstitutionGoogleEmail' failed:", errLegacy.message || errLegacy);
      throw new Error(`Gagal set semula pautan Google: ${errLegacy.message || errLegacy}`);
    }
  }

  throw new Error("Gagal menetapkan semula pautan Google. Sila cuba sebentar lagi.");
}

/**
 * Orchestrator: callSetInstitutionAccessState
 * Disables or enables active institutional authentication user.
 */
export async function callSetInstitutionAccessState(
  institusiId: string,
  enabled: boolean,
  performedBy?: string,
  namaInstitusi?: string
): Promise<{ success: boolean }> {
  return callUpdateInstitutionActiveStatus(institusiId, enabled, performedBy, namaInstitusi);
}

/**
 * Orchestrator: callUpdateInstitutionActiveStatus
 * Changes access activation / blocks portal access.
 * Sets portalAccess.enabled = source of truth.
 * Set status IPS = Aktif / Tidak Aktif.
 */
export async function callUpdateInstitutionActiveStatus(
  institusiId: string,
  enabled: boolean,
  performedBy?: string,
  namaInstitusi?: string
): Promise<{ success: boolean }> {
  // Try Cloud Function
  try {
    const fn = httpsCallable<any, any>(functions, "updateInstitutionActiveStatus");
    const result = await fn({
      institusiId,
      enabled,
      performedBy
    });
    if (result.data && result.data.success) {
      return result.data;
    }
  } catch (err: any) {
    console.warn("Cloud Function 'updateInstitutionActiveStatus' failed. Trying setInstitutionAccessState next:", err.message || err);
    try {
      const fnLegacy = httpsCallable<any, any>(functions, "setInstitutionAccessState");
      const resultLegacy = await fnLegacy({
        institusiId,
        enabled,
        performedBy
      });
      if (resultLegacy.data && resultLegacy.data.success) {
        return { success: true };
      }
    } catch (errLegacy: any) {
      console.error("Cloud Function 'setInstitutionAccessState' failed:", errLegacy.message || errLegacy);
      throw new Error(`Gagal menyelaraskan status capaian: ${errLegacy.message || errLegacy}`);
    }
  }

  throw new Error("Gagal menetapkan status capaian IPS. Sila cuba sebentar lagi.");
}

/**
 * Orchestrator: callDeleteInstitutionCompletely
 * Performs a complete hard-delete of the institution from Firestore DB.
 */
export async function callDeleteInstitutionCompletely(
  institusiId: string,
  performedBy?: string,
  namaInstitusi?: string
): Promise<{ success: boolean }> {
  // 1. Try Cloud Function
  try {
    const fn = httpsCallable<any, any>(functions, "deleteInstitutionCompletely");
    const result = await fn({
      institusiId,
      performedBy
    });
    if (result.data && result.data.success) {
      return result.data;
    }
  } catch (err: any) {
    console.warn("Cloud Function 'deleteInstitutionCompletely' failed, compiling direct client fallback:", err.message || err);
  }

  // 2. Fallback: Hard delete directly via Firestore
  try {
    const instPath = "institusi";
    const docRef = doc(db, instPath, institusiId);
    await deleteDoc(docRef);

    // Also delete from institusiPublic automatically
    try {
      await deleteDoc(doc(db, "institusiPublic", institusiId));
      console.log(`[Automatic Deletion] Removed public credentials for ${institusiId}`);
    } catch (pubErr) {
      console.warn("Gagal auto-delete institusiPublic semasa dipadam:", pubErr);
    }

    // Create Audit Log
    await createAuditLog({
      entityType: "institusi",
      entityId: institusiId,
      actionType: "tukar_status",
      description: `[Hard Delete Fallback] Institusi '${namaInstitusi || institusiId}' dipadamkan dari pangkalan data secara kekal.`,
      performedBy: "pegawai_ppd",
      performedEmail: performedBy || "pegawai@ppdgm.gov.my"
    });

    return { success: true };
  } catch (err: any) {
    console.error("Client fallback delete error:", err);
    throw new Error(`Gagal memadam institusi sepenuhnya: ${err.message || err}`);
  }
}



export default getInstitusiList;

// --- PUBLIC QUERY UNTUK LOGIN ROLE INSTITUSI ---
export async function fetchPublicInstitusiList(): Promise<any[]> {
  try {
    const q = query(collection(db, "institusiPublic"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id
    }));
    return list as any[];
  } catch (error) {
    console.error("fetchPublicInstitusiList error:", error);
    throw error;
  }
}

// Auto-sync function (Can be called by PPDGM admin to heal public collection)
export async function syncInstitusiToPublic(): Promise<void> {
  console.log("Memulakan sinkronisasi automatik ke institusiPublic...");
  try {
    const q = query(collection(db, "institusi"));
    const snapshot = await getDocs(q);
    
    const batchPromises = snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const pAcc = data.portalAccess || {};
      
      const isBound = !!(pAcc.boundGoogleEmail || pAcc.boundEmail);
      const isBlocked = !!(pAcc.enabled === false || pAcc.credentialStatus === "disekat" || pAcc.authStatus === "disekat");
      
      const publicData = {
        id: docSnap.id,
        namaInstitusi: data.namaInstitusi || data.nama || "",
        noRujukan: data.noRujukan || "",
        statusOperasi: data.statusOperasi || data.statusPendaftaran || "aktif",
        portalAccess: {
          enabled: pAcc.enabled !== false,
          credentialStatus: pAcc.credentialStatus || "aktif",
          authStatus: pAcc.authStatus || "aktif",
          boundEmail: isBound ? (pAcc.boundEmail || pAcc.boundGoogleEmail) : null,
          boundGoogleEmail: isBound ? (pAcc.boundGoogleEmail || pAcc.boundEmail) : null,
        },
        _isBound: isBound,
        _boundEmail: isBound ? (pAcc.boundGoogleEmail || pAcc.boundEmail) : null,
        _isBlocked: isBlocked
      };

      const pubRef = doc(db, "institusiPublic", docSnap.id);
      await setDoc(pubRef, publicData, { merge: true });
    });

    await Promise.all(batchPromises);
    console.log("Sinkronisasi institusiPublic berjaya.");
  } catch (err) {
    console.error("Gagal sinkronisasi institusiPublic:", err);
  }
}

export async function updateInstitusiPemilikPengurusan(
  id: string,
  pemilikPengurusanDraft: any
): Promise<void> {
  const docRef = doc(db, "institusi", id);
  await updateDoc(docRef, { pemilikPengurusan: pemilikPengurusanDraft });
}

