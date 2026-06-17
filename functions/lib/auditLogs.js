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
exports.logBorangStatusUpdated = exports.logBorangCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
/**
 * Trigger: onCreate borang document.
 * Automatically appends a 'cipta_borang' entry onto the audit logs ledger.
 */
exports.logBorangCreated = (0, firestore_1.onDocumentCreated)("borang/{borangId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const data = snap.data();
    const docId = event.params.borangId;
    const db = admin.firestore();
    const namaInstitusi = data.namaInstitusi || "Pendidikan Swasta";
    const jenisBorang = data.jenisBorang || "Borang Rasmi";
    const statusAwal = data.status || "draf";
    const userEmail = data.pegawai || data.userEmail || "system@moe.gov.my";
    try {
        await db.collection("audit_logs").add({
            entityType: "borang",
            entityId: docId,
            actionType: "cipta_borang",
            description: `[Server Audit] Borang "${jenisBorang}" di bawah premis "${namaInstitusi}" dibina dengan status permulaan: "${statusAwal}".`,
            performedBy: userEmail === "system@moe.gov.my" ? "Sistem PPD" : "Pegawai Cawangan/IPS",
            performedEmail: userEmail,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
                noRujukan: data.noRujukan || "DRAF-AUTO",
                source: "Cloud Trigger (onCreate)"
            }
        });
        console.log(`[Audit Trigger] Cipta Audit Log berjaya bagi borang ${docId}`);
    }
    catch (err) {
        console.error("[Audit Trigger Error] Gagal merekod log cipta borang:", err);
    }
});
/**
 * Trigger: onUpdate borang document.
 * Records state transitioning of forms dynamically (e.g. Draf -> Kemukakan -> Lulus).
 */
exports.logBorangStatusUpdated = (0, firestore_1.onDocumentUpdated)("borang/{borangId}", async (event) => {
    const change = event.data;
    if (!change)
        return;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!beforeData || !afterData)
        return;
    const oldStatus = beforeData.status;
    const newStatus = afterData.status;
    const docId = event.params.borangId;
    const db = admin.firestore();
    // Check if status actually changed
    if (oldStatus !== newStatus) {
        const jenisBorang = afterData.jenisBorang || "Borang Rasmi";
        const namaInstitusi = afterData.namaInstitusi || "Nama Premis";
        const userEmail = afterData.pegawai || "system@moe.gov.my";
        try {
            await db.collection("audit_logs").add({
                entityType: "borang",
                entityId: docId,
                actionType: "tukar_status",
                description: `[Server Audit] Status urusan "${jenisBorang}" bagi "${namaInstitusi}" berubah drastik daripada [${oldStatus.toUpperCase()}] kepada [${newStatus.toUpperCase()}].`,
                performedBy: userEmail === "system@moe.gov.my" ? "Automasi SPS PPD" : "Pegawai Penyunting",
                performedEmail: userEmail,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                metadata: {
                    oldStatus,
                    newStatus,
                    source: "Cloud Trigger (onUpdate)"
                }
            });
            console.log(`[Audit Trigger] Rekod peralihan status [${oldStatus} -> ${newStatus}] berjaya digazetkan.`);
        }
        catch (err) {
            console.error("[Audit Trigger Error] Gagal merekod peralihan status:", err);
        }
    }
});
//# sourceMappingURL=auditLogs.js.map