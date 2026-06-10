import { getInstitusiList } from "../../institusi/services/institusiService";
import { getBorangList } from "../../borang/services/borangService";
import { InstitusiRecord } from "../../../types/institusi";
import { BorangRecord, BorangStatus } from "../../../types/borang";
import { BORANG_METADATA_LIST, BORANG_METADATA_REGISTRY, getBorangMetadata } from "../../borang/constants/borangMetadata";
import { collection, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../../lib/firebase";

export interface InstitusiReportItem {
  id: string;
  namaInstitusi: string;
  kategori: string;
  jumlahBorang: number;
  statusTerkini: string; // latest form status or "Tiada"
  borangTertunggak: number; // outstanding forms > 14 days
  statusOperasi: string;
}

export interface ReportSummary {
  // KPIs
  totalInstitusi: number;
  totalActiveInstitusi: number;
  totalInactiveInstitusi: number;
  totalDrafBorang: number;
  totalSubmittedBorang: number;
  totalLulusBorang: number;
  totalTolakBorang: number;
  totalOverdueBorang14Days: number;

  // Pematuhan Semasa
  peratusBorangDiproses: number;
  peratusBorangLulus: number;
  peratusInstitusiHantarTahunan: number;
  bilanganAmaranMerah: number;
  bilanganAmaranOren: number;

  // Chart structures
  borangByJenis: { name: string; value: number }[];
  borangByStatus: { name: string; value: number; color?: string }[];
  borangTrendBulanan: { name: string; value: number }[];
  institusiBorangOverdue: { id: string; name: string; value: number; total: number }[];

  // Tabular Data
  institusiReportList: InstitusiReportItem[];
  filteredBorang?: any[];
  filteredInstitusi?: any[];
}

// Helper to count days between a date and today
export function calculateDaysDiff(tarikhStr: string): number {
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

export interface ReportFilters {
  tahun: string;
  bulan: string;
  jenisInstitusi: string;
  jenisBorang: string;
  statusBorang: string;
  carianNama: string;
}

/**
 * Fetches all core datasets dynamically.
 */
export async function fetchRawReportData() {
  const [institusiPool, borangPool] = await Promise.all([
    getInstitusiList().catch(() => [] as InstitusiRecord[]),
    getBorangList().catch(() => [] as BorangRecord[]),
  ]);
  return { institusiPool, borangPool };
}

/**
 * Processes unfiltered pools of data and produces filtered states and summaries reactive to selected inputs.
 */
export function generateReportSummary(
  institusiPool: InstitusiRecord[],
  borangPool: BorangRecord[],
  filters: ReportFilters
): ReportSummary {
  // Let's filter the data first!
  // To keep it reactive, we apply the filters to the lists:
  
  // 1. Filtered Borang
  const filteredBorang = borangPool.filter((b) => {
    // Carian nama institusi
    if (filters.carianNama.trim()) {
      const bNama = (b.namaInstitusi || "").toLowerCase();
      const search = filters.carianNama.trim().toLowerCase();
      if (!bNama.includes(search)) return false;
    }
    
    // Jenis institusi
    if (filters.jenisInstitusi && filters.jenisInstitusi !== "semua") {
      if (b.jenisInstitusi !== filters.jenisInstitusi) return false;
    }
    
    // Jenis borang
    if (filters.jenisBorang && filters.jenisBorang !== "semua") {
      if (b.jenisBorang !== filters.jenisBorang) return false;
    }
    
    // Status borang
    if (filters.statusBorang && filters.statusBorang !== "semua") {
      if (b.status !== filters.statusBorang) return false;
    }
    
    // Tarikh year & month extraction from tarikhKemuka (YYYY-MM-DD)
    if (b.tarikhKemuka) {
      const parts = b.tarikhKemuka.split("-");
      if (parts.length === 3) {
        const bYear = parts[0];
        const bMonth = parts[1]; // numeric string e.g. "05" or "12"
        
        if (filters.tahun && filters.tahun !== "semua" && bYear !== filters.tahun) {
          return false;
        }
        if (filters.bulan && filters.bulan !== "semua" && bMonth !== filters.bulan) {
          return false;
        }
      } else {
        // If date invalid and there is a year / month filter, skip
        if ((filters.tahun && filters.tahun !== "semua") || (filters.bulan && filters.bulan !== "semua")) {
          return false;
        }
      }
    } else {
      if ((filters.tahun && filters.tahun !== "semua") || (filters.bulan && filters.bulan !== "semua")) {
        return false;
      }
    }
    
    return true;
  });

  // 2. Filtered Institusi
  const filteredInstitusi = institusiPool.filter((ins) => {
    // Carian nama
    if (filters.carianNama.trim()) {
      const iNama = (ins.namaInstitusi || "").toLowerCase();
      const search = filters.carianNama.trim().toLowerCase();
      if (!iNama.includes(search)) return false;
    }
    
    // Jenis institusi
    if (filters.jenisInstitusi && filters.jenisInstitusi !== "semua") {
      if (ins.kategori !== filters.jenisInstitusi) return false;
    }
    
    // If Year / Month filters exist, also consider if the school was registered or uploaded data during that time or has forms
    if (filters.tahun && filters.tahun !== "semua") {
      // Keep schools that was registered in this year or has a form in this year
      const insFormsInYear = borangPool.filter(b => b.institusiId === ins.id && b.tarikhKemuka.startsWith(filters.tahun));
      const registeredInYear = ins.tarikhDaftar && ins.tarikhDaftar.startsWith(filters.tahun);
      if (!registeredInYear && insFormsInYear.length === 0) {
        return false;
      }
    }
    
    if (filters.bulan && filters.bulan !== "semua") {
      // Keep schools registered in or having forms in this month
      const targetPrefix = `${filters.tahun !== "semua" ? filters.tahun : ""}-${filters.bulan}`;
      const insFormsInMonth = borangPool.filter(b => b.institusiId === ins.id && b.tarikhKemuka.includes(targetPrefix));
      const registeredInMonth = ins.tarikhDaftar && ins.tarikhDaftar.includes(targetPrefix);
      if (!registeredInMonth && insFormsInMonth.length === 0) {
        return false;
      }
    }
    
    return true;
  });

  // KPI Calculations
  const totalInstitusi = filteredInstitusi.length;
  const totalActiveInstitusi = filteredInstitusi.filter(i => i.statusOperasi === "aktif").length;
  const totalInactiveInstitusi = filteredInstitusi.filter(i => i.statusOperasi === "tidak aktif" || i.statusOperasi === "digantung").length;
  
  const totalDrafBorang = filteredBorang.filter(b => b.status === "draf").length;
  const totalSubmittedBorang = filteredBorang.filter(b => b.status === "dikemukakan").length;
  const totalLulusBorang = filteredBorang.filter(b => b.status === "lulus").length;
  const totalTolakBorang = filteredBorang.filter(b => b.status === "tolak").length;

  // Let's count "Jumlah borang tertunggak > 14 hari"
  // A form is overdue if it's in progress (not completed) and been submitted/modified > 14 days ago.
  // Common states for unprocessed/work-in-progress: `dikemukakan`, `diproses`.
  const overdueBorangList = filteredBorang.filter((b) => {
    const diffDays = calculateDaysDiff(b.tarikhKemuka);
    return (b.status === "dikemukakan" || b.status === "diproses") && diffDays > 14;
  });
  const totalOverdueBorang14Days = overdueBorangList.length;

  // compliance warning counts
  // red: draf > 7 days
  const bilanganAmaranMerah = filteredBorang.filter(b => {
    const diffDays = calculateDaysDiff(b.tarikhKemuka);
    return b.status === "draf" && diffDays > 7;
  }).length;

  // orange: submitted/processing > 14 days
  const bilanganAmaranOren = totalOverdueBorang14Days;

  // 1. Compliance: Peratus borang diproses
  // Processed = state is "diproses", "lulus" or "tolak"
  // Total forms that are submitted/exist
  const totalInRegistry = filteredBorang.length;
  const processedCount = filteredBorang.filter(b => ["diproses", "lulus", "tolak"].includes(b.status)).length;
  const peratusBorangDiproses = totalInRegistry > 0 ? Math.round((processedCount / totalInRegistry) * 100) : 0;

  // 2. Compliance: Peratus borang lulus
  // Of all evaluated/processed forms, how many are 'lulus'?
  // Evaluated: lulus + tolak
  const evaluatedCount = totalLulusBorang + totalTolakBorang;
  const peratusBorangLulus = evaluatedCount > 0 ? Math.round((totalLulusBorang / evaluatedCount) * 100) : 0;

  // 3. Compliance: Peratus institusi hantar data tahunan
  // Number of institutions in Gua Musang that has at least one submitted or processed form for the year
  const currentYear = filters.tahun && filters.tahun !== "semua" ? filters.tahun : new Date().getFullYear().toString();
  const institutionsWithSubmissions = filteredInstitusi.filter((ins) => {
    // Check if school has at least one submitted form for the target year
    return borangPool.some(b => b.institusiId === ins.id && b.tarikhKemuka.startsWith(currentYear));
  }).length;
  const peratusInstitusiHantarTahunan = totalInstitusi > 0 ? Math.round((institutionsWithSubmissions / totalInstitusi) * 100) : 0;

  // --- CHART 1: Forms by type (Jenis Borang) ---
  const formTypesMap: Record<string, number> = {};
  
  // Pre-populate all standard types from metadata centers to ensure complete coverage in charts
  BORANG_METADATA_LIST.forEach((item) => {
    formTypesMap[item.shortLabel] = 0;
  });

  filteredBorang.forEach(b => {
    const jBorangCode = Object.keys(BORANG_METADATA_REGISTRY).find(
      key => BORANG_METADATA_REGISTRY[key].label === b.jenisBorang || key === b.jenisBorang
    ) || b.jenisBorang;
    const meta = getBorangMetadata(jBorangCode);
    formTypesMap[meta.shortLabel] = (formTypesMap[meta.shortLabel] || 0) + 1;
  });

  const borangByJenis = Object.entries(formTypesMap).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => {
    const itemA = BORANG_METADATA_LIST.find(x => x.shortLabel === a.name);
    const itemB = BORANG_METADATA_LIST.find(x => x.shortLabel === b.name);
    return (itemA?.susunanPaparan || 99) - (itemB?.susunanPaparan || 99);
  });

  // --- CHART 2: Breakdown of Form Status ---
  const borangByStatus = [
    { name: "Draf", value: totalDrafBorang, color: "#94a3b8" }, // slate gray
    { name: "Dikemukakan", value: totalSubmittedBorang, color: "#38bdf8" }, // sky blue
    { name: "Diproses", value: filteredBorang.filter(b => b.status === "diproses").length, color: "#f59e0b" }, // amber
    { name: "Lulus", value: totalLulusBorang, color: "#10b981" }, // emerald green
    { name: "Tolak", value: totalTolakBorang, color: "#f43f5e" }, // rose red
  ].filter(status => status.value > 0); // show only statuses with count > 0

  // --- CHART 3: Line / Area Chart - Monthly submissions trend ---
  const monthsMalay = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis"];
  const monthlySubmissionsMap: Record<string, number> = {};
  
  // Pre-fill months to have a clean chronology sequence
  for (let i = 1; i <= 12; i++) {
    monthlySubmissionsMap[String(i).padStart(2, "0")] = 0;
  }

  filteredBorang.forEach(b => {
    if (b.tarikhKemuka) {
      const p = b.tarikhKemuka.split("-");
      if (p.length === 3) {
        const monthNum = p[1]; // e.g "05"
        monthlySubmissionsMap[monthNum] = (monthlySubmissionsMap[monthNum] || 0) + 1;
      }
    }
  });

  const borangTrendBulanan = Object.entries(monthlySubmissionsMap)
    .map(([key, value]) => {
      const monthIdx = parseInt(key, 10) - 1;
      return {
        name: monthsMalay[monthIdx],
        value,
      };
    });

  // --- CHART 4: Horizontal bar chart - Schools with the highest overdue forms ---
  // Count of overdue forms (> 14 days) grouped by school name
  const schoolOverdueMap: Record<string, { id: string; count: number; totalForms: number }> = {};
  
  // prefill all filtered schools to default 0 overdue
  filteredInstitusi.forEach(ins => {
    schoolOverdueMap[ins.namaInstitusi] = { id: ins.id, count: 0, totalForms: 0 };
  });

  // Calculate overdue count and total count
  borangPool.forEach(b => {
    const diffDays = calculateDaysDiff(b.tarikhKemuka);
    const isOverdue = (b.status === "dikemukakan" || b.status === "diproses") && diffDays > 14;
    
    if (schoolOverdueMap[b.namaInstitusi]) {
      schoolOverdueMap[b.namaInstitusi].totalForms += 1;
      if (isOverdue) {
        schoolOverdueMap[b.namaInstitusi].count += 1;
      }
    }
  });

  const institusiBorangOverdue = Object.entries(schoolOverdueMap)
    .map(([name, pack]) => ({
      id: pack.id,
      name,
      value: pack.count,
      total: pack.totalForms,
    }))
    .filter(item => item.value > 0) // only list those with actual overdue counts
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5 most overdue institutions

  // --- TABLE: Create report breakdown for each institution ---
  const institusiReportList: InstitusiReportItem[] = filteredInstitusi.map((ins) => {
    const insBorangs = borangPool.filter(b => b.institusiId === ins.id);
    
    // latest status by date
    const sortedForms = [...insBorangs].sort((a, b) => b.tarikhKemuka.localeCompare(a.tarikhKemuka));
    const statusTerkini = sortedForms.length > 0 ? sortedForms[0].status : "Tiada";

    const overdueCount = insBorangs.filter(b => {
      const diffDays = calculateDaysDiff(b.tarikhKemuka);
      return (b.status === "dikemukakan" || b.status === "diproses") && diffDays > 14;
    }).length;

    return {
      id: ins.id,
      namaInstitusi: ins.namaInstitusi,
      kategori: ins.kategori,
      jumlahBorang: insBorangs.length,
      statusTerkini,
      borangTertunggak: overdueCount,
      statusOperasi: ins.statusOperasi,
    };
  });

  return {
    totalInstitusi,
    totalActiveInstitusi,
    totalInactiveInstitusi,
    totalDrafBorang,
    totalSubmittedBorang,
    totalLulusBorang,
    totalTolakBorang,
    totalOverdueBorang14Days,
    peratusBorangDiproses,
    peratusBorangLulus,
    peratusInstitusiHantarTahunan,
    bilanganAmaranMerah,
    bilanganAmaranOren,
    borangByJenis,
    borangByStatus,
    borangTrendBulanan,
    institusiBorangOverdue,
    institusiReportList,
    filteredBorang,
    filteredInstitusi,
  };
}

export interface ReminderItem {
  id: string;
  namaInstitusi: string;
  institusiId: string;
  borangId?: string;
  jenisBorang?: string;
  isu: string;
  penerangan: string;
  kategoriIsu: "draf_terbengkalai" | "belum_proses" | "belum_hantar_tahunan" | "pencerobohan_aktif";
  bilanganHari: number;
  keutamaan: "tinggi" | "sederhana" | "rendah";
}

/**
 * Generates the live compliance reminders based on real Firestore pools.
 */
export function generateReminderList(
  institusiPool: InstitusiRecord[],
  borangPool: BorangRecord[]
): ReminderItem[] {
  const reminders: ReminderItem[] = [];
  const currentYear = "2026"; // Current operational sandbox year

  // 1. Draf terbengkalai (Draft forms abandoned > 7 days)
  borangPool.forEach((b) => {
    if (b.status === "draf") {
      const daysDiff = calculateDaysDiff(b.tarikhKemuka);
      if (daysDiff > 7) {
        const jBorangCode = Object.keys(BORANG_METADATA_REGISTRY).find(
          key => BORANG_METADATA_REGISTRY[key].label === b.jenisBorang || key === b.jenisBorang
        ) || b.jenisBorang;
        const mappedLabel = getBorangMetadata(jBorangCode).label;
        reminders.push({
          id: `draf-${b.id}`,
          namaInstitusi: b.namaInstitusi,
          institusiId: b.institusiId,
          borangId: b.id,
          jenisBorang: mappedLabel,
          isu: "Draf Terbengkalai",
          penerangan: `Borang draf "${mappedLabel}" dikepilkan tetapi belum dikemukakan selama ${daysDiff} hari.`,
          kategoriIsu: "draf_terbengkalai",
          bilanganHari: daysDiff,
          keutamaan: daysDiff > 14 ? "tinggi" : "sederhana",
        });
      }
    }
  });

  // 2. Borang dikemukakan belum diproses (Submitted forms unprocessed > 14 days)
  borangPool.forEach((b) => {
    if (b.status === "dikemukakan") {
      const daysDiff = calculateDaysDiff(b.tarikhKemuka);
      if (daysDiff > 14) {
        const jBorangCode = Object.keys(BORANG_METADATA_REGISTRY).find(
          key => BORANG_METADATA_REGISTRY[key].label === b.jenisBorang || key === b.jenisBorang
        ) || b.jenisBorang;
        const mappedLabel = getBorangMetadata(jBorangCode).label;
        reminders.push({
          id: `unproc-${b.id}`,
          namaInstitusi: b.namaInstitusi,
          institusiId: b.institusiId,
          borangId: b.id,
          jenisBorang: mappedLabel,
          isu: "Urusan Pengemukaan Tertunggak",
          penerangan: `Permohonan "${mappedLabel}" belum diproses oleh pegawai nakon ${daysDiff} hari dikemukakan.`,
          kategoriIsu: "belum_proses",
          bilanganHari: daysDiff,
          keutamaan: "tinggi",
        });
      }
    }
  });

  // 3. Institusi belum hantar data tahunan (Active institutions with no submissions in current year)
  institusiPool.forEach((ins) => {
    if (ins.statusOperasi === "aktif") {
      const hasCurrentYearForm = borangPool.some(
         (b) => b.institusiId === ins.id && b.tarikhKemuka && b.tarikhKemuka.startsWith(currentYear)
      );
      if (!hasCurrentYearForm) {
        reminders.push({
          id: `no-ann-${ins.id}`,
          namaInstitusi: ins.namaInstitusi,
          institusiId: ins.id,
          isu: "Data Tahunan Sesi Semasa Tiada",
          penerangan: `Institusi bertaraf aktif masih belum mengemukakan data penubuhan atau permit guru baharu bagi sesi tahun ${currentYear}.`,
          kategoriIsu: "belum_hantar_tahunan",
          bilanganHari: 0, // no specific submission date
          keutamaan: "sederhana",
        });
      }
    }
  });

  // 4. Institusi tidak aktif tetapi masih ada permohonan baharu (Inactive school with newer forms)
  institusiPool.forEach((ins) => {
    if (ins.statusOperasi === "tidak aktif" || ins.statusOperasi === "digantung") {
      const activeForms = borangPool.filter(
        (b) => b.institusiId === ins.id && (b.status === "dikemukakan" || b.status === "diproses")
      );
      activeForms.forEach((b) => {
        const jBorangCode = Object.keys(BORANG_METADATA_REGISTRY).find(
          key => BORANG_METADATA_REGISTRY[key].label === b.jenisBorang || key === b.jenisBorang
        ) || b.jenisBorang;
        const mappedLabel = getBorangMetadata(jBorangCode).label;
        reminders.push({
          id: `pencerobohan-aktif-${ins.id}-${b.id}`,
          namaInstitusi: ins.namaInstitusi,
          institusiId: ins.id,
          borangId: b.id,
          jenisBorang: mappedLabel,
          isu: "Permohonan Institusi Tidak Aktif",
          penerangan: `Pekeliling kritikal: Institusi ini berstatus "${ins.statusOperasi}" tetapi merekodkan borang permohonan aktif "${mappedLabel}".`,
          kategoriIsu: "pencerobohan_aktif",
          bilanganHari: calculateDaysDiff(b.tarikhKemuka),
          keutamaan: "tinggi",
        });
      });
    }
  });

  // Sort reminders: "tinggi" first, then by days diff descending
  return reminders.sort((a, b) => {
    if (a.keutamaan === b.keutamaan) {
      return b.bilanganHari - a.bilanganHari;
    }
    return a.keutamaan === "tinggi" ? -1 : 1;
  });
}

/**
 * Fetches reminders generated by Cloud Functions in the live DB `/reminders` collection.
 */
export async function getBackendReminders(): Promise<ReminderItem[]> {
  try {
    const qSnapshot = await getDocs(collection(db, "reminders"));
    const records: any[] = [];
    qSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.resolved) {
        records.push({ id: doc.id, ...data });
      }
    });

    if (records.length === 0) {
      return [];
    }

    // Convert back from the Firestore entity representation to the ReminderItem React structure
    const mapped: ReminderItem[] = records.map((r: any) => {
      let bHari = 0;
      if (r.createdAt) {
        let createdDate = new Date();
        if (typeof r.createdAt === "string") {
          createdDate = new Date(r.createdAt);
        } else if (r.createdAt.toDate) {
          createdDate = r.createdAt.toDate();
        }
        bHari = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        id: r.id,
        namaInstitusi: r.namaInstitusi || "Pendidikan Swasta",
        institusiId: r.ipsId || "",
        borangId: r.entityId || "",
        jenisBorang: r.title ? r.title.replace(/^[^:]+:\s*/, "") : "Borang Rasmi",
        isu: r.title || "Amaran Backend",
        penerangan: r.description || "",
        kategoriIsu: r.reminderType === "kelengahan_draf" ? "draf_terbengkalai" : "belum_proses",
        bilanganHari: bHari,
        keutamaan: r.severity === "tinggi" ? "tinggi" : "sederhana",
      };
    });

    return mapped.sort((a, b) => {
      if (a.keutamaan === b.keutamaan) {
        return b.bilanganHari - a.bilanganHari;
      }
      return a.keutamaan === "tinggi" ? -1 : 1;
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.GET, "reminders");
    } catch (e) {
      console.warn("Ralat membaca reminders dari Firestore, menggunakan fallback.", e);
    }
    return [];
  }
}
