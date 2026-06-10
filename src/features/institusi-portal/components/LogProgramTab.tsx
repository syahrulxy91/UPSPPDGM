import React from "react";
import { Activity, CheckCircle, Clock, CalendarCheck, FileDown, Calendar, Users } from "lucide-react";
import { motion } from "motion/react";
import { ProgramRecord } from "../services/portalService";

interface LogProgramTabProps {
  filteredProgram: ProgramRecord[];
  programList: ProgramRecord[];
  filterProgramStatus: string;
  setFilterProgramStatus: (val: string) => void;
  filterProgramMonth: string;
  setFilterProgramMonth: (val: string) => void;
  onAddProgramClick: () => void;
  onExportPdf: () => void;
}

export function LogProgramTab({
  filteredProgram,
  programList,
  filterProgramStatus,
  setFilterProgramStatus,
  filterProgramMonth,
  setFilterProgramMonth,
  onAddProgramClick,
  onExportPdf
}: LogProgramTabProps) {
  
  // Stats helper
  const totalCount = programList.length;
  const completedCount = programList.filter(p => p.status === "Selesai").length;
  const plannedCount = programList.filter(p => p.status === "Dirancang").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
      id="view-program"
    >
      {/* 1. Program statistics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="program-statistics">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Jumlah Program</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">{totalCount} <span className="text-xs font-bold text-slate-400">Penyertaan</span></span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-xs">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Program Selesai</span>
            <span className="text-2xl font-black text-emerald-600 tracking-tight">{completedCount} <span className="text-xs font-bold text-slate-400">Selesai</span></span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-xs">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Akan Datang / Dirancang</span>
            <span className="text-2xl font-black text-blue-600 tracking-tight">{plannedCount} <span className="text-xs font-bold text-slate-400">Rancangan</span></span>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-[#006494] rounded-xl flex items-center justify-center border border-sky-100 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Filters ribbon */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] bg-sky-50 text-sky-800 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-1.5 inline-block border border-sky-100">
              Modul 2D
            </span>
            <h2 className="text-base font-black text-slate-900 tracking-tight leading-none">
              Aktiviti, Bengkel & Laporan Luaran Institusi
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Rekod penglibatan dan pendedahan luar bilik darjah yang telah/akan dilaksanakan.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onExportPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all uppercase tracking-wider shadow-sm border border-emerald-500/30"
              id="btn-export-program-pdf"
            >
              <FileDown className="w-4 h-4" />
              <span>Eksport PDF</span>
            </button>
            <button
              onClick={onAddProgramClick}
              className="bg-[#006494] hover:bg-[#004f76] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all uppercase tracking-wider shadow-sm"
              id="btn-add-program"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Log Program Baru</span>
            </button>
          </div>
        </div>

        {/* Filters dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterProgramStatus}
            onChange={(e) => setFilterProgramStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 font-bold cursor-pointer transition-all focus:border-[#006494] focus:bg-white focus:outline-none"
          >
            <option value="">Semua Status Program</option>
            <option value="Dirancang">Dirancang</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>

          <select
            value={filterProgramMonth}
            onChange={(e) => setFilterProgramMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 font-bold cursor-pointer transition-all focus:border-[#006494] focus:bg-white focus:outline-none"
          >
            <option value="">Semua Bulan Bilangan</option>
            <option value="01">Januari</option>
            <option value="02">Februari</option>
            <option value="03">Mac</option>
            <option value="04">April</option>
            <option value="05">Mei</option>
            <option value="06">Jun</option>
            <option value="07">Julai</option>
            <option value="08">Ogos</option>
            <option value="09">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Disember</option>
          </select>
        </div>
      </div>

      {/* 3. Cards display group */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="list-program">
        {filteredProgram.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 italic">
            Tiada rekod program dikesan mengikut tapis pilihan anda.
          </div>
        ) : (
          filteredProgram.map((p) => {
            const dateParts = p.tarikh?.split("-");
            let displayDate = p.tarikh || "-";
            let displayMonth = "DEC";
            let displayDay = "01";
            
            if (dateParts && dateParts.length === 3) {
              const monthNames = [
                "Januari", "Februari", "Mac", "April", "Mei", "Jun",
                "Julai", "Ogos", "September", "Oktober", "November", "Disember"
              ];
              const monthAbbrs = [
                "JAN", "FEB", "MAC", "APR", "MEI", "JUN",
                "JUL", "OGO", "SEP", "OKT", "NOV", "DIS"
              ];
              const mIdx = parseInt(dateParts[1], 10) - 1;
              displayDate = `${dateParts[2]} ${monthNames[mIdx]} ${dateParts[0]}`;
              displayMonth = monthAbbrs[mIdx];
              displayDay = dateParts[2];
            }

            return (
              <motion.div
                whileHover={{ y: -3 }}
                key={p.id}
                className="bg-white border border-slate-100 rounded-2xl flex flex-col justify-between p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    {/* Compact Calendar Badge */}
                    <div className="flex flex-col items-center border border-slate-150 rounded-xl overflow-hidden bg-white w-12 text-center shadow-xs shrink-0">
                      <span className="bg-[#006494] text-[9px] font-black text-white px-1 py-0.5 w-full uppercase block leading-none">
                        {displayMonth}
                      </span>
                      <span className="text-sm font-black text-slate-800 py-1 font-mono">
                        {displayDay}
                      </span>
                    </div>

                    <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase border leading-none shrink-0 ${
                      p.status === "Selesai"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : p.status === "Dirancang"
                        ? "bg-blue-50 text-blue-700 border-blue-105"
                        : "bg-slate-50 text-slate-600 border-slate-150"
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-slate-900 leading-snug tracking-tight">
                      {p.nama}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                      {p.penerangan || "Tiada penerangan tambahan disenaraikan bagi program ini."}
                    </p>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-slate-50 mt-4 flex justify-between items-center bg-slate-50 rounded-xl px-3.5 py-2.5 text-[10px] font-extrabold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sasaran Peserta:</span>
                  </span>
                  <span className="text-slate-800 font-extrabold">{p.bilPeserta || 0} Orang</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
