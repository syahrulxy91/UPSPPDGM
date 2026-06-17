import React from "react";
import { GraduationCap, Search, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { GuruRecord } from "../services/portalService";

interface GuruStaffTabProps {
  filteredGuru: GuruRecord[];
  filterGuruJawatan: string;
  setFilterGuruJawatan: (val: string) => void;
  filterGuruStatus: string;
  setFilterGuruStatus: (val: string) => void;
  onAddGuruClick: () => void;
  maskIC: (ic: string) => string;
}

export function GuruStaffTab({
  filteredGuru,
  filterGuruJawatan,
  setFilterGuruJawatan,
  filterGuruStatus,
  setFilterGuruStatus,
  onAddGuruClick,
  maskIC
}: GuruStaffTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
      id="view-guru"
    >
      {/* 1. Header ribbon controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight leading-none">
              Daftar Roster Guru & Kakitangan Akademik
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Mengurus rekod tenaga pengajar, kelayakan subjek diajar, serta jawatan semasa tadika.
            </p>
          </div>
          <button
            onClick={onAddGuruClick}
            className="bg-[#006494] hover:bg-[#004f76] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs uppercase tracking-wider shrink-0"
            id="btn-add-guru"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Tambah Guru</span>
          </button>
        </div>

        {/* 2. Filter input layout */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tapis mengikut nama jawatan (cth: Guru Besar)..."
              value={filterGuruJawatan}
              onChange={(e) => setFilterGuruJawatan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 font-bold transition-all focus:border-[#006494] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={filterGuruStatus}
            onChange={(e) => setFilterGuruStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 font-bold cursor-pointer transition-all focus:border-[#006494] focus:bg-white focus:outline-none"
          >
            <option value="">Semua Status Guru</option>
            <option value="Aktif">Aktif</option>
            <option value="Cuti">Cuti</option>
            <option value="Keluar">Keluar</option>
          </select>
        </div>
      </div>

      {/* 3. Guru table grid view */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 uppercase text-[10px] font-black text-slate-500 tracking-widest">
                <th className="p-4">NAMA GURU</th>
                <th className="p-4">JAWATAN</th>
                <th className="p-4">NO PERMIT</th>
                <th className="p-4">SUBJEK DI AJAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuru.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center bg-white">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-2">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tiada Rekod Guru</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Sama ada carian tidak menemui padanan, atau anda belum mendafarkan sebarang guru/kakitangan peringkat ini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGuru.map((g, idx) => {
                  const initialName = g.nama ? g.nama.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("") : "G";
                  const isEven = idx % 2 === 0;
                  const rowBgClass = isEven ? "bg-white" : "bg-slate-50/30";
                  return (
                    <React.Fragment key={g.id}>
                      {/* Row 1 */}
                      <tr className={`${rowBgClass} transition-colors`}>
                        <td className="p-4 pb-1.5 font-black text-slate-900 border-t border-slate-100/60">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#006494] flex items-center justify-center font-extrabold text-xs uppercase border border-sky-150 shadow-xs shrink-0">
                              {initialName.substring(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{g.nama}</span>
                              <span className={`inline-flex items-center gap-1 w-max mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border leading-none ${
                                g.status === "Aktif"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : g.status === "Cuti"
                                  ? "bg-amber-50 text-amber-700 border-amber-100"
                                  : "bg-rose-50 text-rose-700 border-rose-105"
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${g.status === "Aktif" ? "bg-emerald-500 animate-pulse" : g.status === "Cuti" ? "bg-amber-500" : "bg-rose-500"}`} />
                                <span>{g.status}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 pb-1.5 font-black text-slate-800 uppercase tracking-tight border-t border-slate-100/60">{g.jawatan}</td>
                        <td className="p-4 pb-1.5 font-extrabold text-[#006494] font-mono tracking-wider border-t border-slate-100/60 uppercase">{g.noPermit || "TIADA REKOD PERMIT"}</td>
                        <td className="p-4 pb-1.5 font-bold text-slate-700 border-t border-slate-100/60">{g.subjek || "Pembimbing Umum"}</td>
                      </tr>
                      {/* Row 2 */}
                      <tr className={`${rowBgClass} transition-colors border-b border-slate-200/50`}>
                        <td className="px-4 pb-4 pt-1 font-semibold text-slate-500 font-mono tracking-wider">
                          {maskIC(g.icNumber)}
                        </td>
                        <td className="px-4 pb-4 pt-1 font-medium text-slate-500">
                          {g.jantina || "Tidak Dinyatakan"}
                        </td>
                        <td className="px-4 pb-4 pt-1 font-medium text-slate-500 font-mono">
                          {g.tarikhMulaPermit && g.tarikhTamatPermit ? `${g.tarikhMulaPermit} – ${g.tarikhTamatPermit}` : "TIADA TEMPOH AKTIF"}
                        </td>
                        <td className="px-4 pb-4 pt-1 font-medium text-slate-500 uppercase">
                          {g.tahapPendidikanSemasa || "TIADA MAKLUMAT"}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
