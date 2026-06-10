import { collection, addDoc, getDocs, orderBy, query, where, limit, serverTimestamp, Timestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";

export interface AuditLogRecord {
  id?: string;
  entityType: "institusi" | "borang" | "laporan" | "auth" | "sistem";
  entityId: string;
  actionType: "cipta" | "simpan_draf" | "kemuka" | "tukar_status" | "lulus" | "tolak" | "kemas_kini" | "eksport" | "login";
  description: string;
  performedBy: string; // Jawatan / Peranan Pengguna
  performedEmail: string;
  timestamp: any;
  metadata?: Record<string, any>;
}

/**
 * Cipta audit log bertulis di Firestore.
 * Mematuhi kriteria pemilikan dan tidak menghalang aliran utama sekiranya ralat berlaku.
 */
export async function createAuditLog(log: Omit<AuditLogRecord, "id" | "timestamp">): Promise<void> {
  const path = "audit_logs";
  console.log(`[Dev Audit] Merekodkan Audit Log ke Firestore: ${log.actionType} — ${log.description}`);
  try {
    await addDoc(collection(db, path), {
      ...log,
      timestamp: serverTimestamp()
    });
  } catch (err: any) {
    console.warn(`[Dev Audit] Amaran: Gagal menyimpan jejak audit logs (${log.entityType}/${log.entityId}):`, err);
  }
}

/**
 * Ambil sejarah audit berkaitan entiti seperti spesifik Institusi atau Rujukan Borang.
 */
export async function getAuditLogsForEntity(entityType: "institusi" | "borang", entityId: string): Promise<AuditLogRecord[]> {
  const path = "audit_logs";
  try {
    const q = query(
      collection(db, path),
      where("entityType", "==", entityType),
      where("entityId", "==", entityId),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const snapshot = await getDocs(q);
    
    // Fallback if no logs found
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      let tsString = "";
      
      if (data.timestamp) {
        if (data.timestamp instanceof Timestamp) {
          tsString = data.timestamp.toDate().toLocaleDateString("ms-MY") + " " + data.timestamp.toDate().toLocaleTimeString("ms-MY");
        } else if (typeof data.timestamp.toDate === "function") {
          const dt = data.timestamp.toDate();
          tsString = dt.toLocaleDateString("ms-MY") + " " + dt.toLocaleTimeString("ms-MY");
        } else if (data.timestamp.seconds) {
          const dt = new Date(data.timestamp.seconds * 1000);
          tsString = dt.toLocaleDateString("ms-MY") + " " + dt.toLocaleTimeString("ms-MY");
        } else {
          const dt = new Date(data.timestamp);
          tsString = dt.toLocaleString("ms-MY");
        }
      } else {
        tsString = new Date().toLocaleString("ms-MY");
      }

      return {
        id: doc.id,
        entityType: data.entityType,
        entityId: data.entityId,
        actionType: data.actionType,
        description: data.description,
        performedBy: data.performedBy,
        performedEmail: data.performedEmail,
        timestamp: tsString,
        metadata: data.metadata || {}
      } as AuditLogRecord;
    });
  } catch (err: any) {
    console.warn(`[Dev Audit] Carian terus Firestore audit logs gagal (mungkin indeks belum sedia/kosong), beralih ke local fallback lambat:`, err);
    try {
      // Local filter fallback if index is not fully built yet
      const allSnapshot = await getDocs(collection(db, path));
      const filtered = allSnapshot.docs
        .map(doc => {
          const data = doc.data();
          let tsString = "";
          
          if (data.timestamp) {
            if (data.timestamp instanceof Timestamp) {
              tsString = data.timestamp.toDate().toLocaleDateString("ms-MY") + " " + data.timestamp.toDate().toLocaleTimeString("ms-MY");
            } else if (typeof data.timestamp.toDate === "function") {
              const dt = data.timestamp.toDate();
              tsString = dt.toLocaleDateString("ms-MY") + " " + dt.toLocaleTimeString("ms-MY");
            } else if (data.timestamp.seconds) {
              const dt = new Date(data.timestamp.seconds * 1000);
              tsString = dt.toLocaleDateString("ms-MY") + " " + dt.toLocaleTimeString("ms-MY");
            } else {
              const dt = new Date(data.timestamp);
              tsString = dt.toLocaleString("ms-MY");
            }
          } else {
            tsString = new Date().toLocaleString("ms-MY");
          }
          return {
            id: doc.id,
            entityType: data.entityType,
            entityId: data.entityId,
            actionType: data.actionType,
            description: data.description,
            performedBy: data.performedBy,
            performedEmail: data.performedEmail,
            timestamp: tsString,
            metadata: data.metadata || {}
          } as AuditLogRecord;
        })
        .filter(item => item.entityType === entityType && item.entityId === entityId);
      
      return filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);
    } catch (fallbackErr) {
      console.warn("Audit logs local filter fallback failed:", fallbackErr);
      return [];
    }
  }
}
