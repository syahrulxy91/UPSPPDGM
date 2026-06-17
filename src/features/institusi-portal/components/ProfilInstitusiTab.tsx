import React from "react";
import { Building2, Edit3, Phone, Mail, MapPin, Clock, ShieldCheck, FileText, Landmark } from "lucide-react";
import { motion } from "motion/react";

interface ProfilInstitusiTabProps {
  institusi: any;
  onEditProfile: () => void;
}

export function ProfilInstitusiTab({ institusi, onEditProfile }: ProfilInstitusiTabProps) {
  // Calculate completion percentage dynamically based on essential fields
  const calculateCompletion = (inst: any) => {
    const basicFields = [
      inst?.namaInstitusi,
      inst?.noRujukan,
      inst?.kategori,
      inst?.statusOperasi,
      inst?.pengelola,
      inst?.telefon,
      inst?.email || inst?.emel,
      inst?.alamat
    ];

    const p = inst?.pemilikPengurusan;
    const pemilikFields = [
      p?.namaPemilik,
      p?.noIC,
      p?.jantina,
      p?.tarikhLahir,
      p?.negara,
      p?.statusPemilik,
      p?.alamatPenuh,
      p?.poskod,
      p?.bandar,
      p?.negeri,
      p?.noTelefon,
      p?.emel,
      p?.namaPengarah,
      p?.noICPengarah,
      p?.jawatanPengurusan,
      p?.noTelefonPengurusan,
      p?.emelPengurusan,
      p?.namaPenyelaras,
      p?.noICPenyelaras,
      p?.noTelefonPenyelaras,
      p?.emelPenyelaras,
      p?.jawatanPenyelaras
    ];

    const allFields = [...basicFields, ...pemilikFields];
    const completed = allFields.filter(val => val !== undefined && val !== null && String(val).trim() !== "");
    const completedCount = completed.length;
    const totalFields = allFields.length;
    const percentage = totalFields > 0 ? (completedCount / totalFields) * 100 : 0;

    return { completedCount, totalFields, percentage };
  };

  const { completedCount, totalFields, percentage } = calculateCompletion(institusi);
  const roundedPercentage = Math.round(percentage);

  // SVG parameters for circular progress bar
  const strokeRadius = 18;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = strokeCircumference - (percentage / 100) * strokeCircumference;

  // Determine RAG color based on percentage thresholds
  let progressColorClass = "stroke-green-500"; // > 66% (e.g. #22C55E)
  if (roundedPercentage <= 33) {
    progressColorClass = "stroke-red-500";   // <= 33% (e.g. #EF4444)
  } else if (roundedPercentage <= 66) {
    progressColorClass = "stroke-orange-500"; // > 33% and <= 66% (e.g. #F97316)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
      id="view-profil"
    >
      {/* Page Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border-l-4 border-amber-500 rounded-r-2xl shadow-md p-6">
        <div className="text-left">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Profil Rasmi Institusi
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">
            Mengurus identiti berdaftar, maklumat perhubungan, pentadbiran am, serta status akreditasi institusi pendidikan swasta.
          </p>
        </div>

        {/* Circular Progress Bar Completeness Card */}
        <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/60 rounded-xl p-3 shadow-xs select-none min-w-[210px] self-stretch md:self-auto justify-center md:justify-start">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r={strokeRadius}
                className="stroke-slate-200"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r={strokeRadius}
                className={`${progressColorClass} transition-all duration-700 ease-out`}
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-slate-800 font-mono">
              {roundedPercentage}%
            </span>
          </div>
          
          <div className="text-left space-y-0.5">
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none block">
              Kemajuan Profil
            </span>
            <h5 className="text-[11px] font-black text-slate-800 leading-none">
              {roundedPercentage === 100 ? "Profil Lengkap!" : "Sila Lengkapkan"}
            </h5>
            <p className="text-[10px] text-slate-500 font-semibold leading-none pt-0.5">
              {completedCount}/{totalFields} diisi
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Certificate Section / Visual Identity Block */}
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 flex flex-col justify-between border border-slate-950 relative overflow-hidden shadow-md min-h-[360px]">
          {/* Abstract background graphics (No raw SVG, clean Tailwind borders) */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-start">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md inline-block">
                {institusi?.kategori || "-"}
              </span>
              <div className="w-10 h-10 bg-white/5 border border-white/10 text-sky-450 rounded-lg flex items-center justify-center">
                <Landmark className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black leading-snug tracking-tight text-white line-clamp-3">
                {institusi?.namaInstitusi}
              </h3>
              <p className="text-xs text-slate-350 flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-455 shrink-0" />
                <span>Pendidikan Swasta Gua Musang</span>
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/10 text-xs text-left">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#4bf3fc]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none">Tarikh Daftar</span>
                <span className="font-semibold text-slate-100">{institusi?.tarikhDaftar || "-"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-200">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4 text-[#4bf3fc]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none">Kemas Kini Terakhir</span>
                <span className="font-semibold text-slate-100">{institusi?.tarikhKemaskiniLast || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Card */}
        <div className="lg:col-span-2 bg-white border-l-4 border-amber-500 rounded-r-2xl p-6 shadow-md flex flex-col justify-between text-left">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h4 className="text-xs font-black text-slate-400 tracking-widest uppercase">
                Maklumat Akreditasi & Operasi
              </h4>
              <button
                onClick={onEditProfile}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-750 text-white px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider shrink-0"
                id="btn-edit-profile"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Kemaskini Profil</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">No. Pendaftaran KPM</span>
                <p className="text-sm font-semibold text-slate-800 font-mono tracking-wide leading-normal">
                  {institusi?.noRujukan || "Belum Berdaftar"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">Status Operasi</span>
                <div>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full uppercase leading-none mt-1 ${
                    !institusi?.statusOperasi
                      ? "bg-slate-50 text-slate-500 border border-slate-200"
                      : institusi?.statusOperasi === "aktif"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {institusi?.statusOperasi && <span className={`w-1.5 h-1.5 rounded-full ${institusi?.statusOperasi === "aktif" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />}
                    <span>{institusi?.statusOperasi || "Belum Ditetapkan"}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">Pengelola / Pengurus</span>
                <p className="text-sm font-semibold text-slate-800 leading-normal">
                  {institusi?.pengelola || "-"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">Telefon Hubungan</span>
                <a 
                  href={`tel:${institusi?.telefon || ""}`}
                  className="text-sm font-semibold text-[#006494] hover:underline flex items-center gap-1.5 leading-normal"
                >
                  <Phone className="w-3.5 h-3.5 text-[#006494]" />
                  <span>{institusi?.telefon || "-"}</span>
                </a>
              </div>

              <div className="space-y-1 col-span-2 md:col-span-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">Alamat E-mel Rasmi</span>
                <a 
                  href={`mailto:${institusi?.email || ""}`}
                  className="text-sm font-semibold text-[#006494] hover:underline flex items-center gap-1.5 leading-normal truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-[#006494]" />
                  <span>{institusi?.email || "-"}</span>
                </a>
              </div>

              <div className="col-span-2 md:col-span-3 space-y-1 pt-4 border-t border-slate-100">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">Alamat Premis Fizikal</span>
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
