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
            <span className="text-[10px] bg-sky-50 text-sky-800 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-1.5 inline-block border border-sky-100">
              Modul 2C
            </span>
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
              <tr className="bg-slate-50/80 border-b border-slate-200 uppercase text-[10px] font-black text-slate-400 tracking-wider">
                <th className="p-4">Nama Guru</th>
                <th className="p-4">No. Kad Pengenalan</th>
                <th className="p-4">Jawatan Teraju</th>
                <th className="p-4">Subjek Kompetensi</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuru.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 italic bg-white font-medium">
                    Tiada rekod guru ditemui mengikut tapisan.
                  </td>
                </tr>
              ) : (
                filteredGuru.map((g) => {
                  const initialName = g.nama ? g.nama.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("") : "G";
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-black text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#006494] flex items-center justify-center font-extrabold text-xs uppercase border border-sky-150 shadow-xs">
                            {initialName.substring(0, 2)}
                          </div>
                          <span className="font-bold text-slate-900">{g.nama}</span>
                        </div>
                      </td>
                      <td className="p-4 font-extrabold text-slate-500 font-mono tracking-wider">{maskIC(g.icNumber)}</td>
                      <td className="p-4 font-black text-slate-800 uppercase tracking-tight">{g.jawatan}</td>
                      <td className="p-4 font-bold text-slate-600">{g.subjek || "Pembimbing Umum"}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border leading-none ${
                          g.status === "Aktif"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : g.status === "Cuti"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-rose-50 text-rose-700 border-rose-105"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${g.status === "Aktif" ? "bg-emerald-500 animate-pulse" : g.status === "Cuti" ? "bg-amber-500" : "bg-rose-500"}`} />
                          <span>{g.status}</span>
                        </span>
                      </td>
                    </tr>
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
