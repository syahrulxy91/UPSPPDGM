import React from "react";
import { PemilikPengurusan } from "../../../types/institusi";
import { FieldError } from "../../../shared/components/ui/FieldError";

interface PemilikPengurusanSectionProps {
  value: PemilikPengurusan;
  onChange: (next: PemilikPengurusan) => void;
  errors?: Partial<Record<keyof PemilikPengurusan, string>>;
}

export function PemilikPengurusanSection({
  value,
  onChange,
  errors = {},
}: PemilikPengurusanSectionProps) {
  // Helper to update fields safely
  const updateField = (key: keyof PemilikPengurusan, val: any) => {
    onChange({
      ...value,
      [key]: val,
    });
  };

  const labelClass = "text-[11px] uppercase tracking-wide text-slate-500 font-semibold";
  const inputClass = "w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium";

  return (
    <div className="space-y-6" id="domain-01-pemilik-pengurusan-fields">
      {/* A. Maklumat Pemilik Utama */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2.5">
            <span className="w-6 h-6 bg-sky-50 text-[#006494] text-xs font-black rounded-full flex items-center justify-center border border-sky-100 shrink-0">
              A
            </span>
            SECTION A : MAKLUMAT PEMILIK UTAMA <span className="text-rose-500 font-bold">*</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="namaPemilik">
              Nama Pemilik <span className="text-rose-500">*</span>
            </label>
            <input
              id="namaPemilik"
              type="text"
              placeholder="Nama Penuh Pemilik (Siri Kad Pengenalan)"
              className={`${inputClass} ${errors.namaPemilik ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.namaPemilik || ""}
              onChange={(e) => updateField("namaPemilik", e.target.value)}
              required
            />
            <FieldError error={errors.namaPemilik} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="noIC">
              Kad Pengenalan <span className="text-rose-500">*</span>
            </label>
            <input
              id="noIC"
              type="text"
              placeholder="Format: XXXXXX-XX-XXXX"
              className={`${inputClass} ${errors.noIC ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.noIC || ""}
              onChange={(e) => updateField("noIC", e.target.value)}
              required
            />
            <FieldError error={errors.noIC} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="jantina">
              Jantina <span className="text-rose-500">*</span>
            </label>
            <select
              id="jantina"
              className={`${inputClass} ${errors.jantina ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.jantina || ""}
              onChange={(e) => updateField("jantina", e.target.value)}
              required
            >
              <option value="">-- Pilih Jantina --</option>
              <option value="Lelaki">Lelaki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
            <FieldError error={errors.jantina} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="tarikhLahir">
              Tarikh Lahir <span className="text-rose-500">*</span>
            </label>
            <input
              id="tarikhLahir"
              type="date"
              className={`${inputClass} ${errors.tarikhLahir ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.tarikhLahir || ""}
              onChange={(e) => updateField("tarikhLahir", e.target.value)}
              required
            />
            <FieldError error={errors.tarikhLahir} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="negara">
              Negara <span className="text-rose-500">*</span>
            </label>
            <select
              id="negara"
              className={`${inputClass} ${errors.negara ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.negara || ""}
              onChange={(e) => updateField("negara", e.target.value)}
              required
            >
              <option value="">-- Pilih Negara --</option>
              <option value="Malaysia">Malaysia</option>
              <option value="Bukan Malaysia">Bukan Malaysia</option>
            </select>
            <FieldError error={errors.negara} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="statusPemilik">
              Status Pemilik <span className="text-rose-500">*</span>
            </label>
            <select
              id="statusPemilik"
              className={`${inputClass} ${errors.statusPemilik ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.statusPemilik || ""}
              onChange={(e) => updateField("statusPemilik", e.target.value)}
              required
            >
              <option value="">-- Sila Pilih State --</option>
              <option value="Pemilik Tunggal">Pemilik Tunggal</option>
              <option value="Pemilik Bersama">Pemilik Bersama</option>
              <option value="Pengarah Syarikat">Pengarah Syarikat</option>
            </select>
            <FieldError error={errors.statusPemilik} />
          </div>
        </div>
      </div>

      {/* B. Alamat & Kontak Pemilik */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2.5">
            <span className="w-6 h-6 bg-sky-50 text-[#006494] text-xs font-black rounded-full flex items-center justify-center border border-sky-100 shrink-0">
              B
            </span>
            SECTION B : ALAMAT & KONTAK PEMILIK <span className="text-rose-500 font-bold">*</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className={labelClass} htmlFor="alamatPenuh">
              Alamat Penuh <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="alamatPenuh"
              rows={2}
              maxLength={200}
              placeholder="No. Unit, Lorong, Jalan, Taman Perumahan..."
              className={`${inputClass} ${errors.alamatPenuh ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.alamatPenuh || ""}
              onChange={(e) => updateField("alamatPenuh", e.target.value)}
              required
            />
            <FieldError error={errors.alamatPenuh} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="poskod">
              Poskod <span className="text-rose-500">*</span>
            </label>
            <input
              id="poskod"
              type="text"
              maxLength={5}
              placeholder="Format: 5-digit cth: 18300"
              className={`${inputClass} ${errors.poskod ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.poskod || ""}
              onChange={(e) => updateField("poskod", e.target.value)}
              required
            />
            <FieldError error={errors.poskod} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="bandar">
              Bandar <span className="text-rose-500">*</span>
            </label>
            <input
              id="bandar"
              type="text"
              maxLength={50}
              placeholder="Gua Musang"
              className={`${inputClass} ${errors.bandar ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.bandar || ""}
              onChange={(e) => updateField("bandar", e.target.value)}
              required
            />
            <FieldError error={errors.bandar} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="negeri">
              Negeri <span className="text-rose-500">*</span>
            </label>
            <select
              id="negeri"
              className={`${inputClass} ${errors.negeri ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.negeri || ""}
              onChange={(e) => updateField("negeri", e.target.value)}
              required
            >
              <option value="">-- Pilih Negeri --</option>
              <option value="Kelantan">Kelantan</option>
              <option value="Terengganu">Terengganu</option>
              <option value="Pahang">Pahang</option>
              <option value="Selangor">Selangor</option>
              <option value="Kuala Lumpur">Kuala Lumpur</option>
              <option value="Johor">Johor</option>
              <option value="Kedah">Kedah</option>
              <option value="Melaka">Melaka</option>
              <option value="Negeri Sembilan">Negeri Sembilan</option>
              <option value="Pulau Pinang">Pulau Pinang</option>
              <option value="Perak">Perak</option>
              <option value="Perlis">Perlis</option>
              <option value="Sabah">Sabah</option>
              <option value="Sarawak">Sarawak</option>
              <option value="Labuan">Labuan</option>
              <option value="Putrajaya">Putrajaya</option>
            </select>
            <FieldError error={errors.negeri} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="noTelefon">
              No. Telefon Bimbit <span className="text-rose-500">*</span>
            </label>
            <input
              id="noTelefon"
              type="text"
              placeholder="cth: 012-3456789"
              className={`${inputClass} ${errors.noTelefon ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.noTelefon || ""}
              onChange={(e) => updateField("noTelefon", e.target.value)}
              required
            />
            <FieldError error={errors.noTelefon} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="noTelefonRumah">
              No. Telefon Rumah <span className="text-slate-400 font-normal lowercase">(opsyenal)</span>
            </label>
            <input
              id="noTelefonRumah"
              type="text"
              placeholder="cth: 09-9121234"
              className={inputClass}
              value={value.noTelefonRumah || ""}
              onChange={(e) => updateField("noTelefonRumah", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="emel">
              Emel Rasmi <span className="text-rose-500">*</span>
            </label>
            <input
              id="emel"
              type="email"
              placeholder="contoh@domain.com"
              className={`${inputClass} ${errors.emel ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.emel || ""}
              onChange={(e) => updateField("emel", e.target.value)}
              required
            />
            <FieldError error={errors.emel} />
          </div>
        </div>
      </div>

      {/* C. Maklumat Syarikat (Pilihan / Bersyarat) */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/10 p-4 md:p-5 space-y-4 shadow-sm transition-all duration-300 ease-in-out">
        <div className="border-b border-amber-200/50 pb-3">
          <h4 className="text-sm md:text-base font-black text-amber-950 uppercase tracking-wide flex items-center gap-2.5">
            <span className="w-6 h-6 bg-amber-100 text-amber-800 text-xs font-black rounded-full flex items-center justify-center border border-amber-200 shrink-0">
              C
            </span>
            SECTION C : MAKLUMAT SYARIKAT <span className="text-amber-750 font-normal text-xs normal-case tracking-normal">(Pilihan / Bersyarat)</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wide text-amber-800 font-semibold" htmlFor="namaSyarikat">
              Nama Syarikat
            </label>
            <input
              id="namaSyarikat"
              type="text"
              placeholder="cth: ABC Teguh Edu Sdn Bhd"
              className="w-full rounded-lg border border-amber-200 bg-white text-sm text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              value={value.namaSyarikat || ""}
              onChange={(e) => updateField("namaSyarikat", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wide text-amber-800 font-semibold" htmlFor="noPendaftaranSyarikat">
              No. Pendaftaran Syarikat (SSM)
            </label>
            <input
              id="noPendaftaranSyarikat"
              type="text"
              placeholder="cth: 20210101XXXX (1234567-T)"
              className="w-full rounded-lg border border-amber-200 bg-white text-sm text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              value={value.noPendaftaranSyarikat || ""}
              onChange={(e) => updateField("noPendaftaranSyarikat", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wide text-amber-800 font-semibold" htmlFor="bentukSyarikat">
              Bentuk Syarikat
            </label>
            <select
              id="bentukSyarikat"
              className="w-full rounded-lg border border-amber-200 bg-white text-sm text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
              value={value.bentukSyarikat || ""}
              onChange={(e) => updateField("bentukSyarikat", e.target.value)}
            >
              <option value="">-- Pilih --</option>
              <option value="Sdn Bhd">Sdn Bhd</option>
              <option value="Berhad">Berhad</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wide text-amber-800 font-semibold" htmlFor="tarikhPendaftaranSyarikat">
              Tarikh Pendaftaran Syarikat
            </label>
            <input
              id="tarikhPendaftaranSyarikat"
              type="date"
              className="w-full rounded-lg border border-amber-200 bg-white text-sm text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              value={value.tarikhPendaftaranSyarikat || ""}
              onChange={(e) => updateField("tarikhPendaftaranSyarikat", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wide text-amber-800 font-semibold" htmlFor="statusSyarikat">
              Status Syarikat
            </label>
            <select
              id="statusSyarikat"
              className="w-full rounded-lg border border-amber-200 bg-white text-sm text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
              value={value.statusSyarikat || ""}
              onChange={(e) => updateField("statusSyarikat", e.target.value)}
            >
              <option value="">-- Pilih Status --</option>
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
              <option value="Dissolved">Dissolved</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] uppercase tracking-wide text-amber-800 font-semibold" htmlFor="alamatSyarikat">
              Alamat Syarikat
            </label>
            <input
              id="alamatSyarikat"
              type="text"
              maxLength={200}
              placeholder="Alamat Berdaftar Pejabat / Syarikat"
              className="w-full rounded-lg border border-amber-200 bg-white text-sm text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              value={value.alamatSyarikat || ""}
              onChange={(e) => updateField("alamatSyarikat", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* D. Maklumat Pengurusan Utama */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2.5">
            <span className="w-6 h-6 bg-sky-50 text-[#006494] text-xs font-black rounded-full flex items-center justify-center border border-sky-100 shrink-0">
              D
            </span>
            SECTION D : MAKLUMAT PENGURUSAN UTAMA <span className="text-rose-500 font-bold">*</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 font-sans">
            <label className={labelClass} htmlFor="namaPengarah">
              Nama Pengarah / Pengurus Besar <span className="text-rose-500">*</span>
            </label>
            <input
              id="namaPengarah"
              type="text"
              placeholder="Nama pengarah yang bertanggungjawab"
              className={`${inputClass} ${errors.namaPengarah ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.namaPengarah || ""}
              onChange={(e) => updateField("namaPengarah", e.target.value)}
              required
            />
            <FieldError error={errors.namaPengarah} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="noICPengarah">
              No. IC Pengarah <span className="text-rose-500">*</span>
            </label>
            <input
              id="noICPengarah"
              type="text"
              placeholder="Format: XXXXXX-XX-XXXX"
              className={`${inputClass} ${errors.noICPengarah ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.noICPengarah || ""}
              onChange={(e) => updateField("noICPengarah", e.target.value)}
              required
            />
            <FieldError error={errors.noICPengarah} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="jawatanPengurusan">
              Jawatan Pengurusan Utama <span className="text-rose-500">*</span>
            </label>
            <select
              id="jawatanPengurusan"
              className={`${inputClass} ${errors.jawatanPengurusan ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.jawatanPengurusan || ""}
              onChange={(e) => updateField("jawatanPengurusan", e.target.value)}
              required
            >
              <option value="">-- Pilih Jawatan --</option>
              <option value="Pengarah">Pengarah</option>
              <option value="Pengurus">Pengurus</option>
              <option value="Ketua Sekolah">Ketua Sekolah</option>
              <option value="Admin">Admin</option>
            </select>
            <FieldError error={errors.jawatanPengurusan} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="noTelefonPengurusan">
              No. Telefon Pengurusan <span className="text-rose-500">*</span>
            </label>
            <input
              id="noTelefonPengurusan"
              type="text"
              placeholder="cth: 013-XXXXXXX"
              className={`${inputClass} ${errors.noTelefonPengurusan ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.noTelefonPengurusan || ""}
              onChange={(e) => updateField("noTelefonPengurusan", e.target.value)}
              required
            />
            <FieldError error={errors.noTelefonPengurusan} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="emelPengurusan">
              Emel Pengurusan <span className="text-rose-500">*</span>
            </label>
            <input
              id="emelPengurusan"
              type="email"
              placeholder="cth: management@domain.com"
              className={`${inputClass} ${errors.emelPengurusan ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.emelPengurusan || ""}
              onChange={(e) => updateField("emelPengurusan", e.target.value)}
              required
            />
            <FieldError error={errors.emelPengurusan} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="tarikhMulaMengurus">
              Tarikh Mula Mengurus <span className="text-slate-400 font-normal lowercase">(opsyenal)</span>
            </label>
            <input
              id="tarikhMulaMengurus"
              type="date"
              className={inputClass}
              value={value.tarikhMulaMengurus || ""}
              onChange={(e) => updateField("tarikhMulaMengurus", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* E. Maklumat Penyelaras Institusi */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2.5">
            <span className="w-6 h-6 bg-sky-50 text-[#006494] text-xs font-black rounded-full flex items-center justify-center border border-sky-100 shrink-0">
              E
            </span>
            SECTION E : MAKLUMAT PENYELARAS INSTITUSI <span className="text-rose-500 font-bold">*</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="namaPenyelaras">
              Nama Penyelaras Institusi <span className="text-rose-500">*</span>
            </label>
            <input
              id="namaPenyelaras"
              type="text"
              placeholder="cth: Cik Sarah Binti Ali"
              className={`${inputClass} ${errors.namaPenyelaras ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.namaPenyelaras || ""}
              onChange={(e) => updateField("namaPenyelaras", e.target.value)}
              required
            />
            <FieldError error={errors.namaPenyelaras} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="noICPenyelaras">
              No. IC Penyelaras <span className="text-rose-500">*</span>
            </label>
            <input
              id="noICPenyelaras"
              type="text"
              placeholder="Format: XXXXXX-XX-XXXX"
              className={`${inputClass} ${errors.noICPenyelaras ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.noICPenyelaras || ""}
              onChange={(e) => updateField("noICPenyelaras", e.target.value)}
              required
            />
            <FieldError error={errors.noICPenyelaras} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="noTelefonPenyelaras">
              No. Telefon Penyelaras <span className="text-rose-500">*</span>
            </label>
            <input
              id="noTelefonPenyelaras"
              type="text"
              placeholder="No. telefon bimbit hubungi"
              className={`${inputClass} ${errors.noTelefonPenyelaras ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.noTelefonPenyelaras || ""}
              onChange={(e) => updateField("noTelefonPenyelaras", e.target.value)}
              required
            />
            <FieldError error={errors.noTelefonPenyelaras} />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="emelPenyelaras">
              Emel Penyelaras <span className="text-rose-500">*</span>
            </label>
            <input
              id="emelPenyelaras"
              type="email"
              placeholder="cth: sarah.ali@tadika.edu.my"
              className={`${inputClass} ${errors.emelPenyelaras ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.emelPenyelaras || ""}
              onChange={(e) => updateField("emelPenyelaras", e.target.value)}
              required
            />
            <FieldError error={errors.emelPenyelaras} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className={labelClass} htmlFor="jawatanPenyelaras">
              Jawatan Penyelaras <span className="text-rose-500">*</span>
            </label>
            <input
              id="jawatanPenyelaras"
              type="text"
              placeholder="cth: Penyelaras Akademik / Guru Kanan"
              className={`${inputClass} ${errors.jawatanPenyelaras ? "border-red-300 ring-1 ring-red-300" : ""}`}
              value={value.jawatanPenyelaras || ""}
              onChange={(e) => updateField("jawatanPenyelaras", e.target.value)}
              required
            />
            <FieldError error={errors.jawatanPenyelaras} />
          </div>
        </div>
      </div>
    </div>
  );
}
