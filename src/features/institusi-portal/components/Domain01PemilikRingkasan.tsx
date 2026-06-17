import React from "react";
import { 
  User, Mail, Phone, ShieldCheck, FileText, Globe, 
  Calendar, MapPin, Building2, Briefcase, Landmark, Info
} from "lucide-react";
import { motion } from "motion/react";
import { PemilikPengurusan } from "../../../types/institusi";

interface Domain01PemilikRingkasanProps {
  pemilikPengurusan?: PemilikPengurusan | null;
}

export function Domain01PemilikRingkasan({ pemilikPengurusan }: Domain01PemilikRingkasanProps) {
  // If pemilikPengurusan is completely missing, or does not have the core fields populated, show empty state
  const isEmpty = !pemilikPengurusan || !pemilikPengurusan.namaPemilik;

  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto my-8"
        id="domain01-empty-state"
      >
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <Info className="w-6 h-6 text-amber-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-800 tracking-tight">Maklumat Belum Lengkap</h3>
          <p className="text-slate-500 text-xs font-semibold leading-relaxed">
            Maklumat pemilik & pengurusan belum dilengkapkan pada borang pendaftaran. Sila daftar atau lengkapkan maklumat borang pendaftaran terlebih dahulu.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
      id="domain01-pemilik-ringkasan"
    >
      {/* Overview Stats banner */}
      <div className="bg-white border-l-4 border-[#006494] shadow-sm rounded-r-2xl p-5 text-left">
        <span className="text-[9px] bg-sky-50 text-[#006494] border border-[#006494]/15 font-black px-2.5 py-1 rounded-md uppercase tracking-wider mb-2.5 inline-block">
          DOMAIN 01 • Ringkasan Pemilik & Pengurusan
        </span>
        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
          Maklumat Pemilik, Alamat, Syarikat, Pengurusan Utama & Penyelaras
        </h3>
        <p className="text-slate-500 text-[11px] font-semibold mt-1 leading-relaxed">
          Semua maklumat di bawah disegerakan terus dari rekod borang pendaftaran yang telah diluluskan oleh Unit Swasta PPD Gua Musang.
        </p>
      </div>

      {/* Grid of Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Seksyen A: Maklumat Pemilik Utama */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-left relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-[#006494]/10 rounded-lg text-[#006494]">
                <User className="w-4 h-4" />
              </div>
              <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                SECTION A : MAKLUMAT PEMILIK UTAMA
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Nama Pemilik Utama</span>
                <span className="font-extrabold text-slate-900 text-sm">{pemilikPengurusan.namaPemilik}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">No. IC / MyKad</span>
                <span className="font-semibold text-slate-800 font-mono tracking-wider">{pemilikPengurusan.noIC}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Status Pemilik</span>
                <span className="font-extrabold text-[#006494]">{pemilikPengurusan.statusPemilik}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Negara Asal</span>
                <span className="font-semibold text-slate-850 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span>{pemilikPengurusan.negara}</span>
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Jantina</span>
                <span className="font-semibold text-slate-800">{pemilikPengurusan.jantina}</span>
              </div>

              {pemilikPengurusan.tarikhLahir && (
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Tarikh Lahir</span>
                  <span className="font-semibold text-slate-800">{pemilikPengurusan.tarikhLahir}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seksyen B: Alamat & Kontak Pemilik */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-left relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-[#006494]/10 rounded-lg text-[#006494]">
                <MapPin className="w-4 h-4" />
              </div>
              <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                SECTION B : ALAMAT & KONTAK PEMILIK
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Alamat Kediaman</span>
                <p className="font-semibold text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
                  {pemilikPengurusan.alamatPenuh}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Poskod</span>
                <span className="font-semibold text-slate-800 font-mono">{pemilikPengurusan.poskod}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Bandar & Negeri</span>
                <span className="font-semibold text-slate-800">{pemilikPengurusan.bandar}, {pemilikPengurusan.negeri}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">No. Telefon Bimbit</span>
                <span className="font-semibold text-slate-800 font-mono">{pemilikPengurusan.noTelefon}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">E-mel Peribadi</span>
                <span className="font-semibold text-slate-800 truncate block text-[#01696f]">{pemilikPengurusan.emel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seksyen C: Maklumat Syarikat (Jika Berkaitan) */}
        {pemilikPengurusan.namaSyarikat ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-left relative overflow-hidden flex flex-col justify-between lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-1.5 bg-[#006494]/10 rounded-lg text-[#006494]">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm md:text-base font-black text-slate-950 uppercase tracking-wide">
                  SECTION C : MAKLUMAT SYARIKAT <span className="text-slate-500 font-normal text-xs normal-case tracking-normal">(Pilihan / Bersyarat)</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
                <div className="space-y-0.5 sm:col-span-2 md:col-span-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Nama Syarikat Yang Didaftarkan</span>
                  <span className="font-extrabold text-slate-900 text-sm uppercase">{pemilikPengurusan.namaSyarikat}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">No. Pendaftaran Syarikat</span>
                  <span className="font-semibold text-slate-800 font-mono uppercase">{pemilikPengurusan.noPendaftaranSyarikat || "N/A"}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Bentuk Entiti Syarikat</span>
                  <span className="font-semibold text-slate-800">{pemilikPengurusan.bentukSyarikat || "N/A"}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Tarikh Pendaftaran Syarikat</span>
                  <span className="font-semibold text-slate-800">{pemilikPengurusan.tarikhPendaftaranSyarikat || "N/A"}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Status Syarikat (SSM)</span>
                  <span className={`font-black uppercase text-[10px] ${
                    pemilikPengurusan.statusSyarikat === "Aktif" ? "text-emerald-700" : "text-amber-700"
                  }`}>
                    {pemilikPengurusan.statusSyarikat || "N/A"}
                  </span>
                </div>

                {pemilikPengurusan.alamatSyarikat && (
                  <div className="space-y-0.5 sm:col-span-2 md:col-span-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Alamat Pejabat Syarikat</span>
                    <p className="font-semibold text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
                      {pemilikPengurusan.alamatSyarikat}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl p-6 text-center space-y-1.5 flex flex-col justify-center items-center lg:col-span-2">
            <span className="text-sm md:text-base font-black text-slate-950 uppercase tracking-wide">SECTION C : MAKLUMAT SYARIKAT</span>
            <p className="text-slate-400 text-xs font-semibold">Terdapat tiada entiti syarikat berpaut. Pemilik berdaftar secara persendirian / individu.</p>
          </div>
        )}

        {/* Seksyen D: Maklumat Pengurusan Utama */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-left relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-[#006494]/10 rounded-lg text-[#006494]">
                <Briefcase className="w-4 h-4" />
              </div>
              <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                SECTION D : MAKLUMAT PENGURUSAN UTAMA
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Nama Pengarah / Pengurus Utama</span>
                <span className="font-extrabold text-slate-900 text-sm">{pemilikPengurusan.namaPengarah}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">No. IC Pengarah</span>
                <span className="font-semibold text-slate-800 font-mono tracking-wider">{pemilikPengurusan.noICPengarah}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Jawatan Pengurusan</span>
                <span className="font-extrabold text-[#006494]">{pemilikPengurusan.jawatanPengurusan}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">No. Telefon Pengurusan</span>
                <span className="font-semibold text-slate-800 font-mono">{pemilikPengurusan.noTelefonPengurusan}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">E-mel Kerja</span>
                <span className="font-semibold text-slate-800 truncate block text-[#01696f]">{pemilikPengurusan.emelPengurusan}</span>
              </div>

              {pemilikPengurusan.tarikhMulaMengurus && (
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Tarikh Mula Mengurus</span>
                  <span className="font-semibold text-slate-800">{pemilikPengurusan.tarikhMulaMengurus}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seksyen E: Maklumat Penyelaras Institusi */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-left relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-[#006494]/10 rounded-lg text-[#006494]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                SECTION E : MAKLUMAT PENYELARAS INSTITUSI
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Nama Penyelaras Berdaftar</span>
                <span className="font-extrabold text-slate-900 text-sm">{pemilikPengurusan.namaPenyelaras}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">No. IC Penyelaras</span>
                <span className="font-semibold text-slate-800 font-mono tracking-wider">{pemilikPengurusan.noICPenyelaras}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Jawatan Penyelaras</span>
                <span className="font-extrabold text-amber-700">{pemilikPengurusan.jawatanPenyelaras}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">No. Telefon Penyelaras</span>
                <span className="font-semibold text-slate-800 font-mono">{pemilikPengurusan.noTelefonPenyelaras}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">E-mel Penyelaras</span>
                <span className="font-semibold text-slate-800 truncate block text-[#01696f]">{pemilikPengurusan.emelPenyelaras}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
