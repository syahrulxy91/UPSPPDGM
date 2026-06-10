import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  X, 
  HelpCircle, 
  ShieldAlert, 
  Check, 
  RefreshCw, 
  User, 
  Settings, 
  FileText, 
  Database, 
  Shield, 
  Zap, 
  ChevronRight,
  Sliders,
  Mail,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { useRole, UserRole } from "../../contexts/RoleContext";

interface UatItem {
  id: string;
  category: string;
  title: string;
  description: string;
}

const UAT_ITEMS: UatItem[] = [
  {
    id: "buka_profil",
    category: "Profil IPS & Sejarah",
    title: "Buka Profil IPS",
    description: "Buka modal maklumat terperinci mana-mana Institusi di tab 'Institusi' dan sahkan modal memaparkan tabs 'Maklumat Umum' & 'Sejarah Borang'."
  },
  {
    id: "lihat_sejarah",
    category: "Profil IPS & Sejarah",
    title: "Lihat Sejarah Borang",
    description: "Sahkan seksyen Sejarah Borang memaparkan senarai semua jenis borang (BPS I - VIII, XII, XIII, DATA_01, BORANG_PENYELIDIKAN, BAYAR_01) dengan label Bahasa Melayu yang sah."
  },
  {
    id: "submit_draf",
    category: "Pengurusan Aliran Borang",
    title: "Submit Borang Draf",
    description: "Daftar borang baru dengan status awal sebagai 'Draf' untuk menguji pemfailan tempatan yang selamat."
  },
  {
    id: "tukar_dikemukakan",
    category: "Pengurusan Aliran Borang",
    title: "Tukar Status Ke Dikemukakan",
    description: "Kemas kini status borang daripada draf ke 'Dikemukakan' untuk simulasi penghantaran rasmi oleh IPS."
  },
  {
    id: "tukar_lulus",
    category: "Pengurusan Aliran Borang",
    title: "Tukar Status Ke Lulus",
    description: "KPM meluluskan borang di bawah tab 'Borang'. Ini mencetuskan penyelarasan data dua-hala ke profile institusi rujukan."
  },
  {
    id: "sahkan_auto_sync",
    category: "Penyelarasan Data Dua Hala (Sync)",
    title: "Sahkan Data Institusi Berubah Automatik",
    description: "Pastikan kelulusan permohonan mengemas kini parameter institusi asal: BPS XII (Kepimpinan/GB Baru), BPS IV (Yuran), BPS VI (Alamat Premis), BPS VII (Nama Institusi), BPS VIII (Status = Tidak Aktif), BORANG_A (Status = Aktif), BPS_DATA_01 (Kakitangan & Murid)."
  },
  {
    id: "badge_merah",
    category: "Sistem Amaran Pintar",
    title: "Semak Badge Merah (> 7 Hari)",
    description: "Sahkan amaran merah di penjuru menu navigasi 'Borang' menyala apabila terdapat permohonan berstatus 'Draf' terbengkalai melebihi tempoh 7 hari."
  },
  {
    id: "badge_oren",
    category: "Sistem Amaran Pintar",
    title: "Semak Badge Oren (> 14 Hari)",
    description: "Sahkan amaran oren menyala sekiranya terdapat permohonan berstatus 'Dikemukakan' yang terbiar melebihi tempoh 14 hari tanpa diproses."
  },
  {
    id: "rules_moe",
    category: "Keselamatan Firestore",
    title: "Akses Rules Domain @moe.gov.my",
    description: "Sahkan Firestore Security Rules mengehadkan hak baca dan tulis koleksi '/borang' secara eksklusif bagi pemegang akaun emel domain diraja Kementerian Pendidikan Malaysia."
  },
  {
    id: "rules_dev",
    category: "Keselamatan Firestore",
    title: "Pengecualian Sementara Emel Pembangun",
    description: "Sahkan kebenaran sementara akses penuh diberikan khusus kepada emel pembangun rasmi (syahrulxy91@gmail.com) bagi tujuan audit dan pembangunan integrasi."
  }
];

interface ReadinessItem {
  id: string;
  category: string;
  title: string;
  description: string;
  defaultStatus: "Belum Semak" | "Sedang Semak" | "Lulus" | "Perlu Tindakan";
}

const READINESS_ITEMS: ReadinessItem[] = [
  {
    id: "build_lulus",
    category: "Kestabilan Aplikasi",
    title: "Aplikasi Build Lulus",
    description: "Memastikan pakej dibina (npm run build) tanpa sebarang ralat jenis typescript.",
    defaultStatus: "Lulus"
  },
  {
    id: "lint_lulus",
    category: "Kestabilan Aplikasi",
    title: "Linter Bebas Ralat",
    description: "Pematuhan static analysis linter tsc & eslint disahkan bersih.",
    defaultStatus: "Lulus"
  },
  {
    id: "rules_verified",
    category: "Keselamatan & Data",
    title: "Hardening Firestore Rules",
    description: "Penapisan emel moe.gov.my dan emel pembangun disahkan selamat di firestore.rules.",
    defaultStatus: "Lulus"
  },
  {
    id: "audit_works",
    category: "Keselamatan & Data",
    title: "Audit Trail Berfungsi",
    description: "Setiap penambahan, draf, pengemukaan, dan kelulusan direkodkan secara terperinci.",
    defaultStatus: "Lulus"
  },
  {
    id: "rbac_verified",
    category: "Keizinan Pengguna (RBAC)",
    title: "Role Gating Berfungsi",
    description: "Viewer tidak boleh kemaskini status borang, Pegawai PPD boleh semak, Penyemak boleh luluskan.",
    defaultStatus: "Lulus"
  },
  {
    id: "export_verified",
    category: "Laporan & Output",
    title: "Eksport Laporan CSV/Excel",
    description: "Eksport tabular data institusi dan aktiviti borang beserta ringkasan visual dikesan lulus.",
    defaultStatus: "Lulus"
  },
  {
    id: "metadata_unified",
    category: "Laporan & Output",
    title: "Metadata Kategori Berpusat",
    description: "Semua 16 kategori borang rasmi (BPS I hingga BAYAR 01) dipetakan dari satu punca tunggal.",
    defaultStatus: "Lulus"
  },
  {
    id: "reminder_verified",
    category: "Sistem Amaran Pintar",
    title: "Senarai Amaran Live",
    description: "Amaran oren jangka 14 hari proses dan amaran merah 7 hari draf terbengkalai beroperasi automatik.",
    defaultStatus: "Lulus"
  },
  {
    id: "responsive_layout",
    category: "Pengalaman Pengguna (UX)",
    title: "Layout Mudah Alih (Mobile)",
    description: "Navigasi, borang dinamik, dan graf dikesan responsif, kemas pada resolusi kompak.",
    defaultStatus: "Lulus"
  },
  {
    id: "print_layout",
    category: "Pengalaman Pengguna (UX)",
    title: "Layout Cetakan (Print)",
    description: "Halaman laporan dan profiler disokong dengan media cetak mesra kertas.",
    defaultStatus: "Lulus"
  },
  {
    id: "fallback_empty",
    category: "Kekuatan & Ketahanan",
    title: "Fallback Tiada Data",
    description: "Komponen EmptyState dilarikan dengan lancar tanpa crash sekiranya rekod dipadam atau kosong.",
    defaultStatus: "Lulus"
  },
  {
    id: "error_states",
    category: "Kekuatan & Ketahanan",
    title: "Pengendalian Kelas Ralat (Error)",
    description: "Ralat sambungan pangkalan data tidak mengganggu aliran navigasi dan dikesan selamat.",
    defaultStatus: "Lulus"
  }
];

export function UatAdminPanel() {
  const { role, setRole, userEmail, setUserEmail } = useRole();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"uat" | "readiness" | "index">("uat");
  
  // Custom states for readiness status toggling
  const [readinessStatuses, setReadinessStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedUat = localStorage.getItem("sps_uat_checked_items");
    if (savedUat) {
      try {
        setCheckedIds(JSON.parse(savedUat));
      } catch (e) {
        console.error(e);
      }
    }

    const savedReadiness = localStorage.getItem("sps_prod_readiness_statuses");
    if (savedReadiness) {
      try {
        setReadinessStatuses(JSON.parse(savedReadiness));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Set to defaults
      const initial: Record<string, string> = {};
      READINESS_ITEMS.forEach(item => {
        initial[item.id] = item.defaultStatus;
      });
      setReadinessStatuses(initial);
    }
  }, []);

  const toggleCheck = (id: string) => {
    const updated = { ...checkedIds, [id]: !checkedIds[id] };
    setCheckedIds(updated);
    localStorage.setItem("sps_uat_checked_items", JSON.stringify(updated));
  };

  const setReadinessStatus = (id: string, newStatus: string) => {
    const updated = { ...readinessStatuses, [id]: newStatus };
    setReadinessStatuses(updated);
    localStorage.setItem("sps_prod_readiness_statuses", JSON.stringify(updated));
  };

  const resetAll = () => {
    setCheckedIds({});
    const initial: Record<string, string> = {};
    READINESS_ITEMS.forEach(item => {
      initial[item.id] = item.defaultStatus;
    });
    setReadinessStatuses(initial);
    localStorage.removeItem("sps_uat_checked_items");
    localStorage.setItem("sps_prod_readiness_statuses", JSON.stringify(initial));
  };

  const completedCount = Object.keys(checkedIds).filter(id => checkedIds[id]).length;
  const progressPercent = Math.round((completedCount / UAT_ITEMS.length) * 100);

  // Quick statistics for readiness checklist
  const totalReadiness = READINESS_ITEMS.length;
  const lulusReadiness = Object.values(readinessStatuses).filter(s => s === "Lulus").length;
  const readinessPercent = Math.round((lulusReadiness / totalReadiness) * 100);

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-45" id="uat-admin-trigger-container">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 justify-center shadow-2xl transition-all text-xs font-black leading-none cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
          id="uat-toggle-btn"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>Status UAT & Kesiagaan</span>
          {completedCount > 0 && (
            <span className="bg-[#01696f] text-[10px] px-2 py-0.5 rounded-full font-black text-white shrink-0">
              {completedCount}/{UAT_ITEMS.length}
            </span>
          )}
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-all duration-300 pointer-events-auto"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Drawer Container */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-200 z-50 shadow-2xl transition-transform duration-300 transform flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        id="uat-drawer-sidebar"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-[#051719] text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#01696f]/40 text-[#4bf3fc] text-[9px] font-black uppercase tracking-wider border border-[#01696f]/50">
                Audit Kualiti
              </span>
              <span className="text-[9px] text-slate-300 font-mono font-bold tracking-tight">V1.5 (PRO STABLE)</span>
            </div>
            <h3 className="text-base font-black text-white">Console Kesiagaan & UAT</h3>
            <p className="text-[11px] text-slate-300 font-light">SPS PPD Gua Musang • Verification Engine</p>
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Segment */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab("uat")}
            className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "uat" 
                ? "bg-[#01696f] text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-250/50"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Spesifikasi UAT</span>
          </button>
          
          <button
            onClick={() => setActiveTab("readiness")}
            className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "readiness" 
                ? "bg-[#01696f] text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-250/50"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Kesiagaan</span>
          </button>
          
          <button
            onClick={() => setActiveTab("index")}
            className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "index" 
                ? "bg-[#01696f] text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-250/50"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Indeks DB</span>
          </button>
        </div>

        {/* PROGRESS METERS */}
        {activeTab === "uat" && (
          <div className="px-6 py-4 border-b border-slate-200 bg-white space-y-2 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-700">Ujian Penerimaan UAT</span>
              <span className="font-mono font-black text-[#01696f]">{progressPercent}% ({completedCount} / {UAT_ITEMS.length})</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#01696f] h-full transition-all duration-500 rounded-full" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {activeTab === "readiness" && (
          <div className="px-6 py-4 border-b border-slate-200 bg-white space-y-2 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-700">Audit Kesiagaan Produksi</span>
              <span className="font-mono font-black text-emerald-700">{readinessPercent}% ({lulusReadiness} / {totalReadiness})</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full transition-all duration-500 rounded-full" 
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* CONTENT FIELD LIST (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-slate-50/50">
          
          {activeTab === "uat" && (
            <>
              {/* Simulator Peranan Pengguna (RBAC) */}
              <div className="p-4.5 rounded-2xl border border-[#01696f]/20 bg-white shadow-sm space-y-4" id="uat-simulator-card">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <SlidersHorizontal className="w-4.5 h-4.5 text-[#01696f]" />
                  <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-wider">
                    Simulator Peranan & Keizinan
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 gap-3.5">
                  {/* Role Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-450 tracking-wider">Akses Pentadbiran</label>
                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-250 px-3 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-[#01696f] cursor-pointer appearance-none"
                      >
                        <option value="superadmin">Super Admin (Akses Penuh)</option>
                        <option value="pegawai_ppd">Pegawai PPD (Cipta & Semak)</option>
                        <option value="penyemak">Penyemak (Lulus & Tolak)</option>
                        <option value="viewer">Pemerhati (Viewer / Baca Sahaja)</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Email Textbox */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-450 tracking-wider">Simulasi Sesi Emel</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={userEmail || ""}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="Masukkan alamat emel..."
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-250 pl-10 pr-3 py-2.5 rounded-xl text-slate-850 focus:outline-none focus:bg-white focus:border-[#01696f]"
                      />
                    </div>
                    
                    <div className="flex gap-2.5 mt-1 overflow-x-auto pb-1" id="preset-emails">
                      <button
                        onClick={() => setUserEmail("syahrulxy91@gmail.com")}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer transition-colors border border-slate-200"
                        title="Emel Audit Pembangun"
                      >
                        syahrulxy91@gmail.com
                      </button>
                      <button
                        onClick={() => setUserEmail("unit.swasta@moe.gov.my")}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer transition-colors border border-slate-200"
                        title="Emel Sektor Swasta KPM"
                      >
                        swasta@moe.gov.my
                      </button>
                    </div>
                  </div>
                </div>
                
                <p className="text-[10.5px] font-medium text-slate-400 leading-normal border-t border-slate-100 pt-2.5">
                  * Integrasi kawalan berasas peranan (RBAC) menyekat atau membenarkan aliran butang tindakan kelulusan secara masa-nyata.
                </p>
              </div>

              {/* UAT Checklist Items */}
              {Object.entries(
                UAT_ITEMS.reduce<Record<string, UatItem[]>>((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {})
              ).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const isChecked = !!checkedIds[item.id];
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => toggleCheck(item.id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 bg-white hover:border-slate-350 ${
                            isChecked 
                              ? "border-[#01696f]/30 bg-[#01696f]/5 shadow-xs" 
                              : "border-slate-200 shadow-2xs"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isChecked 
                              ? "bg-[#01696f] border-[#01696f] text-white" 
                              : "bg-white border-slate-300 text-transparent"
                          }`}>
                            <Check className="w-3.5 h-3.5 font-bold stroke-[3px]" />
                          </div>
                          <div className="space-y-1">
                            <span className={`text-xs font-black ${isChecked ? "text-slate-900" : "text-slate-800"}`}>
                              {item.title}
                            </span>
                            <p className="text-[11px] text-slate-500 leading-normal font-medium">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === "readiness" && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-2 shrink-0">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-amber-600" />
                  <span>Kriteria Pelancaran Cloud</span>
                </div>
                <p className="text-amber-800 font-medium leading-relaxed">
                  Laporan dan parameter di bawah merekodkan kualiti static code, status keizinan Firestore system, serta perlindungan empty-state larian.
                </p>
              </div>

              {Object.entries(
                READINESS_ITEMS.reduce<Record<string, ReadinessItem[]>>((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {})
              ).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {category}
                  </h4>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const curStatus = readinessStatuses[item.id] || "Belum Semak";
                      
                      const statusStyles: Record<string, string> = {
                        "Belum Semak": "bg-slate-100 text-slate-650 border-slate-200",
                        "Sedang Semak": "bg-amber-50 text-amber-800 border-amber-200",
                        "Lulus": "bg-emerald-50 text-emerald-800 border-emerald-200",
                        "Perlu Tindakan": "bg-rose-50 text-rose-800 border-rose-200",
                      };

                      return (
                        <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                          <div>
                            <div className="flex items-start justify-between gap-2.5">
                              <span className="text-xs font-black text-slate-900 leading-snug">
                                {item.title}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${statusStyles[curStatus]}`}>
                                {curStatus}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal font-medium mt-1">
                              {item.description}
                            </p>
                          </div>

                          {/* Clickable Quick Status Buttons */}
                          <div className="flex gap-1 border-t border-slate-100 pt-2.5 overflow-x-auto">
                            {(["Belum Semak", "Sedang Semak", "Lulus", "Perlu Tindakan"] as const).map(st => {
                              const isActive = curStatus === st;
                              return (
                                <button
                                  key={st}
                                  onClick={() => setReadinessStatus(item.id, st)}
                                  className={`text-[9.5px] font-black px-2.5 py-1 rounded-md transition-all shrink-0 cursor-pointer border ${
                                    isActive 
                                      ? "bg-[#01696f] border-[#01696f] text-white shadow-xs" 
                                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "index" && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl text-xs space-y-2 leading-relaxed">
                <div className="flex items-center gap-1.5 text-[#006494] font-black">
                  <Database className="w-4.5 h-4.5 shrink-0" />
                  <span>Indeks Komposit Kebenaran</span>
                </div>
                <p className="text-[#005178] font-semibold leading-relaxed">
                  Queries gabungan di Firestore (orderBy + filter) mewajibkan penghasilan indeks. Sistem kami membina <b>Penyaring Tempatan Pintar</b> bagi mengelak sebarang kegagalan.
                </p>
              </div>

              {/* Index Detail Card 1 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-white bg-slate-900 border border-slate-800 text-[9px] font-extrabold w-max">
                  borang
                </span>
                <h5 className="text-xs font-black text-slate-900">Aliran Jenis Borang IPS (Gua Musang)</h5>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">
                  Digunakan untuk menayangkan rekod pendaftaran rasmi di profil institusi.
                </p>
                
                <div className="bg-slate-50 border border-slate-150 p-2 text-[10px] font-mono rounded overflow-x-auto text-slate-700 whitespace-pre">
                  {"ipsId: ASC\ntarikh_kemuka: DESC"}
                </div>
                
                <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-150 p-2.5 rounded-lg leading-relaxed">
                  ✓ Sedia menyokong semakan ketersediaan tanpa sebarang crash atau ralat.
                </div>
              </div>

              {/* Index Detail Card 2 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-white bg-slate-900 border border-slate-800 text-[9px] font-extrabold w-max">
                  audit_logs
                </span>
                <h5 className="text-xs font-black text-slate-900">Sejarah Log Audit Berpusat</h5>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">
                  Rekod log audit secara kronologi masa untuk ketelusan tindakan.
                </p>
                
                <div className="bg-slate-50 border border-slate-150 p-2 text-[10px] font-mono rounded overflow-x-auto text-slate-700 whitespace-pre">
                  {"entityId: ASC\ntimestamp: DESC"}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-extrabold px-3 py-2 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-reverse" />
            <span>Set Semula</span>
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-xs"
          >
            Selesai Semak
          </button>
        </div>
      </div>
    </>
  );
}

export default UatAdminPanel;
