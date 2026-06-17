import React from "react";
import { Users, Plus, UserPlus, Search, X, Check, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { KelasRecord, MuridRecord } from "../services/portalService";

interface KelasMuridTabProps {
  kelasList: KelasRecord[];
  filteredMurid: MuridRecord[];
  statsMurid: { lelaki: number; perempuan: number; jumlah: number };
  filterKelas: string;
  setFilterKelas: (val: string) => void;
  searchMurid: string;
  setSearchMurid: (val: string) => void;
  onAddKelasClick: () => void;
  onAddMuridClick: () => void;
}

export function KelasMuridTab({
  kelasList,
  filteredMurid,
  statsMurid,
  filterKelas,
  setFilterKelas,
  searchMurid,
  setSearchMurid,
  onAddKelasClick,
  onAddMuridClick
}: KelasMuridTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
      id="view-kelas"
    >
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="stat-murid-total-container">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center text-center space-y-3" id="stat-murid-total">
          <div className="w-10 h-10 bg-sky-50 text-[#006494] rounded-full flex items-center justify-center border border-sky-100 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Jumlah Murid Terdaftar</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {statsMurid.jumlah} <span className="text-xs font-bold text-slate-400">Orang</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center text-center space-y-3" id="stat-murid-lelaki">
          <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center text-xs font-black border border-blue-100 shadow-xs">L</div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Murid Lelaki</span>
            <span className="text-2xl font-black text-[#006494] tracking-tight block">
              {statsMurid.lelaki} <span className="text-xs font-bold text-slate-400">Orang</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center text-center space-y-3" id="stat-murid-perempuan">
          <div className="w-10 h-10 bg-pink-50 text-pink-700 rounded-full flex items-center justify-center text-xs font-black border border-pink-100 shadow-xs">P</div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Murid Perempuan</span>
            <span className="text-2xl font-black text-pink-600 tracking-tight block">
              {statsMurid.perempuan} <span className="text-xs font-bold text-slate-400">Orang</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Interactive Classes list */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase">Gred & Kelas</h3>
              <span className="text-[11px] text-slate-400">Klik kad untuk menapis</span>
            </div>
            <button
              onClick={onAddKelasClick}
              className="p-2 bg-sky-55/60 text-[#006494] hover:bg-sky-100 border border-sky-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-150"
              id="btn-add-kelas"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Daftar Kelas</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {kelasList.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl space-y-3">
                <div className="w-10 h-10 bg-sky-50 text-[#006494] rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Tiada Kelas Berdaftar</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                  Sila daftar kelas akademik baru sebelum memulakan kemasukan murid.
                </p>
                <button
                  onClick={onAddKelasClick}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-[#006494] text-[#006494] text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Daftar Kelas Pertama</span>
                </button>
              </div>
            ) : (
              kelasList.map((k) => {
                const limit = k.kapasitiMaksimum || 30;
                const count = k.bilanganMurid || 0;
                const pct = Math.min((count / limit) * 100, 100);
                const isSelected = filterKelas === k.id;

                return (
                  <motion.div
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    key={k.id}
                    onClick={() => setFilterKelas(isSelected ? "" : (k.id || ""))}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-50 border-[#006494] ring-1 ring-[#006494]"
                        : "bg-slate-50/50 hover:bg-slate-50 border-slate-200/60 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-snug flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#006494]" />}
                          <span>{k.namaKelas}</span>
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.tahap}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-800">{count}/{limit}</span>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase leading-none">Murid</span>
                      </div>
                    </div>

                    {/* Class Capacity Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-[#006494]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] uppercase tracking-wider text-slate-400 font-extrabold leading-none">
                        <span>Penuh {Math.round(pct)}%</span>
                        {pct >= 90 && <span className="text-rose-500">Kapasiti Penuh</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Interactive student list */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase">Pangkalan Kemasukan Murid</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Penapis mengikut kelas aktif di sebelah kiri diintegrasikan</p>
            </div>
            
            <button
              onClick={onAddMuridClick}
              className="bg-[#006494] hover:bg-[#004f76] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs uppercase tracking-wider"
              id="btn-add-murid"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Murid</span>
            </button>
          </div>

          {/* Search bar controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama penuh murid..."
                value={searchMurid}
                onChange={(e) => setSearchMurid(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 font-bold transition-all focus:border-[#006494] focus:bg-white focus:outline-none"
              />
            </div>
            
            {filterKelas && (
              <button
                onClick={() => setFilterKelas("")}
                className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Padam Tapis Kelas</span>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Student Table spreadsheet style */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-black text-slate-400 tracking-wider">
                  <th className="p-4">Nama Murid</th>
                  <th className="p-4">Kelas Akademik</th>
                  <th className="p-4">Jantina</th>
                  <th className="p-4 text-center">Umur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMurid.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center bg-white">
                      <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-2">
                          <Search className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tiada Rekod Murid</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Sama ada carian tidak menemui padanan, atau anda belum memulakan pendaftaran murid.
                        </p>
                        <button
                          onClick={onAddMuridClick}
                          className="mt-4 bg-[#006494] hover:bg-[#004f76] text-white text-xs font-bold py-2.5 px-5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs uppercase tracking-wider"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Daftar Murid Sekarang</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMurid.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-black text-slate-900">{m.nama}</td>
                      <td className="p-4 font-bold text-[#006494]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          <span>{m.kelasNama || "Am / Tanpa Kelas"}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase text-center border mr-2 ${
                          m.jantina === "Lelaki" 
                            ? "bg-blue-50 text-blue-700 border-blue-100" 
                            : "bg-pink-50 text-pink-700 border-pink-100"
                        }`}>
                          {m.jantina}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-800">{m.umur} <span className="text-[10px] text-slate-400 font-bold">Tahun</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
