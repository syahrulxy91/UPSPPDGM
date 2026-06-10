import React, { useEffect, useState, useMemo } from "react";
import { 
  Building2, 
  Calendar, 
  Layers, 
  FileText, 
  Activity, 
  Search, 
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  BadgeAlert,
  Percent,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  ChevronDown
} from "lucide-react";
import { useRole } from "../../../shared/contexts/RoleContext";
import { createAuditLog } from "../../../shared/services/auditLogService";
import { toast } from "react-hot-toast";
import { 
  Download, 
  FileSpreadsheet, 
  Printer, 
  ShieldAlert 
} from "lucide-react";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { KpiCard } from "../../../shared/components/ui/KpiCard";
import { SectionCard } from "../../../shared/components/ui/SectionCard";
import { StatusBadge } from "../../../shared/components/ui/StatusBadge";
import { LoadingSkeleton } from "../../../shared/components/ui/LoadingSkeleton";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { InstitusiDetailModal } from "../../institusi/components/InstitusiDetailModal";
import { InstitusiRecord } from "../../../types/institusi";

import { 
  fetchRawReportData, 
  generateReportSummary, 
  ReportFilters, 
  calculateDaysDiff 
} from "../services/reportService";
import { BORANG_METADATA_LIST } from "../../borang/constants/borangMetadata";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

const MONTHS_LIST = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Mac" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Julai" },
  { value: "08", label: "Ogos" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Disember" }
];

export function LaporanPage() {
  const { role, userEmail, permissions } = useRole();
  const [institusiPool, setInstitusiPool] = useState<any[]>([]);
  const [borangPool, setBorangPool] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<ReportFilters>({
    tahun: "2026", // default target year
    bulan: "semua",
    jenisInstitusi: "semua",
    jenisBorang: "semua",
    statusBorang: "semua",
    carianNama: ""
  });

  // Modal State for drill down
  const [selectedInst, setSelectedInst] = useState<InstitusiRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load raw data on mount
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRawReportData();
      setInstitusiPool(data.institusiPool);
      setBorangPool(data.borangPool);
    } catch (err: any) {
      console.error("Gagal mendapatkan dataset laporan:", err);
      setError("Gagal menyambung ke Firestore untuk mendapatkan data laporan & analitik.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Compute lists of unique values dynamically for filters
  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    // Default fallback to keep it realistic
    years.add("2026");
    years.add("2025");
    years.add("2024");
    
    borangPool.forEach(b => {
      if (b.tarikhKemuka) {
        const yr = b.tarikhKemuka.split("-")[0];
        if (yr && yr.length === 4) years.add(yr);
      }
    });
    
    institusiPool.forEach(i => {
      if (i.tarikhDaftar) {
        const yr = i.tarikhDaftar.split("-")[0];
        if (yr && yr.length === 4) years.add(yr);
      }
    });

    return Array.from(years).sort().reverse();
  }, [borangPool, institusiPool]);

  const uniqueFormTypes = useMemo(() => {
    return BORANG_METADATA_LIST.map(item => item.label);
  }, []);

  // Generate metrics based on applied filters reactively!
  const summary = useMemo(() => {
    return generateReportSummary(institusiPool, borangPool, filters);
  }, [institusiPool, borangPool, filters]);

  // Reset Filters handler
  const handleResetFilters = () => {
    setFilters({
      tahun: "semua",
      bulan: "semua",
      jenisInstitusi: "semua",
      jenisBorang: "semua",
      statusBorang: "semua",
      carianNama: ""
    });
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const executeDownload = (headers: string[], rows: any[][], baseName: string, isExcel: boolean = false) => {
    if (!permissions.canExportReports) {
      toast.error("Akses Dihalang: Peranan anda (Viewer) tidak mempunyai kebenaran untuk mengeksport laporan.");
      return;
    }

    // Build CSV Row content
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => 
        row.map(cell => {
          const val = cell === null || cell === undefined ? "" : String(cell);
          return `"${val.replace(/"/g, '""')}"`;
        }).join(",")
      )
    ].join("\r\n");

    // Add UTF-8 BOM
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const yearMonth = filters.tahun !== "semua" 
      ? `${filters.tahun}-${filters.bulan !== "semua" ? filters.bulan.padStart(2, '0') : 'tahunan'}`
      : new Date().toISOString().substring(0, 7);

    const ext = isExcel ? "xlsx" : "csv";
    const fileName = `${baseName}-${yearMonth}.${ext}`;

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Create real audit log
    createAuditLog({
      entityType: "laporan",
      entityId: "eksport",
      actionType: "eksport",
      description: `Mengeksport ${headers.length} kolum data bagi laporan: "${baseName}" ke rujukan format [.${ext}]`,
      performedBy: role || "pegawai",
      performedEmail: userEmail || "pegawai@ppdguamusang.gov.my"
    });

    toast.success(`Berjaya mengeksport: ${fileName}`);
  };

  const handleExportInstitusi = (isExcel: boolean = false) => {
    const headers = [
      "Nama Institusi",
      "Kategori",
      "Status Operasi",
      "Bilangan Urusan Borang",
      "Bilangan Borang Tertunggak (>14H)",
      "Tarikh Daftar"
    ];

    const rows = (summary.filteredInstitusi || []).map((ins: any) => {
      const bCount = (borangPool || []).filter(b => b.institusiId === ins.id).length;
      const bOverdue = (borangPool || []).filter(b => {
        const diffDays = calculateDaysDiff(b.tarikhKemuka);
        return b.institusiId === ins.id && (b.status === "dikemukakan" || b.status === "diproses") && diffDays > 14;
      }).length;

      const katTranslated = ins.kategori === "tadika swasta" 
        ? "Tadika Swasta" 
        : ins.kategori === "sekolah swasta" 
          ? "Sekolah Swasta" 
          : ins.kategori === "pusat tuisyen" 
            ? "Pusat Tuisyen" 
            : String(ins.kategori || "");

      const activeTranslated = ins.statusOperasi === "aktif" 
        ? "Aktif" 
        : ins.statusOperasi === "tidak aktif" 
          ? "Tidak Aktif" 
          : ins.statusOperasi === "digantung" 
            ? "Digantung" 
            : String(ins.statusOperasi || "");

      return [
        ins.namaInstitusi,
        katTranslated,
        activeTranslated,
        bCount,
        bOverdue,
        ins.tarikhDaftar || "N/A"
      ];
    });

    executeDownload(headers, rows, "laporan-unit-swasta", isExcel);
  };

  const handleExportBorang = (isExcel: boolean = false) => {
    const headers = [
      "No. Rujukan",
      "Nama Institusi",
      "Kategori Institusi",
      "Jenis Borang",
      "Tarikh Pengemukaan",
      "Status Urusan",
      "Pegawai Bertindak"
    ];

    const rows = (summary.filteredBorang || []).map((b: any) => {
      const statusTranslated = b.status === "draf" 
        ? "Draf" 
        : b.status === "dikemukakan" 
          ? "Dikemukakan" 
          : b.status === "diproses" 
            ? "Dalam Proses" 
            : b.status === "lulus" 
              ? "Lulus" 
              : b.status === "tolak" 
                ? "Semakan / Tolak" 
                : String(b.status || "");

      return [
        b.noRujukan || "N/A",
        b.namaInstitusi || "N/A",
        b.jenisInstitusi || "N/A",
        b.jenisBorang || "N/A",
        b.tarikhKemuka || "N/A",
        statusTranslated,
        b.pegawai || "PPD GM"
      ];
    });

    executeDownload(headers, rows, "laporan-borang", isExcel);
  };

  const handleExportSummary = (isExcel: boolean = false) => {
    const headers = [
      "Metrik Penilaian KPI",
      "Rekod Nilai",
      "Slogan / Sektor Ulasan"
    ];

    const rows = [
      ["Jumlah Institusi Berdaftar", summary.totalInstitusi, "Jumlah keseluruhan tadika, sekolah dan pusat tuisyen terpilih"],
      ["Jumlah Institusi Aktif", summary.totalActiveInstitusi, "Beroperasi dan memegang kebenaran sah semasa"],
      ["Jumlah Institusi Tidak Aktif / Digantung", summary.totalInactiveInstitusi, "Diberhentikan operasi buat masa kini"],
      ["Jumlah Borang Draf", summary.totalDrafBorang, "Dalam draf pemohon bersangkutan"],
      ["Jumlah Borang Dikemukakan", summary.totalSubmittedBorang, "Telah dikemuka dan menanti pemantauan awal"],
      ["Jumlah Borang Lulus", summary.totalLulusBorang, "Telah lulus bernombor kelulusan rasmi"],
      ["Jumlah Borang Ditolak / Semakan", summary.totalTolakBorang, "Pindaan dokumen sokongan diperlukan"],
      ["Jumlah Borang Tertunggak (>14 Hari)", summary.totalOverdueBorang14Days, "Sila ambil perhatian segera, melebihi piagam"],
    ];

    executeDownload(headers, rows, "ringkasan-laporan-semasa", isExcel);
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6" id="reports-loading-view">
        <PageHeader 
          title="Laporan & Analitik" 
          subtitle="Sila tunggu sementara enjin analitik menjana ringkasan laporan..." 
        />
        <div className="h-28 bg-white border border-slate-200/60 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white border border-slate-200/60 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6" id="reports-error-view">
        <PageHeader 
          title="Laporan & Analitik" 
          subtitle="Gagal memaparkan data" 
        />
        <EmptyState 
          title="Ralat Hubungan Sistem" 
          description={error} 
        />
        <div className="flex justify-center">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-primary-800 hover:bg-primary-900 text-white rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cuba Semula
          </button>
        </div>
      </div>
    );
  }

  // Handle drilling into institution detail
  const handleOpenInstProfile = (instId: string) => {
    const matched = institusiPool.find(ins => ins.id === instId);
    if (matched) {
      setSelectedInst(matched);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="space-y-8 pb-12" id="reports-main-view">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Laporan & Analitik" 
          subtitle="Ringkasan pematuhan, grafik statistik, dan laporan operasi Unit Pendidikan Swasta." 
        />
        <button
          onClick={() => loadData()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all self-start md:self-auto cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          Kemas Kini Data (Live)
        </button>
      </div>

      {/* 2. Interactive Filters Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4" id="laporan-filter-panel">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-primary-100 text-primary-900 rounded-lg text-xs font-black uppercase">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary-700" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
              Tapisan & Parameter Analitik
            </h3>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[10px] font-extrabold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-colors"
          >
            Kosongkan Tapisan
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Carian Nama */}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Carian Institusi</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik namu institusi..."
                value={filters.carianNama}
                onChange={(e) => handleFilterChange("carianNama", e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50/50 border border-slate-250 p-2 pl-8.5 rounded-lg text-slate-800 focus:outline-hidden focus:border-primary-600 placeholder:text-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Tahun */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Tahun Urusan</label>
            <select
              value={filters.tahun}
              onChange={(e) => handleFilterChange("tahun", e.target.value)}
              className="w-full text-xs font-extrabold bg-slate-50/50 border border-slate-250 p-2 rounded-lg text-slate-800 focus:outline-hidden focus:border-primary-600 cursor-pointer"
            >
              <option value="semua">Semua Tahun</option>
              {uniqueYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Bulan */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Bulan Urusan</label>
            <select
              value={filters.bulan}
              onChange={(e) => handleFilterChange("bulan", e.target.value)}
              className="w-full text-xs font-extrabold bg-slate-50/50 border border-slate-250 p-2 rounded-lg text-slate-800 focus:outline-hidden focus:border-primary-600 cursor-pointer"
            >
              <option value="semua">Semua Bulan</option>
              {MONTHS_LIST.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Jenis Institusi */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Jenis Institusi</label>
            <select
              value={filters.jenisInstitusi}
              onChange={(e) => handleFilterChange("jenisInstitusi", e.target.value)}
              className="w-full text-xs font-extrabold bg-slate-50/50 border border-slate-250 p-2 rounded-lg text-slate-800 focus:outline-hidden focus:border-primary-600 cursor-pointer"
            >
              <option value="semua">Semua Jenis</option>
              <option value="tadika swasta">Tadika Swasta</option>
              <option value="sekolah swasta">Sekolah Swasta</option>
              <option value="pusat tuisyen">Pusan Tuisyen</option>
            </select>
          </div>

          {/* Status Borang */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Status Borang</label>
            <select
              value={filters.statusBorang}
              onChange={(e) => handleFilterChange("statusBorang", e.target.value)}
              className="w-full text-xs font-extrabold bg-slate-50/50 border border-slate-250 p-2 rounded-lg text-slate-800 focus:outline-hidden focus:border-primary-600 cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              <option value="draf">Draf</option>
              <option value="dikemukakan">Dikemukakan</option>
              <option value="diproses">Diproses</option>
              <option value="lulus">Lulus</option>
              <option value="tolak">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Jenis Borang Extended Filter */}
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
          <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Jenis Borang Rasmi BPS KPM</label>
          <select
            value={filters.jenisBorang}
            onChange={(e) => handleFilterChange("jenisBorang", e.target.value)}
            className="w-full text-xs font-extrabold bg-slate-50/50 border border-slate-250 p-2.5 rounded-lg text-slate-800 focus:outline-hidden focus:border-primary-600 cursor-pointer"
          >
            <option value="semua">Semua Jenis Fail Borang Penubuhan & Permit Guru</option>
            {uniqueFormTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <style>{`
        @media print {
          /* Hide app shell layout sidebars, navigation bar, filters, and export toolbars */
          header, aside, .no-print, #laporan-filter-panel, #laporan-eksport-toolbar, nav, button, .app-shell-sidebar, .app-shell-header {
            display: none !important;
          }
          body, #reports-main-view {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #reports-main-view {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          /* High contrast print styling */
          .bg-slate-50, .bg-slate-100 {
            background-color: #fafafa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 250px !important;
          }
        }
      `}</style>

      {/* 2B. Eksport Laporan & Kawalan Akses */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print" id="laporan-eksport-toolbar">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${
            permissions.canExportReports 
              ? "bg-emerald-50 border-emerald-150 text-emerald-800" 
              : "bg-rose-50 border-rose-150 text-rose-800"
          }`}>
            {permissions.canExportReports ? (
              <FileSpreadsheet className="w-4.5 h-4.5" />
            ) : (
              <ShieldAlert className="w-4.5 h-4.5" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              Urusan Eksport & Cetakan Laporan
            </h4>
            <p className="text-[11px] text-slate-450 font-semibold leading-relaxed">
              {permissions.canExportReports 
                ? "Sila pilih jenis data di bawah untuk mengeksport rekod di bawah berpandukan parameter tapisan aktif di atas."
                : "Akses Terhad: Akaun pelawat (Viewer) hanya dibenarkan membaca laporan tanpa kebenaran mengeksport database."}
            </p>
          </div>
        </div>

        {/* Action Buttons Hub */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download CSV Group */}
          <div className="dropdown relative group">
            <button
              disabled={!permissions.canExportReports}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black border rounded-xl shadow-xs transition-all cursor-pointer ${
                permissions.canExportReports
                  ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Muat Turun CSV</span>
            </button>
            {permissions.canExportReports && (
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-35 min-w-[200px] text-left">
                <button
                  onClick={() => handleExportInstitusi(false)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors block cursor-pointer"
                >
                  Senarai Institusi (.csv)
                </button>
                <button
                  onClick={() => handleExportBorang(false)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors block cursor-pointer"
                >
                  Senarai Urusan Borang (.csv)
                </button>
                <button
                  onClick={() => handleExportSummary(false)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors block cursor-pointer"
                >
                  Laporan Ringkasan Utama (.csv)
                </button>
              </div>
            )}
          </div>

          {/* Download Excel Group */}
          <div className="dropdown relative group">
            <button
              disabled={!permissions.canExportReports}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black border rounded-xl shadow-xs transition-all cursor-pointer ${
                permissions.canExportReports
                  ? "bg-slate-900 border-slate-950 text-white hover:bg-slate-800"
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-secondary-300 font-extrabold" />
              <span>Eksport ke Excel</span>
            </button>
            {permissions.canExportReports && (
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-35 min-w-[210px] text-left">
                <button
                  onClick={() => handleExportInstitusi(true)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors block cursor-pointer"
                >
                  Senarai Institusi (.xlsx)
                </button>
                <button
                  onClick={() => handleExportBorang(true)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors block cursor-pointer"
                >
                  Senarai Urusan Borang (.xlsx)
                </button>
                <button
                  onClick={() => handleExportSummary(true)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors block cursor-pointer"
                >
                  Ringkasan Eksekutif (.xlsx)
                </button>
              </div>
            )}
          </div>

          {/* Cetak / Simpan PDF Button */}
          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black bg-primary-800 hover:bg-primary-900 text-white rounded-xl shadow-xs transition-all cursor-pointer border border-primary-950/20"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Cetakan PDF</span>
          </button>
        </div>
      </div>

      {/* 3. Baris Atas (Top Row): KPI Cards (8 KPI card grids in high density) */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 pl-0.5">
          <Activity className="w-3.5 h-3.5 text-primary-750" />
          Penunjuk Prestasi Utama (KPI) - Berasaskan Tapisan Semasa
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5" id="report-kpi-grid">
          <KpiCard
            label="Institusi"
            value={summary.totalInstitusi}
            hint="Jumlah sekolah"
            tone="default"
          />
          <KpiCard
            label="Aktif"
            value={summary.totalActiveInstitusi}
            hint="Operasi aktif"
            tone="success"
          />
          <KpiCard
            label="Tidak Aktif"
            value={summary.totalInactiveInstitusi}
            hint="Tutup/Gantung"
            tone="info"
          />
          <KpiCard
            label="Draf"
            value={summary.totalDrafBorang}
            hint="Tindakan tempatan"
            tone="default"
          />
          <KpiCard
            label="Dikemuka"
            value={summary.totalSubmittedBorang}
            hint="Menunggu tindakan"
            tone="warning"
          />
          <KpiCard
            label="Lulus"
            value={summary.totalLulusBorang}
            hint="Permit diluluskan"
            tone="success"
          />
          <KpiCard
            label="Ditolak"
            value={summary.totalTolakBorang}
            hint="Kritikan / Pembetulan"
            tone="danger"
          />
          <KpiCard
            label="Overdue >14H"
            value={summary.totalOverdueBorang14Days}
            hint="Tindakan tertunggak"
            tone="danger"
          />
        </div>
      </div>

      {/* 4. Bahagian Tengah: Graf Analitik & Kad Pematuhan Semasa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="reports-analytics-grid">
        
        {/* LAJUR SEBELAH KIRI (1/3): Kad Pematuhan Semasa & Pecahan Status Penjanaan */}
        <div className="space-y-6">
          
          {/* KAD PEMATUHAN SEMASA */}
          <div className="bg-gradient-to-br from-primary-900 to-primary-950 text-white rounded-2xl p-5 border border-primary-800 shadow-md flex flex-col justify-between space-y-5">
            <div className="space-y-1">
              <span className="text-[11px] font-black tracking-widest text-[#d97706] uppercase">SEKTOR SWASTA GUA MUSANG</span>
              <h3 className="text-base font-black tracking-tight font-sans">
                Pematuhan Semasa (Compliance)
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Progress 1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-350">Kadar Borang Diproses</span>
                  <span className="text-white font-mono font-black">{summary.peratusBorangDiproses}%</span>
                </div>
                <div className="w-full bg-primary-950 rounded-full h-2 border border-primary-800 relative overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${summary.peratusBorangDiproses}%` }} />
                </div>
              </div>

              {/* Progress 2 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-350">Kejayaan Kadar Kelulusan</span>
                  <span className="text-white font-mono font-black">{summary.peratusBorangLulus}%</span>
                </div>
                <div className="w-full bg-primary-950 rounded-full h-2 border border-primary-800 relative overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${summary.peratusBorangLulus}%` }} />
                </div>
              </div>

              {/* Progress 3 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-350">Kemas Kini Data Tahunan</span>
                  <span className="text-white font-mono font-black">{summary.peratusInstitusiHantarTahunan}%</span>
                </div>
                <div className="w-full bg-primary-950 rounded-full h-2 border border-primary-800 relative overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${summary.peratusInstitusiHantarTahunan}%` }} />
                </div>
              </div>
            </div>

            {/* ALERT BOXES FOR STALE COMPLIANCE */}
            <div className="border-t border-primary-800 pt-4 space-y-2 text-[11px] font-bold">
              {summary.bilanganAmaranMerah > 0 ? (
                <div className="flex items-center gap-2 text-rose-300 bg-rose-950/40 p-2 rounded-xl border border-rose-900/60">
                  <BadgeAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{summary.bilanganAmaranMerah} Amaran Merah (Draf &gt; 7 hari) dikesan!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-300 bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/60">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Tiada Amaran Merah (Draf terkawal)</span>
                </div>
              )}

              {summary.bilanganAmaranOren > 0 ? (
                <div className="flex items-center gap-2 text-amber-300 bg-amber-950/30 p-2 rounded-xl border border-amber-900/50">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{summary.bilanganAmaranOren} Amaran Oren (Tertunggak &gt; 14 hari)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-300 bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/60">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Sedia Maklum: Tiada borang tertunggak &gt; 14 hari</span>
                </div>
              )}
            </div>

            <p className="text-[9px] text-slate-450 text-center select-none pt-1">
              * Peratusan dihitung menerusi pengesahan waktu kemukan rasmi di Sektor Swasta.
            </p>
          </div>

          {/* DOUGHNUT CHART - PECAHAN STATUS BORANG */}
          <SectionCard title="Pecahan Status Penyerahan (Borang)">
            <div className="h-64 flex flex-col justify-between" id="chart-pie-wrapper">
              {summary.borangByStatus.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                  Tiada pecahan status bagi data ini
                </div>
              ) : (
                <div className="grid grid-cols-5 items-center gap-2 h-full">
                  <div className="col-span-3 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summary.borangByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {summary.borangByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value} Borang`, 'Jumlah']} 
                          contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '10px', fontSize: '11px', border: 'none' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend labels */}
                  <div className="col-span-2 space-y-2 pl-2">
                    {summary.borangByStatus.map((st, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                          <span className="text-[10px] font-extrabold text-slate-600 truncate">{st.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-800 font-mono pl-4">{st.value} fail</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-[10px] text-slate-450 border-t border-slate-100/80 pt-2 text-center font-bold">
                * Statistik pecahan urus draf & kelulusan penubuhan.
              </div>
            </div>
          </SectionCard>

        </div>

        {/* LAJUR SEBELAH KANAN (2/3): Graf Bar dan Graf Line */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* GRAF BAR (1) - BILANGAN BORANG MENGIKUT JENIS */}
            <SectionCard title="Bilangan Borang Mengikut Klasifikasi BPS">
              <div className="h-64" id="chart-bar-jenis">
                {summary.borangByJenis.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                    Tiada data borang mengikut penapis semasa
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.borangByJenis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                      <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '10px', fontSize: '11px', border: 'none' }}
                        formatter={(value) => [`${value} Permohonan`, 'Jumlah']} 
                      />
                      <Bar dataKey="value" fill="#0369a1" radius={[4, 4, 0, 0]} barSize={34}>
                        {summary.borangByJenis.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.name.includes("I") ? "#1d4ed8" : entry.name.includes("II") ? "#0369a1" : entry.name.includes("III") ? "#0e7490" : entry.name.includes("IV") ? "#0f766e" : "#4338ca"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <p className="text-[9px] font-semibold text-slate-450 mt-1 pl-1">
                Anotasi: BPS I (Penubuhan), BPS II (Pendaftaran), BPS III (Pendaftar), BPS IV (Permit Guru), BPS V (Pembaharuan).
              </p>
            </SectionCard>

            {/* GRAF LINE (2) - TREND PENGHANTARAN BULANAN */}
            <SectionCard title="Trend Penghantaran Borang Bulanan (Kronologi)">
              <div className="h-64" id="chart-line-trend">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.borangTrendBulanan} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                    <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '10px', fontSize: '11px', border: 'none' }}
                      formatter={(value) => [`${value} Fail Diterima`, 'Jumlah']} 
                    />
                    <Area type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] font-semibold text-slate-450 mt-1 pl-1">
                * Trend di atas menggambarkan kitaran aktiviti pihak pendaftar mengikut fasa.
              </p>
            </SectionCard>

          </div>

          {/* GRAF BAR MENDATAR (3) - TERTUNGGAK TERTINGGI (HORIZ PLANNER) */}
          <SectionCard title="Institusi Dengan Jumlah Borang Tertunggak Tertinggi (>14 Hari)">
            <div className="h-64" id="chart-bar-horizontal">
              {summary.institusiBorangOverdue.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold bg-slate-50/70 border border-dashed border-slate-200 rounded-xl px-4 py-8 text-center max-w-sm mx-auto space-y-1">
                  <span className="block font-black text-slate-500">Hebat! Tiada Borang Tertunggak</span>
                  <span className="block text-[10px] text-slate-400">Semua pendaftaran dan kebenaran permit IPS Gua Musang diproses mengikut jadual.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={summary.institusiBorangOverdue}
                    margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} fontWeight="bold" allowDecimals={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={9} 
                      fontWeight="bold" 
                      width={120}
                      tickFormatter={(value) => (value.length > 18 ? `${value.slice(0, 16)}...` : value)}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '10px', fontSize: '11px', border: 'none' }}
                      formatter={(value) => [`${value} Borang Tertunggak`, 'Urusan']} 
                    />
                    <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={16}>
                      {summary.institusiBorangOverdue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#be123c" : index === 1 ? "#e11d48" : "#f43f5e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

        </div>
      </div>

      {/* 5. Bahagian Bawah: Jadual Laporan Detail & Pematuhan Sektor */}
      <div id="institusi-reports-table-view">
        <SectionCard title="Jadual Laporan & Pematuhan Urusan Institusi (SPS PPD)">
          <div className="space-y-4">
            
            {/* Table Header metadata info */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <p className="text-slate-500 font-bold">
                Menunjukkan <span className="text-primary-800 font-black">{summary.institusiReportList.length}</span> buah institusi berdaftar untuk carian semasa.
              </p>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-lg">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Operasi Aktif
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-extrabold bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                  Tutup/Digantung
                </span>
              </div>
            </div>

            {/* Table wrapper */}
            {summary.institusiReportList.length === 0 ? (
              <EmptyState 
                title="Tiada Rekod Dijumpai" 
                description="Tiada IPS atau borang yang sepadan dengan tapisan filter yang anda pilih. Sila tukar atau kosongkan parameter penapis di atas." 
              />
            ) : (
              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-450 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-4.5 px-5 select-none">Nama Institusi Swasta</th>
                      <th className="py-4.5 px-4 select-none">Jenis Klasifikasi</th>
                      <th className="py-4.5 px-4 text-center select-none">Jumlah Borang</th>
                      <th className="py-4.5 px-4 select-none text-center">Status Terkini</th>
                      <th className="py-4.5 px-4 select-none text-center">Tindakan Tertunggak</th>
                      <th className="py-4.5 px-5 text-right select-none">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {summary.institusiReportList.map((ins, index) => {
                      const isStale = ins.borangTertunggak > 0;
                      
                      return (
                        <tr key={ins.id} className="hover:bg-slate-50/50 transition-colors group">
                          
                          {/* Nama */}
                          <td className="py-3 px-5 font-bold text-slate-900">
                            <div className="flex flex-col gap-1">
                              <span className="group-hover:text-primary-850 transition-colors leading-snug">
                                {ins.namaInstitusi}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] uppercase font-bold shrink-0 px-1.5 border rounded-sm ${
                                  ins.statusOperasi === "aktif"
                                    ? "bg-emerald-50/70 border-emerald-150 text-emerald-700"
                                    : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}>
                                  {ins.statusOperasi}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Kategori */}
                          <td className="py-3 px-4">
                            <span className="capitalize font-mono font-bold text-slate-500 bg-slate-50 border border-slate-150 rounded px-2 py-0.5 whitespace-nowrap">
                              {ins.kategori}
                            </span>
                          </td>

                          {/* Jumlah Borang */}
                          <td className="py-3 px-4 text-center font-mono font-black text-slate-700">
                            {ins.jumlahBorang}
                          </td>

                          {/* Status Terkini */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center">
                              <StatusBadge label={ins.statusTerkini || "Tiada"} tone={
                                ins.statusTerkini === "lulus" 
                                  ? "success" 
                                  : ins.statusTerkini === "tolak" 
                                  ? "danger" 
                                  : ins.statusTerkini === "diproses" 
                                  ? "warning" 
                                  : ins.statusTerkini === "dikemukakan"
                                  ? "info"
                                  : "neutral"
                              } />
                            </div>
                          </td>

                          {/* Borang Tertunggak */}
                          <td className="py-3 px-4 text-center font-bold">
                            <div className="flex justify-center items-center">
                              {isStale ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-150">
                                  <AlertCircleBadge />
                                  {ins.borangTertunggak} tertunggak
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold text-[11px]">—</span>
                              )}
                            </div>
                          </td>

                          {/* Tindakan */}
                          <td className="py-3 px-5 text-right">
                            <button
                              onClick={() => handleOpenInstProfile(ins.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-200 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Lihat Profil
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
          </div>
        </SectionCard>
      </div>

      {/* 6. Drill-down Profil IPS Modal */}
      {selectedInst && (
        <InstitusiDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInst(null);
          }}
          institusi={selectedInst}
        />
      )}

    </div>
  );
}

// Small red alert blinker bullet
function AlertCircleBadge() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
    </span>
  );
}

export default LaporanPage;
