import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardOverview } from "../services/dashboardService";
import { getInstitusiList } from "../../institusi/services/institusiService";
import { getBorangList } from "../../borang/services/borangService";
import { DashboardOverview } from "../../../types/dashboard";
import { InstitusiRecord } from "../../../types/institusi";
import { BorangRecord } from "../../../types/borang";
import { generateReminderList, ReminderItem, getBackendReminders } from "../../laporan/services/reportService";
import { ReminderPanel } from "../../../shared/components/ui/ReminderPanel";
import { InstitusiDetailModal } from "../../institusi/components/InstitusiDetailModal";
import { StatusBadge } from "../../../shared/components/ui/StatusBadge";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { LoadingSkeleton } from "../../../shared/components/ui/LoadingSkeleton";
import { 
  ShieldCheck, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Building2, 
  FileText, 
  TrendingUp, 
  Clock, 
  Layers,
  ArrowUpRight,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";

export function DashboardUtamaPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [institusiPool, setInstitusiPool] = useState<InstitusiRecord[]>([]);
  const [borangPool, setBorangPool] = useState<BorangRecord[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Drilldown states
  const [selectedInst, setSelectedInst] = useState<InstitusiRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  async function fetchOverview() {
    setLoading(true);
    setError(null);
    try {
      const [overview, insts, borangs, backendRems] = await Promise.all([
        getDashboardOverview(),
        getInstitusiList().catch(() => []),
        getBorangList().catch(() => []),
        getBackendReminders().catch(() => [] as ReminderItem[]),
      ]);
      setData(overview);
      setInstitusiPool(insts || []);
      setBorangPool(borangs || []);

      if (backendRems && backendRems.length > 0) {
        setReminders(backendRems);
      } else {
        const fallback = generateReminderList(insts || [], borangs || []);
        setReminders(fallback);
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuatkan data dari pangkalan data Firestore.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-6 max-w-7xl mx-auto" id="dashboard-loading">
        <div className="h-20 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-2">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-white rounded-2xl border border-slate-200/80 p-5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LoadingSkeleton rows={5} />
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-48 bg-white border border-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 p-6 max-w-4xl mx-auto text-center" id="dashboard-error">
        <div className="inline-flex items-center justify-center p-4 bg-rose-50 border border-rose-100 rounded-full text-rose-600 mb-2">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Ralat Sambungan Firestore</h2>
        <p className="text-slate-550 text-sm max-w-md mx-auto leading-relaxed">
          Sistem gagal mengambil data rujukan berpusat dari pangkalan data. Sila sahkan sambungan internet atau keizinan akaun anda.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => fetchOverview()}
            className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black bg-[#01696f] hover:bg-[#0c4e54] text-white rounded-xl transition-all cursor-pointer shadow-md shadow-[#01696f]/10 uppercase tracking-wider"
          >
            <RefreshCw className="w-4 h-4" />
            Cuba Semula
          </button>
        </div>
      </div>
    );
  }

  const overview = data || {
    jumlahInstitusiAktif: 0,
    kesAktif: 0,
    tindakanSegera: 0,
    dokumenHampirLuput: 0,
    selesaiBulanIni: 0,
    alertItems: [],
    aktivitiTerkini: [],
    kesOverdue: [],
  };

  const handleOpenInstitusi = (instId: string) => {
    const found = institusiPool.find(i => i.id === instId);
    if (found) {
      setSelectedInst(found);
      setIsModalOpen(true);
    }
  };

  const handleOpenBorangDetails = (namaInstitusi: string) => {
    navigate(`/borang?search=${encodeURIComponent(namaInstitusi)}`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-20" id="dashboard-success-view">
      
      {/* 1. BRAND & CONTEXT META ROW */}
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/60 pb-3" id="dashboard-meta-row">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#01696f] animate-pulse" />
          <span>Kementerian Pendidikan Malaysia • Sektor Swasta</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-500 font-mono">
          <span>SERVER: CLOUD_RUN</span>
          <span>● OPERASI AKTIF</span>
        </div>
      </div>

      {/* 2. EXECUTIVE HERO HEADER */}
      <div className="bg-gradient-to-br from-[#051719] via-[#051c1e] to-[#012527] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-white/5" id="executive-hero">
        {/* Subtle, modern line pattern background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#01696f]/30 text-[#4bf3fc] border border-[#01696f]/40">
              <Layers className="w-3 h-3" /> COMMAND CENTER RASMI
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Dashboard Utama Unit Swasta
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              Hab pemantauan bersepadu, status pematuhan dokumen pendaftaran, dan audit tindakan tatatertib bagi Institusi Pendidikan Swasta di bawah pentadbiran PPD Gua Musang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-center">
            <button
              onClick={() => navigate("/institusi")}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-black bg-[#01696f] hover:bg-[#0c4e54] text-white rounded-xl transition-all shadow-md shadow-[#01696f]/10 cursor-pointer active:scale-[0.98] uppercase tracking-wider"
            >
              <span>Semak Institusi</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#bcfffc]" />
            </button>

            <button
              onClick={() => fetchOverview()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-black bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl transition-all cursor-pointer active:scale-[0.98] uppercase tracking-wider"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. PREMIUM KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5" id="kpi-grid">
        
        {/* KPI 1: Institusi Aktif */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between min-h-[142px]" id="kpi-institusi">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Institusi Berdaftar
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#01696f]/10 text-[#01696f] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
              {overview.jumlahInstitusiAktif}
            </p>
            <p className="text-[11px] font-bold text-slate-500 mt-2 leading-tight">
              Sedia beroperasi di zon
            </p>
          </div>
        </div>

        {/* KPI 2: Kes Aktif */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between min-h-[142px]" id="kpi-kes">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Kes Aktif
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
              {overview.kesAktif}
            </p>
            <p className="text-[11px] font-bold text-slate-500 mt-2 leading-tight">
              Aduan & semakan tindakan baru
            </p>
          </div>
        </div>

        {/* KPI 3: Tindakan Segera */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between min-h-[142px]" id="kpi-tindakan">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[10px] font-black uppercase text-[#01696f] tracking-wider">
              Tindakan Segera
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-rose-600 leading-none">
              {overview.tindakanSegera}
            </p>
            <p className="text-[11px] font-bold text-rose-700/80 mt-2 leading-tight">
              Dokumen gagal mematuhi dikesan
            </p>
          </div>
        </div>

        {/* KPI 4: Hampir Luput */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between min-h-[142px]" id="kpi-luput">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Hampir Luput
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
              {overview.dokumenHampirLuput}
            </p>
            <p className="text-[11px] font-bold text-slate-500 mt-2 leading-tight">
              Lesen/permit tamat tempoh n/q
            </p>
          </div>
        </div>

        {/* KPI 5: Selesai Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between min-h-[142px]" id="kpi-selesai">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Selesai Bulan Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
              {overview.selesaiBulanIni}
            </p>
            <p className="text-[11px] font-bold text-[#01696f] mt-2 leading-tight">
              Melebihi sasaran KPI bulanan
            </p>
          </div>
        </div>

      </div>

      {/* 4. DYNAMIC INTERACTIVE REMINDER LIST PANEL */}
      <div className="border border-slate-250/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <ReminderPanel 
          reminders={reminders}
          onOpenInstitusi={handleOpenInstitusi}
          onOpenBorangDetails={handleOpenBorangDetails}
        />
      </div>

      {/* 5. OPERATIONAL OVERVIEW & SYSTEM STANDARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-bento-ops">
        
        {/* Ringkasan Operasi (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 flex flex-col justify-between" id="bento-ringkasan-operasi">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 bg-[#006494]/10 text-[#006494] rounded-lg">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Analisis Kedudukan & Kelulusan Berpasangan</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Data agregat masa-nyata Unit Pendidikan Swasta
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Sistem pendaftaran dan pelaporan melarikan sinkronisasi dua hala secara terus dengan rekod maklumat asas institusi pendidikan swasta (premis, status, guru besar, dan kutipan yuran tahunan) bagi menjamin tadbir urus berdaulat.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-[#01696f]/10 text-[#01696f] rounded-xl flex items-center justify-center font-black text-xl shadow-xs">
                  {overview.jumlahInstitusiAktif}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black text-slate-900 leading-tight">Institusi Aktif</span>
                  <span className="text-[11px] text-slate-450 font-bold mt-1 uppercase tracking-wider">Beroperasi Sah</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-550/15 text-amber-800 rounded-xl flex items-center justify-center font-black text-xl shadow-xs">
                  {overview.kesAktif}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black text-slate-900 leading-tight">Kes Semakan</span>
                  <span className="text-[11px] text-slate-450 font-bold mt-1 uppercase tracking-wider">Dalam Proses</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-550/15 text-emerald-800 rounded-xl flex items-center justify-center font-black text-xl shadow-xs">
                  {overview.selesaiBulanIni}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black text-slate-900 leading-tight">Selesai Audit</span>
                  <span className="text-[11px] text-slate-450 font-bold mt-1 uppercase tracking-wider">Bulan Semasa</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#01696f]/5 border border-[#01696f]/10 rounded-2xl p-4 flex gap-3 text-slate-700 leading-relaxed font-medium">
            <ShieldCheck className="w-5 h-5 shrink-0 text-[#01696f] mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Piawaian Kawalan Mutu KPM</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed font-semibold">
                Setiap tadika swasta, sekolah rendah & menengah swasta, serta pusat tuisyen dilindungi di bawah Akta Pendidikan 1996 [Akta 550]. Pematuhan kelulusan bomba, kebersihan premis, dan kelayakan pendidik disemak teliti oleh pegawai berwajib secara bulanan.
              </p>
            </div>
          </div>
        </div>

        {/* Status Sistem & Penyegerakan (1/3) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 flex flex-col justify-between" id="bento-status-sistem">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-lg">
                <Activity className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Status Integrasi & Jalur</h3>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                  Ketersambungan Firestore Cloud
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/60 text-emerald-900 border border-emerald-100/80 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black uppercase text-emerald-800">Firestore Sync</span>
              </div>
              <span className="text-[10px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-md">
                BERFUNGSI
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Pangkalan Data</span>
                <span className="font-extrabold text-slate-800 text-right font-mono truncate max-w-[150px]">ai-studio-1f09e2...</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Kadar Kemas Kini</span>
                <span className="font-extrabold text-slate-800">Masa Nyata (Live)</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Kebenaran Sesi</span>
                <span className="font-bold text-slate-700 text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">BACA & TULIS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Zon Daerah</span>
                <span className="font-extrabold text-[#01696f]">Gua Musang, Kelantan</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Pegawai PPDGM memegang akses penuh untuk mendaftar masuk dan menyegerakan permohonan IPS. Sebarang pertikaian atau ralat, rujuk manual tatacara integrasi sistem.
            </p>
          </div>
        </div>

      </div>

      {/* 6. TRI-STREAM SYSTEM STREAM PANEL (Tindakan Segera, Aktiviti Terkini, Kes Overdue) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-operational-streams">
        
        {/* Stream 1: Amaran Kritikal */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4" id="stream-alert">
          <div className="flex items-center justify-between border-b border-slate-150/60 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Amaran Kritikal Pentadbiran
              </h3>
            </div>
            <span className="text-[10px] font-mono font-black text-slate-400">
              {overview.alertItems.length} PERINGATAN
            </span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {overview.alertItems.length === 0 ? (
              <EmptyState 
                title="Tiada Peringatan Kritikal" 
                description="Semua ketetapan pematuhan institusi swasta didapati teratur dan tiada tindakan segera diperlukan." 
              />
            ) : (
              overview.alertItems.map((item) => (
                <div key={item.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-2 hover:bg-red-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-black text-slate-950 leading-tight">
                      {item.nama}
                    </p>
                    <StatusBadge 
                      label={item.tahap === "danger" ? "KRITIKAL" : "AMARAN"} 
                      tone={item.tahap === "danger" ? "danger" : "warning"} 
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal font-medium">
                    {item.keterangan}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stream 2: Aktiviti Terkini */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4" id="stream-activity">
          <div className="flex items-center justify-between border-b border-slate-150/60 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#01696f]" />
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Log Tindakan & Aktiviti Semasa
              </h3>
            </div>
            <span className="text-[10px] font-mono font-black text-[#01696f]">KRONOLOGI</span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {overview.aktivitiTerkini.length === 0 ? (
              <EmptyState 
                title="Tiada Log Aktiviti" 
                description="Tiada rekod perubahan dikesan dalam pangkalan data pada masa ini." 
              />
            ) : (
              overview.aktivitiTerkini.map((act) => (
                <div key={act.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2 hover:bg-slate-100/50 transition-colors">
                  <p className="text-xs font-black text-slate-900 leading-normal">
                    {act.tajuk}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wide gap-2 border-t border-slate-150/30 pt-1.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="shrink-0 text-[#01696f] font-extrabold">Oleh:</span>
                      <span className="truncate max-w-[100px] text-slate-700">{act.pegawai}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{act.masa}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stream 3: Kes Overdue */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4" id="stream-overdue">
          <div className="flex items-center justify-between border-b border-slate-150/60 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Senarai Kes Rujukan Tertunggak
              </h3>
            </div>
            <span className="text-[10px] font-mono font-black text-rose-600">OVERDUE</span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {overview.kesOverdue.length === 0 ? (
              <EmptyState 
                title="Tiada Kes Overdue" 
                description="Syabas! Semua kes rujukan rintangan berjaya diclearkan sebelum amaran tamat." 
              />
            ) : (
              overview.kesOverdue.map((kes) => (
                <div key={kes.id} className="p-3.5 bg-rose-50/30 border border-rose-100 rounded-xl space-y-2 hover:bg-rose-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-black text-slate-950 leading-tight">
                      {kes.namaInstitusi}
                    </p>
                    <StatusBadge label="TERTUNGGAK" tone="danger" />
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 font-semibold leading-relaxed">
                    <p><span className="text-slate-400 font-extrabold uppercase text-[9px] mr-1">Rujukan Isu:</span> {kes.jenisKes}</p>
                    <p><span className="text-slate-400 font-extrabold uppercase text-[9px] mr-1">Pegawai:</span> {kes.pegawai}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 7. DRILL-DOWN PROFIL IPS MODAL */}
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

export default DashboardUtamaPage;
