import React, { useState } from "react";
import { 
  Activity, 
  Database, 
  Cpu, 
  ShieldAlert, 
  RefreshCw, 
  SlidersHorizontal,
  Info,
  Layers,
  Settings,
  Lock,
  Globe,
  BellRing
} from "lucide-react";
import { useRole } from "../../../shared/contexts/RoleContext";
import { StatusBadge } from "../../../shared/components/ui/StatusBadge";
import { StatusIntegrasiPanel } from "../components/StatusIntegrasiPanel";

export function TetapanPage() {
  const { role, userEmail } = useRole();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"success" | "idle">("idle");

  // Guardian: Ensure "Tetapan" is only accessible to superadmin or pegawai_ppd
  const isAuthorized = role === "superadmin" || role === "pegawai_ppd";

  const handleManualSync = () => {
    setIsSyncing(true);
    setSyncStatus("idle");
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }, 1500);
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6" id="unauthorized-settings-container">
        <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-3xl mx-auto flex items-center justify-center text-rose-500 animate-bounce">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AKSES DISEKAT / TIADA KEBENARAN</h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-md mx-auto">
            Halaman Tetapan Sistem SPS PPD Gua Musang dihadkan secara eksklusif untuk peranan 
            <span className="text-slate-900 font-extrabold"> Pegawai PPD</span> atau 
            <span className="text-slate-900 font-extrabold"> Super Admin</span> sahaja.
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-black text-slate-600 font-mono">
            ID AKTIF: {userEmail} ({role.toUpperCase()})
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1 md:p-2 max-w-[1600px] text-left mx-auto" id="settings-page-root">
      
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-3xs" id="settings-heading-panel">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-[#01696f]/10 text-[#005a60] text-[10px] font-black uppercase tracking-wider border border-[#01696f]/15">
              Enterprise Configuration
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-[#e4a834]/15 text-[#aa7a10] text-[9.5px] font-bold tracking-tight">
              PPD Gua Musang
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-[#01696f]" />
            <span>Tetapan Sistem</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            Urus konfigurasi sistem, ketersambungan penyegerakan pangkalan data Firestore Cloud, kebenaran akses kakitangan, dan kawalan integrasi Unit Swasta.
          </p>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs md:text-sm font-black text-white bg-[#01696f] hover:bg-[#005a60] disabled:bg-slate-200 disabled:text-slate-450 border border-transparent hover:border-[#01696f]/10 rounded-2xl cursor-pointer shadow-sm active:scale-98 transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Menyegera Data..." : "Segerakan Pangkalan Data"}</span>
        </button>
      </div>

      {/* Sync success toast notification within page */}
      {syncStatus === "success" && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-fade-in">
          <Activity className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wide">
            Penyegerakan manual berjaya diselesaikan dengan Firestore Cloud! Semua data adalah terkini.
          </span>
        </div>
      )}

      {/* 2. MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* STATUS INTEGRASI & JALUR (MIGRATED CARD) FROM DASHBOARD */}
        <StatusIntegrasiPanel />

        {/* COMPONENT 2: PERINGATAN & NOTIFIKASI */}
        <div className="bg-white rounded-3xl border border-slate-200/85 p-6 sm:p-8 space-y-6 flex flex-col shadow-3xs" id="tetapan-notifikasi">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-[#01696f]/10 text-[#01696f] rounded-xl">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-extrabold text-slate-900 text-sm">Pemberitahuan Sistem</h3>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                Parameter Hebahan & Tindakan Segera
              </p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl">
              <div className="space-y-1">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">AMARAN LEWAT LUPUT</span>
                <p className="text-xs font-extrabold text-slate-800">Kekerapan Peringatan Pematuhan</p>
                <p className="text-[11px] text-slate-500 font-medium">Bujikan amaran selewat 14 hari sebelum tamat tempoh.</p>
              </div>
              <StatusBadge label="14 HARI" tone="warning" />
            </div>

            <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl">
              <div className="space-y-1">
                <span className="text-[9.5px] font-black text-[#01696f] uppercase tracking-widest block">AUDIT SECURITY</span>
                <p className="text-xs font-extrabold text-slate-800">Perimeter Sesi Pentadbiran</p>
                <p className="text-[11px] text-slate-500 font-medium">Tamatkan sesi terbiar selepas 30 minit secara automatik.</p>
              </div>
              <StatusBadge label="30 MIN" tone="success" />
            </div>

            <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl">
              <div className="space-y-1">
                <span className="text-[9.5px] font-black text-rose-500 tracking-widest block uppercase">FIREWALL PERMISSION</span>
                <p className="text-xs font-extrabold text-slate-800 font-sans">Kebenaran API & Luaran</p>
                <p className="text-[11px] text-slate-500 font-medium">Semua interaksi dihadkan kepada rujukan PPD sahaja.</p>
              </div>
              <StatusBadge label="TERHAD" tone="danger" />
            </div>
          </div>

          <div className="p-3 bg-[#01696f]/5 border border-[#01696f]/10 rounded-xl flex items-start gap-2.5">
            <Info className="w-4.5 h-4.5 text-[#01696f] shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-slate-600 font-semibold leading-relaxed">
              Sebarang perubahan parameter di atas diuruskan secara terus oleh jurutera infrastruktur KPM pusat mengikut manual dasar keselamatan siber sekolah swasta.
            </p>
          </div>
        </div>

        {/* COMPONENT 3: MAKLUMAT PELAYAN & SISTEM */}
        <div className="bg-white rounded-3xl border border-slate-200/85 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-3xs" id="tetapan-peranti-server">
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-purple-500/10 text-purple-700 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-slate-900 text-sm">Informasi Pelayan & Teras</h3>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                  Platform Cloud Run Spesifikasi
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-extrabold uppercase text-[9.5px] tracking-wide">Penyedia Pengkomputeran</span>
                </div>
                <span className="font-black text-slate-800">Google Cloud Platform</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-extrabold uppercase text-[9.5px] tracking-wide">Pelayan Server</span>
                </div>
                <span className="font-black text-slate-800">Cloud Run (Serverless)</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-extrabold uppercase text-[9.5px] tracking-wide">Wilayah Server (Zone)</span>
                </div>
                <span className="font-mono text-xs font-black text-slate-800">asia-southeast1 (SGP)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-extrabold uppercase text-[9.5px] tracking-wide">Enkripsi Penyimpanan</span>
                </div>
                <span className="text-[9.5px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">GCM-256 AES</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-slate-450 shrink-0" />
            <div className="text-left leading-snug">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Ketersediaan Enjin</span>
              <p className="text-[11px] text-slate-650 font-semibold">Teras v1.5 • Produksi Stabil (UAT Berkelulusan)</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default TetapanPage;
