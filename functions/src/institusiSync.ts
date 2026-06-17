import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

function getPublicData(docId: string, data: any) {
  const pAcc = data.portalAccess || {};
  const isBound = !!(pAcc.boundGoogleEmail || pAcc.boundEmail);
  const isBlocked = !!(pAcc.credentialStatus === "disekat" || pAcc.authStatus === "disekat" || (pAcc.enabled === false && pAcc.credentialStatus !== "belum-diset" && pAcc.credentialStatus !== undefined));
  
  return {
    id: docId,
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
}

export const onInstitusiCreated = onDocumentCreated("institusi/{institusiId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data();
  const publicData = getPublicData(event.params.institusiId, data);
  await admin.firestore().collection("institusiPublic").doc(event.params.institusiId).set(publicData);
});

export const onInstitusiUpdated = onDocumentUpdated("institusi/{institusiId}", async (event) => {
  const snap = event.data?.after;
  if (!snap) return;
  const data = snap.data();
  const publicData = getPublicData(event.params.institusiId, data);
  await admin.firestore().collection("institusiPublic").doc(event.params.institusiId).set(publicData, { merge: true });
});

export const onInstitusiDeleted = onDocumentDeleted("institusi/{institusiId}", async (event) => {
  await admin.firestore().collection("institusiPublic").doc(event.params.institusiId).delete();
});
