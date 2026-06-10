import { collection, getDocs, orderBy, query, doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, functions, rawFirebaseConfig } from "../../../lib/firebase";
import { InstitusiRecord, InstitusiKategori, InstitusiStatus } from "../../../types/institusi";
import { createAuditLog } from "../../../shared/services/auditLogService";
import { httpsCallable } from "firebase/functions";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { generateInstitutionPassword } from "../utils/passwordUtils";

export async function getInstitusiList(): Promise<InstitusiRecord[]> {
  const path = "institusi";
  console.log("Attempting to getInstitusiList with project:", db.app.options.projectId);
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
        enabled: false,
        credentialStatus: "belum-diset",
        passwordHash: "",
        passwordSalt: "",
        passwordUpdatedAt: "",
        passwordUpdatedBy: "",
        passwordAutoGenerated: false,
        loginReady: false,
        authProvider: "firebase-auth",
        authUid: newId,
        loginIdentifier: `institusi.${newId.toLowerCase()}@upsppdgm.local`,
        authStatus: "belum-aktif",
        activatedBy: "",
        activatedAt: "",
        migrationVersion: 2,
        lastPasswordResetAt: ""
      }
    };

    await setDoc(docRef, writeData);
    console.log("createInstitusiRecord success");

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
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `${path}/${id}`);
  }
}

/**
 * Orchestrator: callCreateInstitutionAuthAccount
 * Tries HTTPS Cloud Function with automated client-side fallback if not yet deployed.
 */
export async function callCreateInstitutionAuthAccount(
  institusiId: string,
  loginIdentifier?: string,
  temporaryPassword?: string,
  activatedBy?: string,
  namaInstitusi?: string
): Promise<{ success: boolean; authUid: string; loginIdentifier: string; temporaryPassword: string }> {
  const email = loginIdentifier || `institusi.${institusiId.toLowerCase()}@upsppdgm.local`.trim();
  const password = temporaryPassword || generateInstitutionPassword();

  // 1. Try Cloud Function first
  try {
    const fn = httpsCallable<any, any>(functions, "createInstitutionAuthAccount");
    const result = await fn({
      institusiId,
      loginIdentifier: email,
      temporaryPassword: password,
      activatedBy
    });
    if (result.data && result.data.success) {
      return result.data;
    }
  } catch (err: any) {
    console.warn("Cloud Function 'createInstitutionAuthAccount' unavailable or failed. Using secondary client fallback:", err.message || err);
  }

  // 2. Fallback: Client-side provisioning via secondary app
  try {
    const helperApp = getApps().find(app => app.name === "HelperAuthApp") || initializeApp(rawFirebaseConfig, "HelperAuthApp");
    const helperAuth = getAuth(helperApp);
    
    // Create actual Auth account in user's Firebase Auth instance
    const userCredential = await createUserWithEmailAndPassword(helperAuth, email, password);
    const authUid = userCredential.user.uid;

    const portalAccess: any = {
      enabled: true,
      authProvider: "firebase-auth",
      authUid: authUid,
      loginIdentifier: email,
      authStatus: "aktif",
      credentialStatus: "aktif",
      activatedAt: new Date().toISOString(),
      activatedBy: activatedBy || "pegawai@ppdgm.gov.my",
      migrationVersion: 2,
      lastPasswordResetAt: new Date().toISOString()
    };

    await updateInstitusiAccess(
      institusiId,
      portalAccess,
      { email: activatedBy || "pegawai@ppdgm.gov.my", role: "ppdgm" },
      `Aktifkan portal akses secara bertahap bagi IPS: ${namaInstitusi || institusiId}`
    );

    return {
      success: true,
      authUid,
      loginIdentifier: email,
      temporaryPassword: password
    };
  } catch (err: any) {
    console.error("Client fallback auth provisioning error:", err);
    if (err && (err.code === "auth/operation-not-allowed" || String(err).includes("auth/operation-not-allowed"))) {
      throw new Error(
        `Kaedah Log Masuk E-mel/Kata Laluan belum aktif.\n\n` +
        `Sila aktifkan 'Email/Password' di Firebase Console anda:\n` +
        `1. Lawari: https://console.firebase.google.com/project/upsppdgm/authentication/providers\n` +
        `2. Klik 'Add new provider'\n` +
        `3. Pilih 'Email/Password'\n` +
        `4. Klik butang togol 'Enable' dan simpan (Save).\n\n` +
        `Selepas diaktifkan, muat semula paparan ini dan cuba lagi!`
      );
    }
    throw new Error(`Gagal mencipta akaun portal keselamatan: ${err.message || err}`);
  }
}

/**
 * Orchestrator: callResetInstitutionPassword
 * Resets institutional portal password (Server cloud / client fallback meta).
 */
export async function callResetInstitutionPassword(
  institusiId: string,
  newPassword?: string,
  performedBy?: string,
  namaInstitusi?: string
): Promise<{ success: boolean; newPassword: string }> {
  const password = newPassword || generateInstitutionPassword();

  // 1. Try Cloud Function
  try {
    const fn = httpsCallable<any, any>(functions, "resetInstitutionPassword");
    const result = await fn({
      institusiId,
      newPassword: password,
      performedBy
    });
    if (result.data && result.data.success) {
      return result.data;
    }
  } catch (err: any) {
    console.warn("Cloud Function 'resetInstitutionPassword' unavailable. Using client meta fallback:", err.message || err);
  }

  // 2. Fallback: Write directly to Firestore metadata
  try {
    const dbInst = await getInstitusiList();
    const inst = dbInst.find(i => i.id === institusiId);
    if (!inst) throw new Error("Institusi tidak dijumpai.");

    const portalAccess: any = {
      ...(inst.portalAccess || {}),
      enabled: true,
      authProvider: "firebase-auth",
      authStatus: "aktif",
      credentialStatus: "aktif",
      lastPasswordResetAt: new Date().toISOString(),
      passwordUpdatedAt: new Date().toISOString(),
      passwordUpdatedBy: performedBy || "pegawai@ppdgm.gov.my",
      migrationVersion: 2,
      // For local development when auth reset functions are offline, we can write fallbackPassword
      fallbackPassword: password 
    };

    await updateInstitusiAccess(
      institusiId,
      portalAccess,
      { email: performedBy || "pegawai@ppdgm.gov.my", role: "ppdgm" },
      `Menetapkan semula kata laluan portal keselamatan bagi IPS: ${namaInstitusi || inst.namaInstitusi}`
    );

    return {
      success: true,
      newPassword: password
    };
  } catch (err: any) {
    console.error("Client fallback reset password error:", err);
    throw new Error(`Gagal set semula kata laluan: ${err.message || err}`);
  }
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
  // 1. Try Cloud Function
  try {
    const fn = httpsCallable<any, any>(functions, "setInstitutionAccessState");
    const result = await fn({
      institusiId,
      enabled,
      performedBy
    });
    if (result.data && result.data.success) {
      return result.data;
    }
  } catch (err: any) {
    console.warn("Cloud Function 'setInstitutionAccessState' unavailable. Falling back to direct database status sync:", err.message || err);
  }

  // 2. Fallback: Sync on Firestore
  try {
    const dbInst = await getInstitusiList();
    const inst = dbInst.find(i => i.id === institusiId);
    if (!inst) throw new Error("Institusi tidak dijumpai.");

    const stateDesc = enabled ? "aktif" : "disekat";
    const portalAccess: any = {
      ...(inst.portalAccess || {}),
      enabled,
      authStatus: stateDesc,
      credentialStatus: stateDesc,
      passwordUpdatedAt: new Date().toISOString(),
      passwordUpdatedBy: performedBy || "pegawai@ppdgm.gov.my",
      migrationVersion: 2
    };

    await updateInstitusiAccess(
      institusiId,
      portalAccess,
      { email: performedBy || "pegawai@ppdgm.gov.my", role: "ppdgm" },
      `Menukar status capaian kepada [${stateDesc.toUpperCase()}] bagi IPS: ${namaInstitusi || inst.namaInstitusi}`
    );

    return {
      success: true
    };
  } catch (err: any) {
    console.error("Client fallback access state sync error:", err);
    throw new Error(`Gagal menyelaraskan status capaian: ${err.message || err}`);
  }
}

/**
 * Orchestrator: callMigrateInstitutionCredentialToAuth
 * Migrates a legacy hash record to true Firebase Auth identity.
 */
export async function callMigrateInstitutionCredentialToAuth(
  institusiId: string,
  temporaryPassword?: string,
  performedBy?: string,
  namaInstitusi?: string
): Promise<{ success: boolean; authUid: string; loginIdentifier: string; temporaryPassword: string }> {
  const password = temporaryPassword || generateInstitutionPassword();

  // 1. Try Cloud Function
  try {
    const fn = httpsCallable<any, any>(functions, "migrateInstitutionCredentialToAuth");
    const result = await fn({
      institusiId,
      temporaryPassword: password,
      performedBy
    });
    if (result.data && result.data.success) {
      return result.data;
    }
  } catch (err: any) {
    console.warn("Cloud Function 'migrateInstitutionCredentialToAuth' unavailable. Using client migration fallback:", err.message || err);
  }

  // 2. Fallback: migrate via client auth
  return callCreateInstitutionAuthAccount(
    institusiId,
    undefined,
    password,
    performedBy,
    namaInstitusi
  );
}

export default getInstitusiList;

