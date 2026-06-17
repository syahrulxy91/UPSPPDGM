import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../../lib/firebase";

export interface ActionItem {
  id: string;
  sourceType: "pematuhan" | "tindakan" | "borang" | "reminders" | "dapatan" | string;
  sourceId: string;
  institutionId?: string;
  institutionName: string;
  title: string;
  description: string;
  domain?: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  detectedAt?: string;
  dueDate?: string;
  assignedOfficer?: string;
  actionLabel?: string;
  actionHref?: string;
  priorityScore?: number;
  isResolved: boolean;
}

// B. Utility check for days difference
export function calculateDaysDiff(tarikhStr?: string): number {
  if (!tarikhStr) return 0;
  try {
    const parts = tarikhStr.split("-");
    if (parts.length !== 3) return 0;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const tarikh = new Date(year, month, day);
    tarikh.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - tarikh.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch (err) {
    return 0;
  }
}

// C. Utility Scorer - UI UX Pro Max Mathematical Prioritizer
export function getActionPriority(item: Omit<ActionItem, "priorityScore">): number {
  let score = 0;

  // 1. Overdue/Tertunggak baseline (Major scale indicator)
  if (item.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      score += 45; // Overdue gets immediate highest priority boost
    } else if (diffDays <= 7) {
      score += 25; // Due within a week
    } else if (diffDays <= 14) {
      score += 15; // Due within 2 weeks
    }
  }

  // 2. Severity level scale (up to 30)
  if (item.severity === "critical") score += 30;
  else if (item.severity === "high") score += 20;
  else if (item.severity === "medium") score += 10;
  else if (item.severity === "low") score += 5;

  // 3. Status indicators (up to 15)
  const normStatus = (item.status || "").toLowerCase();
  if (normStatus === "overdue" || normStatus === "tidak lengkap" || normStatus === "baru") {
    score += 15;
  } else if (normStatus === "diproses" || normStatus === "dalam tindakan") {
    score += 8;
  }

  // 4. Source relevance
  if (item.sourceType === "tindakan") {
    score += 8; // Actions are already verified as active enforcement issues
  } else if (item.sourceType === "pematuhan") {
    score += 5;
  }

  return score;
}

// D. Mapper: mapRecordToActionItem
export function mapRecordToActionItem(
  record: any,
  sourceType: "pematuhan" | "tindakan" | "borang" | "reminders"
): ActionItem | null {
  if (!record) return null;

  try {
    const id = record.id || "";
    
    switch (sourceType) {
      case "pematuhan": {
        // We only map if it requires action (tidak lengkap, hampir luput, or tindakanSegera is true)
        const isActionable = 
          record.tindakanSegera === true || 
          record.statusDokumen === "tidak lengkap" || 
          record.statusDokumen === "hampir luput";

        if (!isActionable) return null;

        const isCritical = record.tindakanSegera === true || record.statusDokumen === "tidak lengkap";
        const severity = isCritical ? "high" : "medium";
        const title = record.statusDokumen === "tidak lengkap" 
          ? "Dokumen Belum Lengkap"
          : "Permit/Kelulusan Hampir Luput";

        return {
          id: `pematuhan-${id}`,
          sourceType: "pematuhan",
          sourceId: id,
          institutionId: record.institusiId || "",
          institutionName: record.namaInstitusi || "Institusi Pendidikan Swasta",
          title: `Isu Pematuhan: ${title}`,
          description: `Perakuan ${record.jenisDokumen || "dokumen utama"} bertaraf "${record.statusDokumen}". Semakan segera diperlukan.`,
          domain: "Pematuhan",
          severity: isCritical ? "high" : "medium",
          status: record.statusDokumen || "tidak lengkap",
          dueDate: record.tarikhTamat || "",
          assignedOfficer: record.pegawai || "Semua Pegawai",
          actionLabel: "Periksa Fail",
          isResolved: record.statusDokumen === "lengkap",
        };
      }

      case "tindakan": {
        // Action is resolved if status is selesai
        if (record.statusKes === "selesai") return null;

        const isOverdue = record.statusKes === "overdue" || record.statusKes === "baru";
        const severity = isOverdue ? "high" : record.keutamaan === "tinggi" ? "high" : "medium";
        const title = record.statusKes === "overdue"
          ? "Tindakan Susulan Tertunggak"
          : "Dapatan Naziran Belum Selesai";

        return {
          id: `tindakan-${id}`,
          sourceType: "tindakan",
          sourceId: id,
          institutionName: record.namaInstitusi || "Institusi Pendidikan Swasta",
          title: title,
          description: `Kes "${record.jenisKes || "Amandemen Arahan Pihak Berkuasa"}" bertaraf "${record.statusKes}". Catatan: ${record.catatan || "Menunggu maklumbalas."}`,
          domain: "Tindakan Susulan",
          severity: severity as "critical" | "high" | "medium" | "low",
          status: record.statusKes || "baru",
          dueDate: record.tarikhTindakan || "",
          assignedOfficer: record.pegawai || "Pegawai SPS",
          actionLabel: "Kemaskini Kes",
          isResolved: false,
        };
      }

      case "borang": {
        // Look for delayed/stale form submissions
        const status = record.status || "";
        if (status !== "draf" && status !== "dikemukakan") return null;

        const daysDiff = calculateDaysDiff(record.tarikhKemuka);
        
        if (status === "draf" && daysDiff > 7) {
          return {
            id: `borang-draf-${id}`,
            sourceType: "borang",
            sourceId: id,
            institutionId: record.institusiId || "",
            institutionName: record.namaInstitusi || "Institusi Pendidikan Swasta",
            title: "Urusan Pengemukaan Dilengahkan",
            description: `Borang "${record.jenisBorang}" berstatus draf terbengkalai selama ${daysDiff} hari sejak kemasukan.`,
            domain: "Pendaftaran",
            severity: daysDiff > 14 ? "high" : "medium",
            status: "Draf Terbengkalai",
            dueDate: "",
            assignedOfficer: record.pegawai || "Pegawai SPS",
            actionLabel: "Hubungi IPS",
            isResolved: false,
          };
        }

        if (status === "dikemukakan" && daysDiff > 14) {
          return {
            id: `borang-unproc-${id}`,
            sourceType: "borang",
            sourceId: id,
            institutionId: record.institusiId || "",
            institutionName: record.namaInstitusi || "Institusi Pendidikan Swasta",
            title: "Urusan Pengemukaan Tertunggak",
            description: `Borang "${record.jenisBorang}" dikemukakan belum diproses selama ${daysDiff} hari oleh pegawai rujukan.`,
            domain: "Pendaftaran",
            severity: "high",
            status: "Belum Diproses",
            dueDate: "",
            assignedOfficer: record.pegawai || "Sektor Pendidikan Swasta",
            actionLabel: "Proses Borang",
            isResolved: false,
          };
        }

        return null;
      }

      case "reminders": {
        if (record.resolved === true) return null;
        
        return {
          id: `reminder-${id}`,
          sourceType: "reminders",
          sourceId: id,
          institutionId: record.ipsId || "",
          institutionName: record.namaInstitusi || "Institusi Pendidikan Swasta",
          title: record.title || "Peringatan Pematuhan",
          description: record.description || "Terdapat amaran sistem bagi cawangan institusi ini.",
          domain: "Pematuhan",
          severity: record.severity === "tinggi" ? "high" : "medium",
          status: "Aktif",
          dueDate: record.dueDate || "",
          isResolved: false,
        };
      }

      default:
        return null;
    }
  } catch (err) {
    console.warn("Ralat mapping record to ActionItem:", err);
    return null;
  }
}

// E. Dedupe items helper
export function dedupeActionItems(items: ActionItem[]): ActionItem[] {
  const seenKeys = new Set<string>();
  return items.filter((item) => {
    // Deduplicate by institutions having matching core titles/descriptions to reduce notification clutter
    const key = `${item.institutionName}-${item.title}`.toLowerCase();
    const sourceKey = `${item.sourceType}-${item.sourceId}`;
    if (seenKeys.has(key) || seenKeys.has(sourceKey)) return false;
    seenKeys.add(key);
    seenKeys.add(sourceKey);
    return true;
  });
}

// F. Real-time Firestore Custom Hook - useComplianceActionQueue
export function useComplianceActionQueue() {
  const [pematuhanList, setPematuhanList] = useState<any[]>([]);
  const [tindakanList, setTindakanList] = useState<any[]>([]);
  const [borangList, setBorangList] = useState<any[]>([]);
  const [remindersList, setRemindersList] = useState<any[]>([]);

  // Individual listener loading trackers to prevent flickers
  const [statusLoad, setStatusLoad] = useState({
    pematuhan: false,
    tindakan: false,
    borang: false,
    reminders: false,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Listen to 'pematuhan'
    const unsubPematuhan = onSnapshot(
      collection(db, "pematuhan"),
      (snapshot) => {
        const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPematuhanList(records);
        setStatusLoad((prev) => ({ ...prev, pematuhan: true }));
      },
      (err) => {
        console.error("Firestore onSnapshot error (pematuhan):", err);
        try {
          handleFirestoreError(err, OperationType.GET, "pematuhan");
        } catch (e: any) {
          setError(`Gagal memuat naik rekod pematuhan: ${e.message}`);
        }
        setStatusLoad((prev) => ({ ...prev, pematuhan: true }));
      }
    );

    // 2. Listen to 'tindakan'
    const unsubTindakan = onSnapshot(
      collection(db, "tindakan"),
      (snapshot) => {
        const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTindakanList(records);
        setStatusLoad((prev) => ({ ...prev, tindakan: true }));
      },
      (err) => {
        console.error("Firestore onSnapshot error (tindakan):", err);
        setStatusLoad((prev) => ({ ...prev, tindakan: true }));
      }
    );

    // 3. Listen to 'borang'
    const unsubBorang = onSnapshot(
      collection(db, "borang"),
      (snapshot) => {
        const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBorangList(records);
        setStatusLoad((prev) => ({ ...prev, borang: true }));
      },
      (err) => {
        console.error("Firestore onSnapshot error (borang):", err);
        setStatusLoad((prev) => ({ ...prev, borang: true }));
      }
    );

    // 4. Listen to 'reminders'
    const unsubReminders = onSnapshot(
      collection(db, "reminders"),
      (snapshot) => {
        const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRemindersList(records);
        setStatusLoad((prev) => ({ ...prev, reminders: true }));
      },
      (err) => {
        console.error("Firestore onSnapshot error (reminders):", err);
        setStatusLoad((prev) => ({ ...prev, reminders: true }));
      }
    );

    // Cleanup listeners on unmount
    return () => {
      unsubPematuhan();
      unsubTindakan();
      unsubBorang();
      unsubReminders();
    };
  }, []);

  // Global loading state: True if any stream is still doing its initial load
  const isGlobalLoading = useMemo(() => {
    return !statusLoad.pematuhan || !statusLoad.tindakan || !statusLoad.borang || !statusLoad.reminders;
  }, [statusLoad]);

  // Derived, prioritized & sorted action items stream
  const actionQueue = useMemo<ActionItem[]>(() => {
    const rawQueue: ActionItem[] = [];

    // Map 'pematuhan' records
    pematuhanList.forEach((rec) => {
      const item = mapRecordToActionItem(rec, "pematuhan");
      if (item) rawQueue.push(item);
    });

    // Map 'tindakan' records
    tindakanList.forEach((rec) => {
      const item = mapRecordToActionItem(rec, "tindakan");
      if (item) rawQueue.push(item);
    });

    // Map 'borang' records
    borangList.forEach((rec) => {
      const item = mapRecordToActionItem(rec, "borang");
      if (item) rawQueue.push(item);
    });

    // Map 'reminders' records
    remindersList.forEach((rec) => {
      const item = mapRecordToActionItem(rec, "reminders");
      if (item) rawQueue.push(item);
    });

    // Deduplicate to avoid repeating notification types
    const uniqueQueue = dedupeActionItems(rawQueue);

    // Score and append priorityScore to each item
    const scoredQueue = uniqueQueue.map((item) => {
      const pScore = getActionPriority(item);
      return { ...item, priorityScore: pScore };
    });

    // Sort descending by priorityScore, then by title
    return scoredQueue.sort((a, b) => {
      const scoreDiff = (b.priorityScore || 0) - (a.priorityScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.title.localeCompare(b.title);
    });
  }, [pematuhanList, tindakanList, borangList, remindersList]);

  return {
    actionQueue,
    loading: isGlobalLoading,
    error,
  };
}
