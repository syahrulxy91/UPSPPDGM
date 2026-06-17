"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onInstitusiDeleted = exports.onInstitusiUpdated = exports.onInstitusiCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
function getPublicData(docId, data) {
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
exports.onInstitusiCreated = (0, firestore_1.onDocumentCreated)("institusi/{institusiId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const data = snap.data();
    const publicData = getPublicData(event.params.institusiId, data);
    await admin.firestore().collection("institusiPublic").doc(event.params.institusiId).set(publicData);
});
exports.onInstitusiUpdated = (0, firestore_1.onDocumentUpdated)("institusi/{institusiId}", async (event) => {
    const snap = event.data?.after;
    if (!snap)
        return;
    const data = snap.data();
    const publicData = getPublicData(event.params.institusiId, data);
    await admin.firestore().collection("institusiPublic").doc(event.params.institusiId).set(publicData, { merge: true });
});
exports.onInstitusiDeleted = (0, firestore_1.onDocumentDeleted)("institusi/{institusiId}", async (event) => {
    await admin.firestore().collection("institusiPublic").doc(event.params.institusiId).delete();
});
//# sourceMappingURL=institusiSync.js.map