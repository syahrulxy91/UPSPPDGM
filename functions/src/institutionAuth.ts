import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

/**
 * Helper to log security actions into the audit log ledger
 */
async function logSecurityEvent(
  db: admin.firestore.Firestore,
  institusiId: string,
  namaInstitusi: string,
  actionType: string,
  description: string,
  performedByEmail: string,
  metadata?: any
) {
  try {
    await db.collection("audit_logs").add({
      entityType: "institusi",
      entityId: institusiId,
      actionType,
      description,
      performedBy: "Pegawai PPD (Sistem)",
      performedEmail: performedByEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        ...metadata,
        namaInstitusi,
        source: "Cloud Function (onCall)"
      }
    });
  } catch (err) {
    console.error("[logSecurityEvent Error] Gagal merekod log audit:", err);
  }
}

/**
 * 1. Cloud Function: createInstitutionAuthAccount
 * Creates a real Firebase Auth user for the specified Institusi.
 */
export const createInstitutionAuthAccount = onCall<any>(async (request) => {
  // Extract inputs
  const data = request.data || {};
  const { institusiId, logBy } = data;
  const activatedBy = data.activatedBy || logBy || "pegawai@ppdgm.gov.my";
  let { loginIdentifier, temporaryPassword } = data;

  if (!institusiId) {
    throw new HttpsError("invalid-argument", "Sila sertakan 'institusiId'.");
  }

  const db = admin.firestore();
  const institusiRef = db.collection("institusi").doc(institusiId);
  const docSnap = await institusiRef.get();

  if (!docSnap.exists) {
    throw new HttpsError("not-found", `Institusi ID: ${institusiId} tidak dijumpai.`);
  }

  const institusiData = docSnap.data() || {};
  const namaInstitusi = institusiData.namaInstitusi || institusiData.nama || "Institusi Swasta";

  // If no email login specified, generate internal email login
  if (!loginIdentifier) {
    loginIdentifier = `institusi.${institusiId.toLowerCase()}@upsppdgm.local`;
  }

  // Generate temporary password if not provided (min 12 chars with mix)
  if (!temporaryPassword) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let generatedPass = "";
    for (let i = 0; i < 14; i++) {
      generatedPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    temporaryPassword = generatedPass;
  }

  try {
    let authUser: admin.auth.UserRecord;
    try {
      // Create authentication model in Firebase Auth using the institusiId as UID
      authUser = await admin.auth().createUser({
        uid: institusiId,
        email: loginIdentifier,
        password: temporaryPassword,
        displayName: namaInstitusi,
        emailVerified: true
      });
    } catch (createErr: any) {
      if (createErr.code === "auth/email-already-in-use" || createErr.code === "auth/uid-already-exists") {
        // Retrieve existing user if already existed, but we reset password
        authUser = await admin.auth().getUserByEmail(loginIdentifier);
        // Reset password to the custom or generated one
        await admin.auth().updateUser(authUser.uid, {
          password: temporaryPassword,
          disabled: false
        });
      } else {
        throw createErr;
      }
    }

    const portalAccess = {
      enabled: true,
      authProvider: "firebase-auth",
      authUid: authUser.uid,
      loginIdentifier: loginIdentifier,
      authStatus: "aktif",
      credentialStatus: "aktif",
      activatedAt: new Date().toISOString(),
      activatedBy: activatedBy,
      migrationVersion: 2,
      lastPasswordResetAt: new Date().toISOString()
    };

    // Update the Firestore object directly
    await institusiRef.set({ portalAccess }, { merge: true });

    // Auditing
    await logSecurityEvent(
      db,
      institusiId,
      namaInstitusi,
      "aktifkan_portal",
      `[Auth Cloud] Mengaktifkan akaun portal & mewujudkan kredensial baharu bagi IPS: ${namaInstitusi}.`,
      activatedBy,
      { loginIdentifier, authUid: authUser.uid }
    );

    return {
      success: true,
      authUid: authUser.uid,
      loginIdentifier: loginIdentifier,
      temporaryPassword: temporaryPassword
    };
  } catch (err: any) {
    console.error("[createInstitutionAuthAccount Error] Fail to create user:", err);
    throw new HttpsError("internal", err.message || "Gagal membina akaun keselamatan.");
  }
});

/**
 * 2. Cloud Function: resetInstitutionPassword
 * Resets password for the institutional Firebase Auth identity.
 */
export const resetInstitutionPassword = onCall<any>(async (request) => {
  const data = request.data || {};
  const { institusiId, logBy } = data;
  const performedBy = data.performedBy || logBy || "pegawai@ppdgm.gov.my";
  let { newPassword } = data;

  if (!institusiId) {
    throw new HttpsError("invalid-argument", "Sila sertakan 'institusiId'.");
  }

  const db = admin.firestore();
  const institusiRef = db.collection("institusi").doc(institusiId);
  const docSnap = await institusiRef.get();

  if (!docSnap.exists) {
    throw new HttpsError("not-found", "Institusi tidak ditemui.");
  }

  const institusiData = docSnap.data() || {};
  const namaInstitusi = institusiData.namaInstitusi || institusiData.nama || "Institusi Swasta";
  const portalAccess = institusiData.portalAccess || {};

  const uid = portalAccess.authUid || institusiId;
  const loginIdentifier = portalAccess.loginIdentifier || `institusi.${institusiId.toLowerCase()}@upsppdgm.local`;

  if (!newPassword) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let generatedPass = "";
    for (let i = 0; i < 14; i++) {
      generatedPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    newPassword = generatedPass;
  }

  try {
    // 1. Ensure user account actually exists in Firebase Auth, if not create it
    try {
      await admin.auth().getUser(uid);
    } catch {
      await admin.auth().createUser({
        uid: uid,
        email: loginIdentifier,
        password: newPassword,
        displayName: namaInstitusi,
        emailVerified: true
      });
    }

    // 2. Perform the update password operation
    await admin.auth().updateUser(uid, {
      password: newPassword,
      disabled: false
    });

    const updatedPortalAccess = {
      ...portalAccess,
      enabled: true,
      authProvider: "firebase-auth",
      authUid: uid,
      loginIdentifier: loginIdentifier,
      authStatus: "aktif",
      credentialStatus: "aktif",
      lastPasswordResetAt: new Date().toISOString(),
      passwordUpdatedAt: new Date().toISOString(),
      passwordUpdatedBy: performedBy,
      migrationVersion: 2
    };

    await institusiRef.set({ portalAccess: updatedPortalAccess }, { merge: true });

    // Record audit
    await logSecurityEvent(
      db,
      institusiId,
      namaInstitusi,
      "tukar_kata_laluan",
      `[Auth Cloud] Berjaya melakukan penetapan semula kata laluan portal bagi IPS: ${namaInstitusi}.`,
      performedBy,
      { loginIdentifier }
    );

    return {
      success: true,
      newPassword
    };
  } catch (err: any) {
    console.error("[resetInstitutionPassword Error]:", err);
    throw new HttpsError("internal", err.message || "Gagal set semula kata laluan.");
  }
});

/**
 * 3. Cloud Function: setInstitutionAccessState
 * Changes access activation / blocks portal access.
 */
export const setInstitutionAccessState = onCall<any>(async (request) => {
  const data = request.data || {};
  const { institusiId, enabled, logBy } = data;
  const performedBy = data.performedBy || logBy || "pegawai@ppdgm.gov.my";

  if (!institusiId || enabled === undefined) {
    throw new HttpsError("invalid-argument", "Sila nyatakan 'institusiId' dan parameter 'enabled'.");
  }

  const db = admin.firestore();
  const institusiRef = db.collection("institusi").doc(institusiId);
  const docSnap = await institusiRef.get();

  if (!docSnap.exists) {
    throw new HttpsError("not-found", "Institusi tidak ditemui.");
  }

  const institusiData = docSnap.data() || {};
  const namaInstitusi = institusiData.namaInstitusi || institusiData.nama || "Institusi Swasta";
  const portalAccess = institusiData.portalAccess || {};
  const uid = portalAccess.authUid || institusiId;

  try {
    // Attempt updating in Auth
    try {
      await admin.auth().updateUser(uid, {
        disabled: !enabled
      });
    } catch (authErr: any) {
      console.warn("Auth user update caution (might not exist yet):", authErr.message);
    }

    const stateDesc = enabled ? "aktif" : "disekat";
    const updatedPortalAccess = {
      ...portalAccess,
      enabled: enabled,
      authStatus: stateDesc,
      credentialStatus: stateDesc,
      passwordUpdatedAt: new Date().toISOString(),
      passwordUpdatedBy: performedBy,
      migrationVersion: 2
    };

    await institusiRef.set({ portalAccess: updatedPortalAccess }, { merge: true });

    // Log the update
    await logSecurityEvent(
      db,
      institusiId,
      namaInstitusi,
      enabled ? "aktifkan_akses" : "menyekat_akses",
      `[Auth Cloud] Menukar status capaian portal kepada [${stateDesc.toUpperCase()}] bagi IPS: ${namaInstitusi}.`,
      performedBy,
      { enabled }
    );

    return {
      success: true
    };
  } catch (err: any) {
    console.error("[setInstitutionAccessState Error]:", err);
    throw new HttpsError("internal", err.message || "Gagal menyelaraskan status capaian.");
  }
});

/**
 * 4. Cloud Function: migrateInstitutionCredentialToAuth
 * Migrates client hash-based legacy login to true Firebase Auth and marks progress.
 */
export const migrateInstitutionCredentialToAuth = onCall<any>(async (request) => {
  const data = request.data || {};
  const { institusiId, logBy } = data;
  const performedBy = data.performedBy || logBy || "pegawai@ppdgm.gov.my";
  let { temporaryPassword } = data;

  if (!institusiId) {
    throw new HttpsError("invalid-argument", "Sila sertakan 'institusiId'.");
  }

  const db = admin.firestore();
  const institusiRef = db.collection("institusi").doc(institusiId);
  const docSnap = await institusiRef.get();

  if (!docSnap.exists) {
    throw new HttpsError("not-found", "Institusi tidak ditemui.");
  }

  const institusiData = docSnap.data() || {};
  const namaInstitusi = institusiData.namaInstitusi || institusiData.nama || "Institusi Swasta";
  const portalAccess = institusiData.portalAccess || {};

  const loginIdentifier = portalAccess.loginIdentifier || `institusi.${institusiId.toLowerCase()}@upsppdgm.local`;

  if (!temporaryPassword) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let generatedPass = "";
    for (let i = 0; i < 14; i++) {
      generatedPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    temporaryPassword = generatedPass;
  }

  try {
    // Register the user
    let authUser: admin.auth.UserRecord;
    try {
      authUser = await admin.auth().createUser({
        uid: institusiId,
        email: loginIdentifier,
        password: temporaryPassword,
        displayName: namaInstitusi,
        emailVerified: true
      });
    } catch {
      authUser = await admin.auth().getUserByEmail(loginIdentifier);
      await admin.auth().updateUser(authUser.uid, {
        password: temporaryPassword,
        disabled: false
      });
    }

    const updatedPortalAccess = {
      ...portalAccess,
      enabled: true,
      authProvider: "firebase-auth",
      authUid: authUser.uid,
      loginIdentifier: loginIdentifier,
      authStatus: "aktif",
      credentialStatus: "aktif",
      activatedAt: portalAccess.activatedAt || new Date().toISOString(),
      activatedBy: portalAccess.activatedBy || performedBy,
      migrationVersion: 2,
      lastPasswordResetAt: new Date().toISOString()
    };

    await institusiRef.set({ portalAccess: updatedPortalAccess }, { merge: true });

    // Success log
    await logSecurityEvent(
      db,
      institusiId,
      namaInstitusi,
      "migrasi_kredensial",
      `[Auth Cloud] Berjaya mengalihkan kelayakan masuk legacy kepada Firebase Authentication bagi IPS: ${namaInstitusi}.`,
      performedBy,
      { loginIdentifier, authUid: authUser.uid, migrationVersion: 2 }
    );

    return {
      success: true,
      authUid: authUser.uid,
      loginIdentifier,
      temporaryPassword
    };
  } catch (err: any) {
    console.error("[migrateInstitutionCredentialToAuth Error]:", err);
    throw new HttpsError("internal", err.message || "Gagal melakukan migrasi.");
  }
});
