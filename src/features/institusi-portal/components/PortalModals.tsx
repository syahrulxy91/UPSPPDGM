import React from "react";
import { X } from "lucide-react";
import { FieldError } from "../../../shared/components/ui/FieldError";
import { KelasRecord } from "../services/portalService";

interface PortalModalsProps {
  // Opening triggers
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: (val: boolean) => void;
  isAddKelasOpen: boolean;
  setIsAddKelasOpen: (val: boolean) => void;
  isAddMuridOpen: boolean;
  setIsAddMuridOpen: (val: boolean) => void;
  isAddGuruOpen: boolean;
  setIsAddGuruOpen: (val: boolean) => void;
  isAddProgramOpen: boolean;
  setIsAddProgramOpen: (val: boolean) => void;

  // Profil Form States
  profileForm: any;
  setProfileForm: (val: any) => void;
  profileErrors: any;
  isProfileSubmitting: boolean;
  handleUpdateProfile: (e: React.FormEvent) => void;
  handleProfileBlur: (field: string) => (e: any) => void;
  handleProfileTelefonChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Kelas Form States
  kelasForm: any;
  setKelasForm: (val: any) => void;
  kelasErrors: any;
  isKelasSubmitting: boolean;
  handleAddKelas: (e: React.FormEvent) => void;
  handleKelasBlur: (field: string) => (e: any) => void;

  // Murid Form States
  muridForm: any;
  setMuridForm: (val: any) => void;
  muridErrors: any;
  isMuridSubmitting: boolean;
  handleAddMurid: (e: React.FormEvent) => void;
  handleMuridBlur: (field: string) => (e: any) => void;
  kelasList: KelasRecord[];

  // Guru Form States
  guruForm: any;
  setGuruForm: (val: any) => void;
  guruErrors: any;
  isGuruSubmitting: boolean;
  handleAddGuru: (e: React.FormEvent) => void;
  handleGuruBlur: (field: string) => (e: any) => void;
  handleGuruICChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Program Form States
  programForm: any;
  setProgramForm: (val: any) => void;
  programErrors: any;
  isProgramSubmitting: boolean;
  handleAddProgram: (e: React.FormEvent) => void;
  handleProgramBlur: (field: string) => (e: any) => void;
}

export function PortalModals({
  // Opening triggers
  isEditProfileOpen,
  setIsEditProfileOpen,
  isAddKelasOpen,
  setIsAddKelasOpen,
  isAddMuridOpen,
  setIsAddMuridOpen,
  isAddGuruOpen,
  setIsAddGuruOpen,
  isAddProgramOpen,
  setIsAddProgramOpen,

  // Profil Form States
  profileForm,
  setProfileForm,
  profileErrors,
  isProfileSubmitting,
  handleUpdateProfile,
  handleProfileBlur,
  handleProfileTelefonChange,

  // Kelas Form States
  kelasForm,
  setKelasForm,
  kelasErrors,
  isKelasSubmitting,
  handleAddKelas,
  handleKelasBlur,

  // Murid Form States
  muridForm,
  setMuridForm,
  muridErrors,
  isMuridSubmitting,
  handleAddMurid,
  handleMuridBlur,
  kelasList,

  // Guru Form States
  guruForm,
  setGuruForm,
  guruErrors,
  isGuruSubmitting,
  handleAddGuru,
  handleGuruBlur,
  handleGuruICChange,

  // Program Form States
  programForm,
  setProgramForm,
  programErrors,
  isProgramSubmitting,
  handleAddProgram,
  handleProgramBlur
}: PortalModalsProps) {
  
  return (
    <>
      {/* ==================== 2A: EDIT PROFILE MODAL ==================== */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" id="modal-edit-profile">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-xl max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black text-slate-850 uppercase tracking-widest">
                Edit Profil Maklumat Institusi
              </h3>
              <button 
                onClick={() => setIsEditProfileOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Nama Lengkap Institusi / Lembaga
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.namaInstitusi}
                  onChange={(e) => setProfileForm({ ...profileForm, namaInstitusi: e.target.value })}
                  onBlur={handleProfileBlur("namaInstitusi")}
                  className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                    profileErrors.namaInstitusi ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <FieldError error={profileErrors.namaInstitusi} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    No. Pendaftaran KPM
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profileForm.noRujukan}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-xs rounded-xl px-4 py-3 font-bold cursor-not-allowed opacity-80"
                  />
                  <p className="text-[9px] text-slate-400 italic">Maklumat ini ditetapkan oleh pegawai PPDGM.</p>
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Status Operasi Sekolah
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profileForm.statusOperasi ? profileForm.statusOperasi.toUpperCase() : "BELUM DITETAPKAN"}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-xs rounded-xl px-4 py-3 font-bold cursor-not-allowed opacity-80"
                  />
                  <p className="text-[9px] text-slate-400 italic">Maklumat ini ditetapkan oleh pegawai PPDGM.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Nama Pengetua / Pengelola
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.pengelola}
                    onChange={(e) => setProfileForm({ ...profileForm, pengelola: e.target.value })}
                    onBlur={handleProfileBlur("pengelola")}
                    className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                      profileErrors.pengelola ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={profileErrors.pengelola} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    No. Telefon Am
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.telefon}
                    onChange={handleProfileTelefonChange}
                    onBlur={handleProfileBlur("telefon")}
                    className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                      profileErrors.telefon ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={profileErrors.telefon} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Alamat E-mel Rasmi
                </label>
                <input
                  type="email"
                  required
                  value={profileForm.email || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  onBlur={handleProfileBlur("email")}
                  className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                    profileErrors.email ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <FieldError error={profileErrors.email} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Alamat Premis Fizikal Sekolah
                </label>
                <textarea
                  required
                  rows={3}
                  value={profileForm.alamat}
                  onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                  onBlur={handleProfileBlur("alamat")}
                  className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none resize-none focus:ring-1 focus:ring-[#006494] ${
                    profileErrors.alamat ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <FieldError error={profileErrors.alamat} />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-55 text-slate-600 text-xs font-black cursor-pointer uppercase tracking-wider"
                  disabled={isProfileSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#006494] hover:bg-[#004f76] text-white text-xs font-black cursor-pointer uppercase border border-sky-950/20 shadow-sm flex items-center gap-1.5"
                  disabled={isProfileSubmitting}
                >
                  {isProfileSubmitting ? "Menyimpan..." : "Simpan Profil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 2B: TAMBAH KELAS MODAL ==================== */}
      {isAddKelasOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-xl max-w-sm w-full flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-850 uppercase tracking-widest">
                Daftar Kelas Akademik
              </h3>
              <button 
                onClick={() => setIsAddKelasOpen(false)} 
                className="text-slate-400 hover:text-slate-650 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddKelas} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nama Kelas</label>
                <input
                  type="text"
                  placeholder="Contoh: Seri Pintar A"
                  required
                  value={kelasForm.namaKelas}
                  onChange={(e) => setKelasForm({ ...kelasForm, namaKelas: e.target.value })}
                  onBlur={handleKelasBlur("namaKelas")}
                  className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                    kelasErrors.namaKelas ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <FieldError error={kelasErrors.namaKelas} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Peringkat Gred / Kumpulan Umur</label>
                <input
                  type="text"
                  placeholder="Contoh: Umur 5 Tahun"
                  required
                  value={kelasForm.tahap}
                  onChange={(e) => setKelasForm({ ...kelasForm, tahap: e.target.value })}
                  onBlur={handleKelasBlur("tahap")}
                  className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                    kelasErrors.tahap ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <FieldError error={kelasErrors.tahap} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Kapasiti Maksimum Bilik Darjah</label>
                <input
                  type="number"
                  placeholder="Maksimum 100"
                  required
                  min={1}
                  max={100}
                  value={kelasForm.kapasitiMaksimum || ""}
                  onChange={(e) => setKelasForm({ ...kelasForm, kapasitiMaksimum: Number(e.target.value) })}
                  onBlur={handleKelasBlur("kapasitiMaksimum")}
                  className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                    kelasErrors.kapasitiMaksimum ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <FieldError error={kelasErrors.kapasitiMaksimum} />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setIsAddKelasOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 uppercase tracking-wider cursor-pointer"
                  disabled={isKelasSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#006494] hover:bg-[#004f76] text-white uppercase tracking-wider cursor-pointer shadow-xs border border-sky-950/20"
                  disabled={isKelasSubmitting}
                >
                  {isKelasSubmitting ? "Mendaftar..." : "Daftar Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 2B: TAMBAH MURID MODAL ==================== */}
      {isAddMuridOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-xl max-w-sm w-full flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-850 uppercase tracking-widest">
                Kemasukan Murid Baru
              </h3>
              <button 
                onClick={() => setIsAddMuridOpen(false)} 
                className="text-slate-400 hover:text-slate-650 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddMurid} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nama Penuh Murid (Sijil Lahir)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Ammar bin Yusuf"
                  value={muridForm.nama}
                  onChange={(e) => setMuridForm({ ...muridForm, nama: e.target.value })}
                  onBlur={handleMuridBlur("nama")}
                  className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                    muridErrors.nama ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <FieldError error={muridErrors.nama} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pilihan Kelas Disasar</label>
                <select
                  required
                  value={muridForm.kelasId}
                  onChange={(e) => setMuridForm({ ...muridForm, kelasId: e.target.value })}
                  onBlur={handleMuridBlur("kelasId")}
                  className={`w-full bg-slate-50 border text-slate-805 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] cursor-pointer ${
                    muridErrors.kelasId ? "border-red-500" : "border-slate-200"
                  }`}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id}>{k.namaKelas} ({k.tahap})</option>
                  ))}
                </select>
                <FieldError error={muridErrors.kelasId} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Jantina</label>
                  <select
                    value={muridForm.jantina}
                    onChange={(e) => setMuridForm({ ...muridForm, jantina: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-805 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494]"
                  >
                    <option value="Lelaki">Lelaki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Umur Murid</label>
                  <input
                    type="number"
                    min={3}
                    max={18}
                    required
                    value={muridForm.umur}
                    onChange={(e) => setMuridForm({ ...muridForm, umur: Number(e.target.value) })}
                    onBlur={handleMuridBlur("umur")}
                    className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                      muridErrors.umur ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={muridErrors.umur} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setIsAddMuridOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 uppercase tracking-wider cursor-pointer"
                  disabled={isMuridSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#006494] hover:bg-[#004f76] text-white uppercase tracking-wider cursor-pointer shadow-xs border border-sky-950/20"
                  disabled={isMuridSubmitting}
                >
                  {isMuridSubmitting ? "Menyimpan..." : "Daftar Murid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 2C: TAMBAH GURU MODAL ==================== */}
      {isAddGuruOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" id="modal-add-guru">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black text-slate-855 uppercase tracking-widest">
                Daftar Guru / Staf Baru
              </h3>
              <button 
                onClick={() => setIsAddGuruOpen(false)} 
                className="text-slate-400 hover:text-slate-650 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddGuru} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Nama Lengkap */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold block mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Fatimah binti Razak"
                    value={guruForm.nama}
                    onChange={(e) => setGuruForm({ ...guruForm, nama: e.target.value })}
                    onBlur={handleGuruBlur("nama")}
                    className={`w-full bg-slate-50 border text-slate-800 text-sm rounded-lg border-slate-200 focus:ring-sky-500 focus:border-sky-500 px-4 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-1 ${
                      guruErrors.nama ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={guruErrors.nama} />
                </div>

                {/* 2. Kad Pengenalan */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold block mb-1.5">Kad Pengenalan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 950312-03-5561"
                    value={guruForm.icNumber}
                    onChange={handleGuruICChange}
                    onBlur={handleGuruBlur("icNumber")}
                    className={`w-full bg-slate-50 border text-slate-800 text-sm rounded-lg border-slate-200 focus:ring-sky-500 focus:border-sky-500 px-4 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-1 ${
                      guruErrors.icNumber ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={guruErrors.icNumber} />
                </div>

                {/* 3. Jantina */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold block mb-1.5">Jantina</label>
                  <select
                    required
                    value={guruForm.jantina || ""}
                    onChange={(e) => setGuruForm({ ...guruForm, jantina: e.target.value })}
                    onBlur={handleGuruBlur("jantina")}
                    className={`w-full bg-slate-50 border text-slate-800 text-sm rounded-lg border-slate-200 focus:ring-sky-500 focus:border-sky-500 px-4 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-1 cursor-pointer ${
                      guruErrors.jantina ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                    }`}
                  >
                    <option value="">-- Pilih Jantina --</option>
                    <option value="Lelaki">Lelaki</option>
                    <option value="Perempuan">Perempuan</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                  <FieldError error={guruErrors.jantina} />
                </div>

                {/* 4. Jawatan */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold block mb-1.5">Jawatan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Guru Pembimbing / Penolong Kanan"
                    value={guruForm.jawatan}
                    onChange={(e) => setGuruForm({ ...guruForm, jawatan: e.target.value })}
                    onBlur={handleGuruBlur("jawatan")}
                    className={`w-full bg-slate-50 border text-slate-800 text-sm rounded-lg border-slate-200 focus:ring-sky-500 focus:border-sky-500 px-4 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-1 ${
                      guruErrors.jawatan ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={guruErrors.jawatan} />
                </div>

                {/* 5. Status */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold block mb-1.5">Status</label>
                  <select
                    required
                    value={guruForm.status}
                    onChange={(e) => setGuruForm({ ...guruForm, status: e.target.value as any })}
                    onBlur={handleGuruBlur("status")}
                    className={`w-full bg-slate-50 border text-slate-800 text-sm rounded-lg border-slate-200 focus:ring-sky-500 focus:border-sky-500 px-4 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-1 cursor-pointer ${
                      guruErrors.status ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                    }`}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Keluar">Keluar</option>
                  </select>
                  <FieldError error={guruErrors.status} />
                </div>

                {/* 6. Subjek Kompetensi / Kepakaran */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold block mb-1.5">Subjek Kompetensi / Kepakaran</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bahasa Melayu & Seni Kreatif"
                    value={guruForm.subjek}
                    onChange={(e) => setGuruForm({ ...guruForm, subjek: e.target.value })}
                    onBlur={handleGuruBlur("subjek")}
                    className={`w-full bg-slate-50 border text-slate-800 text-sm rounded-lg border-slate-200 focus:ring-sky-500 focus:border-sky-500 px-4 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-1 ${
                      guruErrors.subjek ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={guruErrors.subjek} />
                </div>

                {/* 7. No. Permit */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold block mb-1.5">No. Permit</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1234/2026"
                    value={guruForm.noPermit || ""}
                    onChange={(e) => setGuruForm({ ...guruForm, noPermit: e.target.value })}
                    onBlur={handleGuruBlur("noPermit")}
                    className={`w-full bg-slate-50 border text-slate-800 text-sm rounded-lg border-slate-200 focus:ring-sky-500 focus:border-sky-500 px-4 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-1 ${
                      guruErrors.noPermit ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={guruErrors.noPermit} />
                </div>

                {/* 8. Tarikh Mula Permit */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold block mb-1.5">Tarikh Mula Permit</label>
                  <input
                    type="date"
                    required
                    value={guruForm.tarikhMulaPermit || ""}
                    onChange={(e) => setGuruForm({ ...guruForm, tarikhMulaPermit: e.target.value })}
                    onBlur={handleGuruBlur("tarikhMulaPermit")}
                    className={`w-full bg-slate-50 border text-slate-850 text-sm rounded-lg border-slate-200 focus:ring-sky-500 focus:border-sky-500 px-4 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-1 cursor-pointer ${
                      guruErrors.tarikhMulaPermit ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={guruErrors.tarikhMulaPermit} />
                </div>

                {/* 9. Tarikh Tamat Permit */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-slate-500 block mb-1.5 font-semibold">Tarikh Tamat Permit <span className="text-slate-400 font-normal lowercase">(pilihan)</span></label>
                  <input
                    type="date"
                    value={guruForm.tarikhTamatPermit || ""}
                    onChange={(e) => setGuruForm({ ...guruForm, tarikhTamatPermit: e.target.value })}
                    onBlur={handleGuruBlur("tarikhTamatPermit")}
                    className={`w-full bg-slate-50 border text-slate-855 text-sm rounded-lg border-slate-200 focus:ring-sky-500 focus:border-sky-500 px-4 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-1 cursor-pointer ${
                      guruErrors.tarikhTamatPermit ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={guruErrors.tarikhTamatPermit} />
                </div>

                {/* 10. Tahap Pendidikan Semasa */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold block mb-1.5">Tahap Pendidikan Semasa</label>
                  <select
                    required
                    value={guruForm.tahapPendidikanSemasa || ""}
                    onChange={(e) => setGuruForm({ ...guruForm, tahapPendidikanSemasa: e.target.value })}
                    onBlur={handleGuruBlur("tahapPendidikanSemasa")}
                    className={`w-full bg-slate-50 border text-slate-800 text-sm rounded-lg border-slate-200 focus:ring-sky-500 focus:border-sky-500 px-4 py-2.5 font-bold focus:bg-white focus:outline-none focus:ring-1 cursor-pointer ${
                      guruErrors.tahapPendidikanSemasa ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                    }`}
                  >
                    <option value="">-- Pilih Pendidikan --</option>
                    <option value="SPM">SPM</option>
                    <option value="STPM">STPM</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Ijazah">Ijazah</option>
                    <option value="Sarjana">Sarjana</option>
                    <option value="PhD">PhD</option>
                  </select>
                  <FieldError error={guruErrors.tahapPendidikanSemasa} />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 text-xs font-black shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddGuruOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 uppercase tracking-wider cursor-pointer"
                  disabled={isGuruSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#006494] hover:bg-[#004f76] text-white uppercase tracking-wider cursor-pointer shadow-sm border border-sky-950/20"
                  disabled={isGuruSubmitting}
                >
                  {isGuruSubmitting ? "Menyimpan..." : "Simpan Rekod"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 2D: LOG PROGRAM MODAL ==================== */}
      {isAddProgramOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-xl max-w-sm w-full flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-855 uppercase tracking-widest">
                Log Program & Aktiviti Baru
              </h3>
              <button 
                onClick={() => setIsAddProgramOpen(false)} 
                className="text-slate-400 hover:text-slate-650 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddProgram} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nama Program / Aktiviti</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hari Sukaneka & Riadah"
                  value={programForm.nama}
                  onChange={(e) => setProgramForm({ ...programForm, nama: e.target.value })}
                  onBlur={handleProgramBlur("nama")}
                  className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                    programErrors.nama ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <FieldError error={programErrors.nama} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tarikh Dilaksana</label>
                  <input
                    type="date"
                    required
                    value={programForm.tarikh}
                    onChange={(e) => setProgramForm({ ...programForm, tarikh: e.target.value })}
                    onBlur={handleProgramBlur("tarikh")}
                    className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                      programErrors.tarikh ? "border-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={programErrors.tarikh} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Jumlah Sasaran Peserta</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={programForm.bilPeserta || ""}
                    onChange={(e) => setProgramForm({ ...programForm, bilPeserta: Number(e.target.value) })}
                    onBlur={handleProgramBlur("bilPeserta")}
                    className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494] ${
                      programErrors.bilPeserta ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                    }`}
                  />
                  <FieldError error={programErrors.bilPeserta} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status Pelaksanaan</label>
                <select
                  value={programForm.status}
                  onChange={(e) => setProgramForm({ ...programForm, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-805 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006494]"
                >
                  <option value="Dirancang">Dirancang</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Penerangan Ringkas Skor / Aktiviti</label>
                <textarea
                  rows={3}
                  placeholder="Terangkan secara ringkas skop dan matlamat pencapaian..."
                  value={programForm.penerangan}
                  onChange={(e) => setProgramForm({ ...programForm, penerangan: e.target.value })}
                  onBlur={handleProgramBlur("penerangan")}
                  className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-xl px-4 py-3 font-bold focus:bg-white focus:outline-none resize-none focus:ring-1 focus:ring-[#006494] ${
                    programErrors.penerangan ? "border-red-500 focus:ring-red-500" : "border-slate-200"
                  }`}
                />
                <FieldError error={programErrors.penerangan} />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setIsAddProgramOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 uppercase tracking-wider cursor-pointer"
                  disabled={isProgramSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#006494] hover:bg-[#004f76] text-white uppercase tracking-wider cursor-pointer shadow-xs border border-sky-950/20"
                  disabled={isProgramSubmitting}
                >
                  {isProgramSubmitting ? "Menyimpan..." : "Simpan Rekod"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
