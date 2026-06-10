import React from "react";
import { Building2, Edit3, Phone, Mail, MapPin, Clock, ShieldCheck, FileText, Landmark } from "lucide-react";
import { motion } from "motion/react";

interface ProfilInstitusiTabProps {
  institusi: any;
  onEditProfile: () => void;
}

export function ProfilInstitusiTab({ institusi, onEditProfile }: ProfilInstitusiTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
      id="view-profil"
    >
      {/* Page Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6">
        <div>
          <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">
            Modul 2A
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Profil Rasmi Institusi
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Mengurus identiti berdaftar, maklumat perhubungan, pentadbiran am, serta status akreditasi institusi pendidikan swasta.
          </p>
        </div>
        <button
          onClick={onEditProfile}
          className="flex items-center gap-2 bg-[#006494] hover:bg-[#004f76] text-white text-xs font-bold py-3 px-5 rounded-xl cursor-pointer transition-all duration-200 shadow-sm uppercase tracking-wider shrink-0"
          id="btn-edit-profile"
        >
          <Edit3 className="w-4 h-4" />
          <span>Kemaskini Profil</span>
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Certificate Section / Visual Identity Block */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#0c1b2a] to-[#014f76] text-white rounded-2xl p-6 flex flex-col justify-between border border-slate-900 relative overflow-hidden shadow-md min-h-[360px]">
          {/* Abstract background graphics (No raw SVG, clean Tailwind borders) */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#006494]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md inline-block">
                {institusi?.kategori || "tadika swasta"}
              </span>
              <div className="w-10 h-10 bg-white/5 border border-white/10 text-sky-400 rounded-lg flex items-center justify-center">
                <Landmark className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold leading-snug tracking-tight text-white line-clamp-3">
                {institusi?.namaInstitusi}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pentadbiran & Rekod Terpelihara</span>
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/10 text-xs">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none">Tarikh Daftar</span>
                <span className="font-semibold text-slate-100">{institusi?.tarikhDaftar || "-"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-200">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none">Kemas Kini Terakhir</span>
                <span className="font-semibold text-slate-100">{institusi?.tarikhKemaskiniLast || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 tracking-widest uppercase border-b border-slate-100 pb-2">
              Maklumat Akreditasi & Operasi
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Pendaftaran KPM</span>
                <p className="text-sm font-black text-slate-800 font-mono tracking-wide">
                  {institusi?.noRujukan || "Belum Berdaftar"}
                </p>
              </div>

              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Operasi</span>
                <div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full uppercase leading-none mt-1 ${
                    institusi?.statusOperasi === "aktif"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${institusi?.statusOperasi === "aktif" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    <span>{institusi?.statusOperasi || "aktif"}</span>
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pengelola / Pengurus</span>
                <p className="text-sm font-black text-slate-800">
                  {institusi?.pengelola || "-"}
                </p>
              </div>

              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefon Hubungan</span>
                <a 
                  href={`tel:${institusi?.telefon}`}
                  className="text-sm font-black text-[#006494] hover:underline flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{institusi?.telefon || "-"}</span>
                </a>
              </div>

              <div className="md:col-span-2 bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat E-mel Rasmi</span>
                <a 
                  href={`mailto:${institusi?.email}`}
                  className="text-sm font-black text-[#006494] hover:underline flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{institusi?.email || "institusi.swasta@gmail.com"}</span>
                </a>
              </div>

              <div className="md:col-span-2 bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Premis Fizikal</span>
                <p className="text-sm font-semibold text-slate-700 flex items-start gap-2 leading-relaxed">
                  <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <span>{institusi?.alamat || "-"}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
