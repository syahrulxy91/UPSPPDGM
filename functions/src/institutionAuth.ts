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
 * 7. Cloud Function: bindInstitutionGoogleEmail
 * Binds an authorized Google Email/Account to a registered Institusi/IPS upon their first successful login.
 */
export const bindInstitutionGoogleEmail = onCall<any>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sila log masuk dengan akaun Google terlebih dahulu.");
  }

  const data = request.data || {};
  const { institusiId } = data;

  if (!institusiId) {
    throw new HttpsError("invalid-argument", "Sila sertakan 'institusiId'.");
  }

  const email = request.auth.token.email;
  const uid = request.auth.uid;

  if (!email) {
    throw new HttpsError("failed-precondition", "Akaun Google anda tidak mempunyai alamat emel yang sah.");
  }

  const db = admin.firestore();
  const institusiRef = db.collection("institusi").doc(institusiId);
  const docSnap = await institusiRef.get();

  if (!docSnap.exists) {
    throw new HttpsError("not-found", "Institusi tidak ditemui.");
  }

  const institusiData = docSnap.data() || {};
  const namaInstitusi = institusiData.namaInstitusi || institusiData.nama || "Institusi Swasta";
  const pAcc = institusiData.portalAccess;

  if (!pAcc) {
    throw new HttpsError("permission-denied", "Akses portal bagi institusi ini belum diaktifkan oleh pegawai PPDGM.");
  }

  if (pAcc.enabled !== true || pAcc.credentialStatus !== "aktif") {
    throw new HttpsError(
      "permission-denied",
      "Akses portal bagi institusi ini belum diaktifkan atau telah disekat. Sila hubungi pegawai PPDGM."
    );
  }

  // Check if the email is authorized
  const authorizedEmails: string[] = pAcc.googleAuthorizedEmails || [];
  const normalizedEmail = email.toLowerCase().trim();
  const isAuthorized = authorizedEmails.some(ae => ae.toLowerCase().trim() === normalizedEmail);

  if (!isAuthorized) {
    throw new HttpsError(
      "permission-denied",
      `Emel Google anda (${email}) tidak tersenarai antara emel yang dibenarkan untuk mengakses portal institusi ${namaInstitusi}. Sila hubungi pegawai PPDGM.`
    );
  }

  const boundEmail = pAcc.boundGoogleEmail || pAcc.boundEmail;

  if (boundEmail) {
    const normalizedBound = boundEmail.toLowerCase().trim();
    if (normalizedBound !== normalizedEmail) {
      throw new HttpsError(
        "permission-denied",
        `Ralat: Institusi ini telah dipautkan secara kekal kepada emel Google yang lain (${boundEmail}). Pengguna lain tidak dibenarkan masuk.`
      );
    }

    // Email already bound matches current email, login OK
    return { success: true, alreadyBound: true };
  } else {
    // Perform transactional binding or write
    const updatedPortalAccess = {
      ...pAcc,
      boundEmail: email,
      boundUid: uid,
      boundGoogleEmail: email,
      boundGoogleUid: uid,
      boundAt: new Date().toISOString(),
      boundBy: "self-first-login",
      bindingLocked: true,
      authUid: uid, // Bind authUid so Firebase rules allow write operations from this Google user
    };

    await institusiRef.set({ portalAccess: updatedPortalAccess }, { merge: true });

    // Auditing
    await logSecurityEvent(
      db,
      institusiId,
      namaInstitusi,
      "paut_emel_google",
      `[Pautan Pertama] Berjaya memautkan emel Google ${email} kepada IPS: ${namaInstitusi}.`,
      email,
      { email, uid, boundBy: "self-first-login", bindingLocked: true }
    );

    return { success: true, newlyBound: true };
  }
});

/**
 * 8. Cloud Function: resetInstitutionGoogleEmail
 * Clears/Resets the bound Google Email/Account from a registered Institusi/IPS so they can re-bind.
 */
export const resetInstitutionGoogleEmail = onCall<any>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sila log masuk dengan akaun Google terlebih dahulu.");
  }

  const email = request.auth.token.email;
  const data = request.data || {};
  const { institusiId, performedBy } = data;

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
  const pAcc = institusiData.portalAccess;

  if (!pAcc) {
    throw new HttpsError("failed-precondition", "Akses portal bagi institusi ini belum diaktifkan.");
  }

  // Reset binding fields
  const updatedPortalAccess = { ...pAcc };
  
  delete updatedPortalAccess.boundEmail;
  delete updatedPortalAccess.boundUid;
  delete updatedPortalAccess.boundGoogleEmail;
  delete updatedPortalAccess.boundGoogleUid;
  delete updatedPortalAccess.boundAt;
  delete updatedPortalAccess.boundBy;
  delete updatedPortalAccess.bindingLocked;
  delete updatedPortalAccess.authUid;

  await institusiRef.set({ portalAccess: updatedPortalAccess }, { merge: true });

  // Auditing
  await logSecurityEvent(
    db,
    institusiId,
    namaInstitusi,
    "reset_paut_emel_google",
    `[Set Semula Pautan] Pegawai ${performedBy || email || "Sistem"} menetapkan semula pautan emel Google bagi IPS: ${namaInstitusi}.`,
    performedBy || email || "Sistem",
    { resetBy: performedBy || email, resetAt: new Date().toISOString() }
  );

  return { success: true };
});

/**
 * 9. Cloud Function: bindOrValidateInstitutionAccess
 * Server-side dynamic Gmail self-binding with atomic visual and compliance safeguards.
 */
export const bindOrValidateInstitutionAccess = onCall<any>(async (request) => {
  const data = request.data || {};
  const { institusiId, email, uid, displayName } = data;

  if (!institusiId || !email || !uid) {
    throw new HttpsError("invalid-argument", "Sila sertakan 'institusiId', 'email', dan 'uid'.");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = admin.firestore();
  const institusiRef = db.collection("institusi").doc(institusiId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(institusiRef);

      if (!docSnap.exists) {
        throw new HttpsError("not-found", "Institusi tidak ditemui.");
      }

      const institusiData = docSnap.data() || {};
      const namaInstitusi = institusiData.namaInstitusi || institusiData.nama || "Institusi Swasta";
      
      let pAcc = institusiData.portalAccess;
      if (!pAcc) {
        pAcc = {
          enabled: true,
          credentialStatus: "aktif",
          authStatus: "aktif",
          loginReady: true
        };
      }

      const isExplicitlyBlocked = pAcc.credentialStatus === "disekat" || pAcc.authStatus === "disekat" || (pAcc.enabled === false && pAcc.credentialStatus !== "belum-diset" && pAcc.credentialStatus !== undefined);

      if (isExplicitlyBlocked) {
        throw new HttpsError(
          "permission-denied",
          `Akses portal bagi institusi '${namaInstitusi}' telah disekat atau belum diaktifkan. Sila hubungi Pegawai Swasta PPD Gua Musang.`
        );
      }

      const boundGoogleEmail = pAcc.boundGoogleEmail || pAcc.boundEmail;

      if (!boundGoogleEmail) {
        // No current binding found - Atomic Write
        const updatedPortalAccess = {
          ...pAcc,
          enabled: true,
          credentialStatus: "aktif",
          authStatus: "aktif",
          loginReady: true,
          authMode: "google-first-bind",
          boundGoogleEmail: normalizedEmail,
          boundGoogleUid: uid,
          boundGoogleDisplayName: displayName || null,
          boundAt: new Date().toISOString(),
          boundBy: "self-first-login",
          bindingLocked: true,
          authUid: uid,
          boundEmail: normalizedEmail,
          boundUid: uid,
        };

        transaction.set(institusiRef, { portalAccess: updatedPortalAccess }, { merge: true });

        return {
          bindingCreated: true,
          alreadyBoundToCurrentUser: false,
          boundGoogleEmail: normalizedEmail,
          namaInstitusi
        };
      } else {
        const normalizedBound = boundGoogleEmail.toLowerCase().trim();
        if (normalizedBound === normalizedEmail) {
          if (!pAcc.authUid || pAcc.authUid !== uid) {
            const updatedPortalAccess = {
              ...pAcc,
              authUid: uid,
              boundGoogleUid: uid,
              boundUid: uid
            };
            transaction.set(institusiRef, { portalAccess: updatedPortalAccess }, { merge: true });
          }

          return {
            bindingCreated: false,
            alreadyBoundToCurrentUser: true,
            boundGoogleEmail: normalizedEmail,
            namaInstitusi
          };
        } else {
          throw new HttpsError(
            "permission-denied",
            `Institusi ini telah dipautkan kepada akaun Google yang lain. Sila gunakan akaun yang telah dipautkan atau hubungi pegawai PPDGM untuk mendapat pelepasan semula.`
          );
        }
      }
    });

    if (result.bindingCreated) {
      await logSecurityEvent(
        db,
        institusiId,
        result.namaInstitusi,
        "paut_emel_google",
        `[Pautan Pertama] Berjaya memautkan emel Google ${normalizedEmail} kepada IPS secara automatik semasa log masuk kali pertama.`,
        normalizedEmail,
        { email: normalizedEmail, uid, boundBy: "self-first-login", bindingLocked: true }
      );
    }

    return {
      success: true,
      bindingCreated: result.bindingCreated,
      alreadyBoundToCurrentUser: result.alreadyBoundToCurrentUser,
      boundGoogleEmail: result.boundGoogleEmail
    };

  } catch (err: any) {
    console.error("[bindOrValidateInstitutionAccess Error]:", err);
    if (err instanceof HttpsError || err.code === "permission-denied" || err.code === "invalid-argument" || err.code === "not-found") {
      throw new HttpsError(err.code || "permission-denied", err.message);
    }
    throw new HttpsError("failed-precondition", `Error Debug: ${err.message || err}`);
  }
});


/**
 * 10. Cloud Function: resetInstitutionBinding
 * Resets/clears the bound Google Account for an institution.
 */
export const resetInstitutionBinding = onCall<any>(async (request) => {
  const data = request.data || {};
  const { institusiId, performedBy } = data;

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
  const pAcc = institusiData.portalAccess;

  if (!pAcc) {
    throw new HttpsError("failed-precondition", "Akses portal bagi institusi ini belum diaktifkan.");
  }

  const updatedPortalAccess = { ...pAcc };
  
  delete updatedPortalAccess.boundEmail;
  delete updatedPortalAccess.boundUid;
  delete updatedPortalAccess.boundGoogleEmail;
  delete updatedPortalAccess.boundGoogleUid;
  delete updatedPortalAccess.boundAt;
  delete updatedPortalAccess.boundBy;
  delete updatedPortalAccess.bindingLocked;
  delete updatedPortalAccess.authUid;

  await institusiRef.set({ portalAccess: updatedPortalAccess }, { merge: true });

  await logSecurityEvent(
    db,
    institusiId,
    namaInstitusi,
    "reset_paut_emel_google",
    `[Set Semula Pautan] Pegawai ${performedBy || "Sistem"} menetapkan semula pautan emel Google bagi IPS: ${namaInstitusi}.`,
    performedBy || "Sistem",
    { resetBy: performedBy || "Sistem", resetAt: new Date().toISOString() }
  );

  return { success: true };
});


/**
 * 11. Cloud Function: updateInstitutionActiveStatus
 * Changes access activation / blocks portal access.
 * sets portalAccess.enabled = source of truth.
 * set status IPS = Aktif / Tidak Aktif.
 */
export const updateInstitutionActiveStatus = onCall<any>(async (request) => {
  const data = request.data || {};
  const { institusiId, enabled, performedBy } = data;

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
  let pAcc = institusiData.portalAccess || {};

  const stateDesc = enabled ? "aktif" : "disekat";
  
  const updatedPortalAccess = {
    ...pAcc,
    enabled: enabled,
    authStatus: stateDesc,
    credentialStatus: stateDesc
  };

  const statusVal = enabled ? "aktif" : "tidak aktif";

  await institusiRef.set({
    portalAccess: updatedPortalAccess,
    statusOperasi: statusVal,
    status: statusVal,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  await logSecurityEvent(
    db,
    institusiId,
    namaInstitusi,
    enabled ? "aktifkan_akses" : "menyekat_akses",
    `[Status Capaian] Menukar status capaian portal kepada [${statusVal.toUpperCase()}] bagi IPS: ${namaInstitusi}.`,
    performedBy || "pegawai@ppdgm.gov.my",
    { enabled, statusOperasi: statusVal }
  );

  return { success: true };
});


/**
 * 12. Cloud Function: deleteInstitutionCompletely
 * Performs a complete hard-delete of the institution from Firestore DB.
 */
export const deleteInstitutionCompletely = onCall<any>(async (request) => {
  const data = request.data || {};
  const { institusiId, performedBy } = data;

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

  // Hard delete: delete document completely
  await institusiRef.delete();

  // Try to delete Firebase Auth user as well, using institusiId as UID or portalAccess.authUid
  try {
    const authUid = institusiData.portalAccess?.authUid || institusiId;
    if (authUid) {
      await admin.auth().deleteUser(authUid);
    }
  } catch (authErr: any) {
    console.warn(`[deleteAuthUser Caution]: Auth user deletion failed:`, authErr.message);
  }

  // Record a standard audit log of hard delete
  await db.collection("audit_logs").add({
    entityType: "institusi",
    entityId: institusiId,
    actionType: "padam_penuh",
    description: `[Hard Delete] Institusi '${namaInstitusi}' dipadamkan sepenuhnya dari pangkalan data sistem oleh ${performedBy || "Pegawai KPM"}.`,
    performedBy: "Pegawai PPD (Sistem)",
    performedEmail: performedBy || "pegawai@ppdgm.gov.my",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      namaInstitusi,
      institusiId,
      source: "Cloud Function (onCall)"
    }
  });

  return { success: true };
});

/**
 * 13. Cloud Function: getPublicInstitutionsList
 * Returns a safe list of institutions (id, namaInstitusi, noRujukan, status dll)
 * without exposing portalAccess to the public. Used by LoginGate.
 */
export const getPublicInstitutionsList = onCall<any>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sila log masuk dengan akaun Google terlebih dahulu.");
  }
  
  const db = admin.firestore();
  try {
    const institusiSnap = await db.collection("institusiPublic").get();
    
    // Convert to a safe array for clients
    const publicList = institusiSnap.docs.map(doc => {
      const data = doc.data();
      const pAcc = data.portalAccess || {};
      
      const isBound = !!(pAcc.boundGoogleEmail || pAcc.boundEmail);
      const isBlocked = !!(pAcc.enabled === false || pAcc.credentialStatus === "disekat" || pAcc.authStatus === "disekat");
      
      return {
        id: doc.id,
        namaInstitusi: data.namaInstitusi || data.nama || "",
        noRujukan: data.noRujukan || "",
        statusOperasi: data.statusOperasi || data.statusPendaftaran || "aktif",
        // HANYA field yang dibenarkan dan diperlukan untuk login UI
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
    });

    return publicList;
  } catch (err: any) {
    console.error("[getPublicInstitutionsList Error]:", err);
    throw new HttpsError("internal", "Gagal memuat senarai institusi awam.");
  }
});


/**
 * 14. Cloud Function: lookupBoundInstitutionForGoogleUser
 * Evaluates whether a Google account already has a bound institution/IPS.
 * Returns BOUND_SINGLE, UNBOUND, or CONFLICT_MULTIPLE.
 */
export const lookupBoundInstitutionForGoogleUser = onCall<any>(async (request) => {
  const data = request.data || {};
  const { email, uid } = data;

  if (!email) {
    throw new HttpsError("invalid-argument", "Sila sertakan parameter 'email'.");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = admin.firestore();

  try {
    const matchedDocsMap = new Map<string, admin.firestore.DocumentSnapshot>();

    // 1. Gather potential matches across all binding configurations
    const queries = [
      db.collection("institusi").where("portalAccess.boundGoogleEmail", "==", normalizedEmail).get(),
      db.collection("institusi").where("portalAccess.boundEmail", "==", normalizedEmail).get(),
    ];

    if (uid) {
      queries.push(
        db.collection("institusi").where("portalAccess.boundGoogleUid", "==", uid).get(),
        db.collection("institusi").where("portalAccess.authUid", "==", uid).get()
      );
    }

    const querySnapshots = await Promise.all(queries);
    querySnapshots.forEach(snap => {
      snap.forEach(doc => {
        matchedDocsMap.set(doc.id, doc);
      });
    });

    const matchedDocs = Array.from(matchedDocsMap.values());

    if (matchedDocs.length === 0) {
      // UNBOUND: No current binding
      return { status: "UNBOUND" };
    }

    if (matchedDocs.length > 1) {
      // CONFLICT_MULTIPLE: Account is bound to more than one institution/IPS. Block login entirely.
      const matches = matchedDocs.map(d => ({
        institusiId: d.id,
        namaInstitusi: d.data()?.namaInstitusi || d.data()?.nama || "Institusi Swasta"
      }));

      // Log conflict to audit logs
      try {
        await db.collection("audit_logs").add({
          entityType: "institusi",
          entityId: "SYSTEM_CONFLICT",
          actionType: "conflictbinding",
          description: `Konflik pautan dikesan: Emel/Akaun Google ${normalizedEmail} (${uid || 'N/A'}) cuba log masuk tetapi dipadankan dengan ${matchedDocs.length} IPS berbeza. Akses disekat sepenuhnya secara automatik demi keselamatan data.`,
          performedBy: "institusi_system",
          performedEmail: normalizedEmail,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            email: normalizedEmail,
            uid: uid || null,
            matchedInstitusiIds: matches.map(m => m.institusiId),
            matchedInstitusiNames: matches.map(m => m.namaInstitusi),
            timestamp: new Date().toISOString(),
            source: "lookupBoundInstitutionForGoogleUser"
          }
        });
      } catch (logErr) {
        console.error("Gagal merekod log audit konflik pautan:", logErr);
      }

      return {
        status: "CONFLICT_MULTIPLE",
        matches,
        message: "Ralat data pautan dikesan. Akaun Google ini dipautkan kepada lebih daripada satu institusi. Sila hubungi pegawai PPDGM untuk semakan dan tetapan semula pautan."
      };
    }

    // Grab the single matched institution
    const matchedDoc = matchedDocs[0];
    const institusiData = matchedDoc.data() || {};
    const pAcc = institusiData.portalAccess || {};
    const namaInstitusi = institusiData.namaInstitusi || institusiData.nama || "Institusi Swasta";

    // Check if the portal is explicitly disabled/blocked
    const isBlocked = pAcc.credentialStatus === "disekat" || 
                      pAcc.authStatus === "disekat" || 
                      (pAcc.enabled === false && pAcc.credentialStatus !== "belum-diset" && pAcc.credentialStatus !== undefined);

    if (isBlocked) {
      return {
        status: "BOUND_SINGLE",
        institusiId: matchedDoc.id,
        namaInstitusi,
        isBlocked: true,
        message: `Akses ditolak: Portal bagi institusi '${namaInstitusi}' telah disekat. Sila hubungi Pegawai Swasta PPD Gua Musang.`
      };
    }

    // BOUND_SINGLE: Active single binding
    return {
      status: "BOUND_SINGLE",
      institusiId: matchedDoc.id,
      namaInstitusi,
      isBlocked: false
    };
  } catch (err: any) {
    console.error("[lookupBoundInstitutionForGoogleUser Error]:", err);
    throw new HttpsError("internal", `Ralat semasa menyemak pautan: ${err.message || err}`);
  }
});





