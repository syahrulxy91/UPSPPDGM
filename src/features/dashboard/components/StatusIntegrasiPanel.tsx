import React from "react";
import { Activity, Database, Globe, Lock } from "lucide-react";

export function StatusIntegrasiPanel() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/85 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-3xs" id="tetapan-status-sistem">
      <div className="space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-700 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-extrabold text-slate-900 text-sm">Status Integrasi & Jalur</h3>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
              Ketersambungan Firestore Cloud
            </p>
          </div>
        </div>

        <div className="bg-emerald-50/60 text-emerald-950 border border-emerald-100/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Firestore Sync</span>
          </div>
          <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2.5 py-1 rounded-md">
            BERFUNGSI
          </span>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wide">Pangkalan Data</span>
            <span className="font-mono font-black text-slate-800 text-right truncate max-w-[170px]">ai-studio-1f09e2...</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wide">Kadar Kemas Kini</span>
            <span className="font-black text-slate-800">Masa Nyata (Live)</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wide">Kebenaran Sesi</span>
            <span className="font-bold text-slate-700 text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">BACA & TULIS</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wide">Zon Daerah</span>
            <span className="font-black text-[#01696f]">Gua Musang, Kelantan</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl mt-4 text-left">
        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
          Pegawai PPDGM memegang akses penuh untuk mendaftar masuk dan menyegerakan permohonan IPS. Sebarang pertikaian atau ralat, rujuk manual tatacara integrasi sistem.
        </p>
      </div>
    </div>
  );
}

export default StatusIntegrasiPanel;
