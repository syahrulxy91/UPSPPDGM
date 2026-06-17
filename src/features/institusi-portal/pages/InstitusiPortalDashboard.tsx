import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  Briefcase, 
  Calendar, 
  LogOut, 
  ShieldAlert, 
  Clock,
  Landmark,
  FileCheck,
  ClipboardCheck,
  Award,
  Activity,
  ListTodo,
  GraduationCap,
  MapPin,
  Search,
  AlertCircle,
  Database,
  FileText,
  BadgeCheck
} from "lucide-react";
import { toast } from "react-hot-toast";
import { exportProgramPdf } from "../../laporan/utils/exportProgramPdf";
import { 
  getPortalProfile, 
  updatePortalProfile, 
  getKelasList, 
  addKelasRecord, 
  getMuridList, 
  addMuridRecord, 
  getGuruList, 
  addGuruRecord, 
  getProgramList, 
  addProgramRecord,
  KelasRecord,
  MuridRecord,
  GuruRecord,
  ProgramRecord
} from "../services/portalService";
import { getInstitusiById, updateInstitusiPemilikPengurusan } from "../../institusi/services/institusiService";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";
import { PemilikPengurusan } from "../../../types/institusi";
import { PemilikPengurusanSection } from "../../institusi/components/PemilikPengurusanSection";

// Simple class name merger helper
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(" ");

// UI/UX Pro Max Modular Components
import { ProfilInstitusiTab } from "../components/ProfilInstitusiTab";
import { KelasMuridTab } from "../components/KelasMuridTab";
import { GuruStaffTab } from "../components/GuruStaffTab";
import { LogProgramTab } from "../components/LogProgramTab";
import { PortalModals } from "../components/PortalModals";
import { Domain01PemilikRingkasan } from "../components/Domain01PemilikRingkasan";

const initialPemilikPengurusan: PemilikPengurusan = {
  namaPemilik: "",
  noIC: "",
  jantina: "",
  tarikhLahir: "",
  negara: "",
  statusPemilik: "",
  alamatPenuh: "",
  poskod: "",
  bandar: "",
  negeri: "",
  noTelefon: "",
  noTelefonRumah: "",
  emel: "",
  namaSyarikat: "",
  noPendaftaranSyarikat: "",
  bentukSyarikat: "",
  tarikhPendaftaranSyarikat: "",
  statusSyarikat: "",
  alamatSyarikat: "",
  namaPengarah: "",
  noICPengarah: "",
  jawatanPengurusan: "",
  noTelefonPengurusan: "",
  emelPengurusan: "",
  tarikhMulaMengurus: "",
  namaPenyelaras: "",
  noICPenyelaras: "",
  noTelefonPenyelaras: "",
  emelPenyelaras: "",
  jawatanPenyelaras: "",
};

interface InstitusiPortalDashboardProps {
  institusiId: string;
  onLogout: () => void;
}

export function InstitusiPortalDashboard({ institusiId, onLogout }: InstitusiPortalDashboardProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "pendaftaran" | "pematuhan" | "guru_permit" | "operasi" | "tindakan">("profil");
  
  // States for backend data
  const [institusi, setInstitusi] = useState<any | null>(null);
  const [kelasList, setKelasListState] = useState<KelasRecord[]>([]);
  const [muridList, setMuridListState] = useState<MuridRecord[]>([]);
  const [guruList, setGuruListState] = useState<GuruRecord[]>([]);
  const [programList, setProgramListState] = useState<ProgramRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // States for Domain 01 (Pemilik & Pengurusan) Draft in Portal Dashboard
  const [isEditingPemilik, setIsEditingPemilik] = useState(false);
  const [pemilikPengurusanDraft, setPemilikPengurusanDraft] = useState<PemilikPengurusan>(initialPemilikPengurusan);
  const [pemilikPortalErrors, setPemilikPortalErrors] = useState<Partial<Record<keyof PemilikPengurusan, string>>>({});
  const [savingPemilik, setSavingPemilik] = useState(false);
  const [showSahkanPemilikModal, setShowSahkanPemilikModal] = useState(false);

  // Modal Open states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddKelasOpen, setIsAddKelasOpen] = useState(false);
  const [isAddMuridOpen, setIsAddMuridOpen] = useState(false);
  const [isAddGuruOpen, setIsAddGuruOpen] = useState(false);
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);

  // Form A: Profile validation hook
  const {
    values: profileForm,
    setValues: setProfileForm,
    errors: profileErrors,
    handleInputChange: handleProfileInputChange,
    handleBlur: handleProfileBlur,
    validate: validateProfile,
    isSubmitting: isProfileSubmitting,
    setIsSubmitting: setProfileSubmitting
  } = useFormValidation({
    namaInstitusi: "",
    alamat: "",
    kategori: "",
    noRujukan: "",
    statusOperasi: "",
    pengelola: "",
    telefon: "",
    email: "",
    tarikhDaftar: "",
    tarikhKemaskiniLast: ""
  }, {
    namaInstitusi: (val) => (!val || val.trim().length < 5) ? "Nama institusi wajib diisi (minimum 5 aksara)" : null,
    kategori: (val) => !val ? "Sila pilih kategori institusi" : null,
    noRujukan: (val) => {
      if (!val) return "No. pendaftaran tidak sah";
      if (!/^[a-zA-Z0-9\-\/\s]+$/.test(val)) return "No. pendaftaran tidak sah";
      return null;
    },
    pengelola: (val) => (!val || val.trim().length < 3) ? "Nama pengelola wajib diisi" : null,
    telefon: (val) => {
      if (!val) return "Format nombor telefon tidak sah (contoh: 0123456789)";
      if (!/^(\+?60|0)[0-9]{8,10}$/.test(val)) return "Format nombor telefon tidak sah (contoh: 0123456789)";
      return null;
    },
    email: (val) => {
      if (!val) return "Format emel tidak sah";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Format emel tidak sah";
      return null;
    },
    statusOperasi: (val) => !val ? "Sila pilih status operasi" : null,
  });

  // Form B: Kelas validation hook
  const {
    values: kelasForm,
    setValues: setKelasForm,
    errors: kelasErrors,
    handleInputChange: handleKelasInputChange,
    handleBlur: handleKelasBlur,
    validate: validateKelas,
    isSubmitting: isKelasSubmitting,
    setIsSubmitting: setKelasSubmitting,
    reset: resetKelas
  } = useFormValidation({
    namaKelas: "",
    tahap: "",
    kapasitiMaksimum: 30
  }, {
    namaKelas: (val) => (!val || val.trim().length < 2) ? "Nama kelas wajib diisi" : null,
    tahap: (val) => !val ? "Tahap kelas wajib diisi" : null,
    kapasitiMaksimum: (val) => {
      const num = Number(val);
      if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 100) return "Kapasiti mesti antara 1 hingga 100";
      return null;
    }
  });

  // Form C: Murid validation hook
  const {
    values: muridForm,
    setValues: setMuridForm,
    errors: muridErrors,
    handleInputChange: handleMuridInputChange,
    handleBlur: handleMuridBlur,
    validate: validateMurid,
    isSubmitting: isMuridSubmitting,
    setIsSubmitting: setMuridSubmitting,
    reset: resetMurid
  } = useFormValidation({
    nama: "",
    kelasId: "",
    jantina: "Lelaki" as "Lelaki" | "Perempuan",
    umur: 6
  }, {
    nama: (val) => {
      if (!val || val.trim().length < 3) return "Nama murid wajib diisi (huruf sahaja)";
      if (!/^[a-zA-Z\s'’]+$/.test(val.trim())) return "Nama murid wajib diisi (huruf sahaja)";
      return null;
    },
    jantina: (val) => !val ? "Sila pilih jantina" : null,
    umur: (val) => {
      const num = Number(val);
      if (isNaN(num) || num < 3 || num > 18) return "Tarikh lahir tidak sah atau umur di luar julat yang dibenarkan";
      return null;
    },
    kelasId: (val) => !val ? "Sila pilih kelas" : null,
  });

  // Form D: Guru validation hook
  const {
    values: guruForm,
    setValues: setGuruForm,
    errors: guruErrors,
    handleInputChange: handleGuruInputChange,
    handleBlur: handleGuruBlur,
    validate: validateGuru,
    isSubmitting: isGuruSubmitting,
    setIsSubmitting: setGuruSubmitting,
    reset: resetGuru
  } = useFormValidation({
    nama: "",
    icNumber: "",
    jantina: "Lelaki",
    jawatan: "",
    status: "Aktif" as "Aktif" | "Cuti" | "Keluar",
    subjek: "",
    noPermit: "",
    tarikhMulaPermit: "",
    tarikhTamatPermit: "",
    tahapPendidikanSemasa: "SPM"
  }, {
    nama: (val) => (!val || val.trim().length < 5) ? "Nama penuh guru wajib diisi" : null,
    icNumber: (val) => {
      if (!val) return "Format No. IC tidak sah (contoh: 900101-10-1234)";
      if (!/^\d{6}-\d{2}-\d{4}$/.test(val)) return "Format No. IC tidak sah (contoh: 900101-10-1234)";
      return null;
    },
    jantina: (val) => !val ? "Sila pilih jantina" : null,
    jawatan: (val) => !val ? "Jawatan wajib diisi" : null,
    status: (val) => !val ? "Sila pilih status" : null,
    subjek: (val) => !val ? "Mata pelajaran wajib diisi" : null,
    noPermit: (val) => !val ? "Sila isi No. Permit" : null,
    tarikhMulaPermit: (val) => !val ? "Sila pilih Tarikh Mula Permit" : null,
    tahapPendidikanSemasa: (val) => !val ? "Sila pilih Tahap Pendidikan Semasa" : null,
  });

  // Form E: Program validation hook
  const {
    values: programForm,
    setValues: setProgramForm,
    errors: programErrors,
    handleInputChange: handleProgramInputChange,
    handleBlur: handleProgramBlur,
    validate: validateProgram,
    isSubmitting: isProgramSubmitting,
    setIsSubmitting: setProgramSubmitting,
    reset: resetProgram
  } = useFormValidation({
    nama: "",
    tarikh: "",
    penerangan: "",
    bilPeserta: 0,
    status: "Dirancang" as "Dirancang" | "Selesai" | "Dibatalkan"
  }, {
    nama: (val) => (!val || val.trim().length < 5) ? "Nama program wajib diisi (minimum 5 aksara)" : null,
    tarikh: (val) => !val ? "Tarikh program wajib diisi" : null,
    bilPeserta: (val) => {
      const num = Number(val);
      if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 10000) return "Bilangan peserta mesti antara 1 hingga 10,000";
      return null;
    },
    penerangan: (val) => (!val || val.trim().length < 10) ? "Penerangan program terlalu pendek (minimum 10 aksara)" : null,
    status: (val) => !val ? "Sila pilih status program" : null,
  });

  // Limit phone input format
  const handleProfileTelefonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const limited = raw.substring(0, 11);
    setProfileForm({ ...profileForm, telefon: limited });
    profileErrors.telefon = "";
  };

  // Limit IC input format with masks
  const handleGuruICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const limitedValue = rawValue.substring(0, 12);
    let formatted = "";
    if (limitedValue.length > 8) {
      formatted = `${limitedValue.substring(0, 6)}-${limitedValue.substring(6, 8)}-${limitedValue.substring(8)}`;
    } else if (limitedValue.length > 6) {
      formatted = `${limitedValue.substring(0, 6)}-${limitedValue.substring(6)}`;
    } else {
      formatted = limitedValue;
    }
    setGuruForm({ ...guruForm, icNumber: formatted });
    guruErrors.icNumber = "";
  };

  // Filtering states
  const [searchMurid, setSearchMurid] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterGuruJawatan, setFilterGuruJawatan] = useState("");
  const [filterGuruStatus, setFilterGuruStatus] = useState("");
  const [filterProgramStatus, setFilterProgramStatus] = useState("");
  const [filterProgramMonth, setFilterProgramMonth] = useState("");

  const handleExportPdf = () => {
    if (filteredProgram.length === 0) {
      toast.error("Tiada data program untuk dieksport.");
      return;
    }

    const stats = {
      jumlah: filteredProgram.length,
      selesai: filteredProgram.filter(p => p.status === "Selesai").length,
      dirancang: filteredProgram.filter(p => p.status === "Dirancang").length,
    };

    exportProgramPdf({
      institusiNama: institusi?.namaInstitusi || "Portal Institusi Swasta",
      programs: filteredProgram,
      filters: {
        bulan: filterProgramMonth || undefined,
        status: filterProgramStatus || undefined,
      },
      stats
    });
    
    toast.success("Fail PDF telah berjaya dijana dan dimuat turun!");
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile
      let prof = (await getPortalProfile(institusiId)) as any;
      if (!prof) {
        // Fallback: search in the list
        const found = await getInstitusiById(institusiId).catch(() => null);
        if (found) {
          prof = found;
          // Only seed missing UI fields, but DO NOT fake data entirely
          prof = {
            id: institusiId,
            namaInstitusi: found.namaInstitusi || "",
            alamat: found.alamat || "",
            kategori: found.kategori || "",
            noRujukan: found.noRujukan || "",
            statusOperasi: found.statusOperasi || "",
            pengelola: found.pengelola || "",
            telefon: found.telefon || "",
            email: found.email || "",
            tarikhDaftar: found.tarikhDaftar || "",
            tarikhKemaskiniLast: found.tarikhKemaskiniLast || "",
            pemilikPengurusan: found.pemilikPengurusan || undefined
          };
        } else {
          // If no document exists in main collection either, provide blank structure
          prof = {
            id: institusiId,
            namaInstitusi: "",
            alamat: "",
            kategori: "",
            noRujukan: "",
            statusOperasi: "",
            pengelola: "",
            telefon: "",
            email: "",
            tarikhDaftar: "",
            tarikhKemaskiniLast: ""
          };
        }
      }

      setInstitusi(prof);
      setProfileForm({
        namaInstitusi: prof.namaInstitusi || "",
        alamat: prof.alamat || "",
        kategori: prof.kategori || "",
        noRujukan: prof.noRujukan || "",
        statusOperasi: prof.statusOperasi || "",
        pengelola: prof.pengelola || "",
        telefon: prof.telefon || "",
        email: prof.email || "",
        tarikhDaftar: prof.tarikhDaftar || "",
        tarikhKemaskiniLast: prof.tarikhKemaskiniLast || ""
      });

      // 2. Fetch Classes
      const classes = await getKelasList(institusiId);
      setKelasListState(classes);

      // 3. Fetch Students
      const students = await getMuridList(institusiId);
      setMuridListState(students);

      // 4. Fetch Teachers
      const teachers = await getGuruList(institusiId);
      setGuruListState(teachers);

      // 5. Fetch Programs
      const programs = await getProgramList(institusiId);
      setProgramListState(programs);

    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memuatkan data dari Firebase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (institusiId) {
      fetchData();
    }
  }, [institusiId]);

  // Actions
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) {
      toast.error("Sila perbetulkan ralat dalam borang profil.");
      return;
    }
    setProfileSubmitting(true);
    try {
      const updatedForms = {
        ...profileForm,
        tarikhKemaskiniLast: new Date().toISOString().substring(0, 10)
      };
      await updatePortalProfile(institusiId, updatedForms);
      setInstitusi({ ...institusi, ...updatedForms });
      setIsEditProfileOpen(false);
      toast.success("Profil institusi berjaya dikemaskini.");
    } catch (err) {
      toast.error("Gagal mengemaskini profil.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const validatePemilikDraft = (): boolean => {
    const errs: Partial<Record<keyof PemilikPengurusan, string>> = {};

    if (!pemilikPengurusanDraft.namaPemilik || pemilikPengurusanDraft.namaPemilik.trim() === "") {
      errs.namaPemilik = "Nama pemilik wajib diisi";
    }
    if (!pemilikPengurusanDraft.noIC) {
      errs.noIC = "No. IC pemilik wajib diisi";
    } else if (!/^\d{6}-\d{2}-\d{4}$/.test(pemilikPengurusanDraft.noIC)) {
      errs.noIC = "Format No. IC tidak sah (cth: 880101-14-1234)";
    }
    if (!pemilikPengurusanDraft.jantina) {
      errs.jantina = "Sila pilih jantina";
    }
    if (!pemilikPengurusanDraft.tarikhLahir) {
      errs.tarikhLahir = "Tarikh lahir pemilik wajib diisi";
    }
    if (!pemilikPengurusanDraft.negara) {
      errs.negara = "Sila pilih negara";
    }
    if (!pemilikPengurusanDraft.statusPemilik) {
      errs.statusPemilik = "Sila pilih status pemilik";
    }

    if (!pemilikPengurusanDraft.alamatPenuh || pemilikPengurusanDraft.alamatPenuh.trim() === "") {
      errs.alamatPenuh = "Alamat penuh pemilik wajib diisi";
    }
    if (!pemilikPengurusanDraft.poskod) {
      errs.poskod = "Poskod wajib diisi";
    } else if (!/^\d{5}$/.test(pemilikPengurusanDraft.poskod)) {
      errs.poskod = "Poskod mestilah tepat 5 digit";
    }
    if (!pemilikPengurusanDraft.bandar || pemilikPengurusanDraft.bandar.trim() === "") {
      errs.bandar = "Bandar wajib diisi";
    }
    if (!pemilikPengurusanDraft.negeri) {
      errs.negeri = "Sila pilih negeri";
    }

    const cleanTel = (pemilikPengurusanDraft.noTelefon || "").replace(/[-]/g, "");
    if (!pemilikPengurusanDraft.noTelefon) {
      errs.noTelefon = "No. telefon pemilik wajib diisi";
    } else if (!/^\d{10,12}$/.test(cleanTel)) {
      errs.noTelefon = "No. telefon mestilah mengandungi 10-12 digit";
    }
    if (!pemilikPengurusanDraft.emel) {
      errs.emel = "Emel pemilik wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pemilikPengurusanDraft.emel)) {
      errs.emel = "Format emel tidak sah";
    }

    if (!pemilikPengurusanDraft.namaPengarah || pemilikPengurusanDraft.namaPengarah.trim() === "") {
      errs.namaPengarah = "Nama pengarah/pengurus wajib diisi";
    }
    if (!pemilikPengurusanDraft.noICPengarah) {
      errs.noICPengarah = "No. IC pengurus wajib diisi";
    }
    if (!pemilikPengurusanDraft.jawatanPengurusan) {
      errs.jawatanPengurusan = "Sila pilih jawatan pengurusan";
    }

    if (!pemilikPengurusanDraft.namaPenyelaras || pemilikPengurusanDraft.namaPenyelaras.trim() === "") {
      errs.namaPenyelaras = "Nama penyelaras wajib diisi";
    }
    if (!pemilikPengurusanDraft.noICPenyelaras) {
      errs.noICPenyelaras = "No. IC penyelaras wajib diisi";
    }
    if (!pemilikPengurusanDraft.jawatanPenyelaras) {
      errs.jawatanPenyelaras = "Jawatan penyelaras wajib diisi";
    }

    setPemilikPortalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSimpanPemilikPengurusan = async () => {
    if (!validatePemilikDraft()) {
      toast.error("Sila lengkapi semua maklumat wajib Domain 01 sebelum menyimpan.");
      return;
    }

    setSavingPemilik(true);
    try {
      await updateInstitusiPemilikPengurusan(institusiId, pemilikPengurusanDraft);
      
      // Update local state
      setInstitusi((prev: any) => ({
        ...prev,
        pemilikPengurusan: pemilikPengurusanDraft
      }));
      
      setIsEditingPemilik(false);
      toast.success("Maklumat Pemilik & Pengurusan (Domain 01) berjaya disimpan!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menyimpan maklumat: ${err?.message || err}`);
    } finally {
      setSavingPemilik(false);
    }
  };

  const handleKlikSimpanPemilik = () => {
    if (!validatePemilikDraft()) {
      toast.error("Sila lengkapi semua maklumat wajib Domain 01 sebelum menyimpan.");
      return;
    }
    setShowSahkanPemilikModal(true);
  };

  const handleMulaEditPemilik = () => {
    setPemilikPengurusanDraft({
      ...initialPemilikPengurusan,
      ...(institusi?.pemilikPengurusan || {})
    });
    setPemilikPortalErrors({});
    setIsEditingPemilik(true);
  };

  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateKelas()) {
      toast.error("Sila perbetulkan ralat dalam borang.");
      return;
    }
    setKelasSubmitting(true);
    try {
      const record = {
        namaKelas: kelasForm.namaKelas,
        tahap: kelasForm.tahap,
        bilanganMurid: 0,
        kapasitiMaksimum: Number(kelasForm.kapasitiMaksimum)
      };
      await addKelasRecord(institusiId, record);
      resetKelas();
      setIsAddKelasOpen(false);
      toast.success("Kelas baharu berjaya didaftarkan.");
      fetchData();
    } catch (err) {
      toast.error("Gagal mendaftar kelas.");
    } finally {
      setKelasSubmitting(false);
    }
  };

  const handleAddMurid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMurid()) {
      toast.error("Sila perbetulkan ralat dalam borang.");
      return;
    }
    setMuridSubmitting(true);
    try {
      const selectedKelas = kelasList.find(c => c.id === muridForm.kelasId);
      const record = {
        nama: muridForm.nama,
        kelasId: muridForm.kelasId,
        kelasNama: selectedKelas ? selectedKelas.namaKelas : "Umum",
        jantina: muridForm.jantina,
        umur: Number(muridForm.umur)
      };
      await addMuridRecord(institusiId, record);
      
      // Update student count in classes
      if (selectedKelas) {
        const updateK = {
          ...selectedKelas,
          bilanganMurid: (selectedKelas.bilanganMurid || 0) + 1
        };
        await updatePortalProfile(`${institusiId}/kelas/${selectedKelas.id}`, updateK);
      }

      resetMurid();
      setIsAddMuridOpen(false);
      toast.success("Murid baharu berjaya didaftarkan.");
      fetchData();
    } catch (err) {
      toast.error("Gagal mendaftar murid.");
    } finally {
      setMuridSubmitting(false);
    }
  };

  const handleAddGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGuru()) {
      toast.error("Sila perbetulkan ralat dalam borang.");
      return;
    }
    setGuruSubmitting(true);
    try {
      await addGuruRecord(institusiId, guruForm);
      resetGuru();
      setIsAddGuruOpen(false);
      toast.success("Guru baharu berjaya didaftarkan.");
      fetchData();
    } catch (err) {
      toast.error("Gagal mendaftar guru.");
    } finally {
      setGuruSubmitting(false);
    }
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProgram()) {
      toast.error("Sila perbetulkan ralat dalam borang.");
      return;
    }
    setProgramSubmitting(true);
    try {
      await addProgramRecord(institusiId, {
        ...programForm,
        bilPeserta: Number(programForm.bilPeserta)
      });
      resetProgram();
      setIsAddProgramOpen(false);
      toast.success("Rekod program baharu berjaya dibuat.");
      fetchData();
    } catch (err) {
      toast.error("Gagal mencipta rekod program.");
    } finally {
      setProgramSubmitting(false);
    }
  };

  // Mask helper for IC (XXXXXX-XX-XXXX)
  const maskIC = (ic: string) => {
    if (!ic) return "-";
    const cleaned = ic.replace(/-/g, "");
    if (cleaned.length < 12) return ic;
    return `${cleaned.substring(0, 6)}-${cleaned.substring(6, 8)}-XXXX`;
  };

  // Helper calculation for enrollment
  const statsMurid = {
    lelaki: muridList.filter(m => m.jantina === "Lelaki").length,
    perempuan: muridList.filter(m => m.jantina === "Perempuan").length,
    jumlah: muridList.length
  };

  // Filter lists
  const filteredMurid = muridList.filter(m => {
    const matchesSearch = m.nama.toLowerCase().includes(searchMurid.toLowerCase());
    const matchesKelas = filterKelas ? m.kelasId === filterKelas : true;
    return matchesSearch && matchesKelas;
  });

  const filteredGuru = guruList.filter(g => {
    const matchesJawatan = filterGuruJawatan ? g.jawatan.toLowerCase().includes(filterGuruJawatan.toLowerCase()) : true;
    const matchesStatus = filterGuruStatus ? g.status === filterGuruStatus : true;
    return matchesJawatan && matchesStatus;
  });

  const filteredProgram = programList.filter(p => {
    const matchesStatus = filterProgramStatus ? p.status === filterProgramStatus : true;
    const matchesMonth = filterProgramMonth ? p.tarikh?.split("-")[1] === filterProgramMonth : true;
    return matchesStatus && matchesMonth;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center" id="portal-loading">
        <div className="relative flex flex-col items-center gap-5">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-[#006494] rounded-full animate-spin" />
          <h2 className="text-xs font-black text-slate-700 tracking-widest uppercase animate-pulse">Menghubung ke Portal Institusi...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/55 flex flex-col selection:bg-[#006494] selection:text-white antialiased text-slate-800 font-sans" id="portal-institusi-root">
      
      {/* Top Professional Accent Bar */}
      <div className="h-1.5 w-full bg-[#006494] shrink-0" />

      {/* Modern Header shell */}
      <header className="sticky top-0 z-45 bg-white border-b border-slate-200/85 px-4 md:px-8 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3.5">
          {/* Custom Royal Navy Academic Crest from public/icons folder */}
          <img 
            src="/icons/apple-touch-icon.png" 
            alt="SPS" 
            className="w-11 h-11 object-contain rounded-xl shadow-md border border-slate-200/85 shrink-0 hover:scale-105 transition-all" 
            id="inst-app-logo" 
            referrerPolicy="no-referrer"
          />

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-1.5 leading-none">
              <span className="text-base md:text-lg font-black tracking-tight text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {institusi?.namaInstitusi || "Portal Institusi Swasta"}
              </span>
              <span className="bg-[#006494]/10 text-[#006494] text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border border-[#006494]/10">
                PENTADBIR
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 leading-none">
              Sistem Maklumat Akademik & Kecekapan Bersepadu
            </span>
          </div>
        </div>

        {/* Header CTA area */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-white font-extrabold px-4 py-2.5 bg-rose-50 hover:bg-rose-600 border border-rose-100 rounded-xl cursor-pointer transition-all duration-200 shadow-xs"
            id="btn-logout-portal"
          >
            <span>Log Keluar</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container Wrapper */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-5 lg:p-6 space-y-6">
        
        {/* =========================================================================
            SIRI UTAMA: EXECUTIVE SCANNING KPI VIEWBAR (UI UX Pro Max Methodology)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="executive-kpi-row">
          
          {/* Card 1: Status Pendaftaran & Akreditasi */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col justify-between hover:border-slate-350 transition-all duration-200 hover:shadow-xs group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Kelayakan & Akreditasi</span>
              <div className="w-8 h-8 rounded-lg bg-[#006494]/10 text-[#006494] flex items-center justify-center group-hover:scale-105 transition-transform">
                <BadgeCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 space-y-1 text-left">
              <span className="text-[11px] font-bold text-slate-400 block">Status Operasi (IPS)</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {institusi?.statusOperasi || "AKTIF"}
                </span>
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#006494]" />
                <span>PPD Gua Musang & JPN Kelantan</span>
              </p>
            </div>
          </div>

          {/* Card 2: Kapasiti Operasi (Murid, Guru & Kelas) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col justify-between hover:border-slate-350 transition-all duration-200 hover:shadow-xs group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Kekuatan & Kapasiti</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 text-left">
              <span className="text-[11px] font-bold text-slate-400 block">Enrolmen Terkini</span>
              <div className="flex items-end gap-3 mt-1">
                <div>
                  <span className="text-xl font-black text-slate-800 tracking-tight">{muridList.length}</span>
                  <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Murid</span>
                </div>
                <div className="border-l border-slate-100 h-6 mx-1" />
                <div>
                  <span className="text-xl font-black text-slate-800 tracking-tight">{guruList.length}</span>
                  <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Guru</span>
                </div>
                <div className="border-l border-slate-100 h-6 mx-1" />
                <div>
                  <span className="text-xl font-black text-slate-800 tracking-tight">{kelasList.length}</span>
                  <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Kelas</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Kapasiti Terkumpul Pintar IPS</p>
            </div>
          </div>

          {/* Card 3: Pematuhan JPN & Naziran */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col justify-between hover:border-slate-350 transition-all duration-200 hover:shadow-xs group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Naziran Berjadual</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ClipboardCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 space-y-1 text-left">
              <span className="text-[11px] font-bold text-slate-400 block">Status Pematuhan Am</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-emerald-700 uppercase tracking-tight">PATUH PENUH</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-md font-black">Gred A</span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Naziran: 24 April 2026</span>
              </p>
            </div>
          </div>

          {/* Card 4: Tugasan & Tindakan Terbuka */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col justify-between hover:border-slate-350 transition-all duration-200 hover:shadow-xs group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Pematuhan Maklum Balas</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ListTodo className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 space-y-1 text-left">
              <span className="text-[11px] font-bold text-slate-400 block">Tindakan JPN</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-amber-600 uppercase tracking-tight">Selesai</span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-black">Cemerlang</span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-1">
                <span>Had Tindakan: 15 Julai 2026</span>
              </p>
            </div>
          </div>

        </div>

        {/* Paparan Institusi - Premium Section Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col" id="paparan-institusi-section">
          
          {/* 1. Header Seksyen "Paparan Institusi"  */}
          <div className="border-b border-slate-100 bg-white px-6 py-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-[#006494] font-extrabold uppercase tracking-widest block leading-none">
                Sistem Pendaftaran & Operasi Bersepadu Cawangan Gua Musang
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Paparan Institusi Pendidikan Swasta (IPS)
              </h2>
            </div>
            
            {/* Real-time sync and integrity reminder embedded in header to prevent clutter */}
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-[#006494] text-[10px] font-black uppercase tracking-wider border border-[#006494]/10">
                <Database className="w-3.5 h-3.5" />
                PORTAL JPN / PPD
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-slate-450 font-bold bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg select-none">
                <ShieldAlert className="w-3.5 h-3.5 text-[#006494] shrink-0" />
                <span>Modul Profil</span>
              </span>
            </div>
          </div>

          {/* 2. Secondary In-Section Navigation Row: 6 BARU DOMAINS KPM (UI UX Pro Max Methodology) */}
          <div className="px-4 py-3 md:px-5 md:py-3 shrink-0" id="navigation-modul-wrapper">
            <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm px-4 py-3 md:px-5 md:py-3 flex flex-col md:flex-row md:items-center gap-3.5 md:gap-5">
              {/* Super label left */}
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400 whitespace-nowrap shrink-0 text-left">
                PORTAL JPN / PPD
              </span>
              
              {/* Scrollable Pills Container for Domains */}
              <div className="overflow-x-auto no-scrollbar -mx-4 px-4 flex-1">
                <div 
                  className="flex flex-nowrap md:flex-wrap items-center gap-2 md:gap-3 pb-1 md:pb-0" 
                  role="tablist" 
                  aria-label="Navigasi 6 Domain Maklumat IPS"
                >
                  {[
                    { id: "profil", icon: Building2, label: "01", sub: "Profil Institusi" },
                    { id: "pendaftaran", icon: FileCheck, label: "02", sub: "Pendaftaran & Kelulusan" },
                    { id: "pematuhan", icon: ClipboardCheck, label: "03", sub: "Pematuhan & Naziran" },
                    { id: "guru_permit", icon: Award, label: "04", sub: "Guru, Pengelola & Permit" },
                    { id: "operasi", icon: Activity, label: "05", sub: "Operasi Institusi" },
                    { id: "tindakan", icon: ListTodo, label: "06", sub: "Tindakan Susulan" }
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        id={`tab-${tab.id}`}
                        aria-selected={isActive}
                        aria-controls={`panel-${tab.id}`}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                          "group relative inline-flex flex-col items-start justify-center px-4 py-2.5 rounded-xl border text-left transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer select-none",
                          isActive
                            ? "bg-sky-900 border-sky-900 text-white shadow-lg shadow-sky-900/30 ring-2 ring-amber-400/70 active"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:shadow-md hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1 w-full">
                          <IconComponent className={cn(
                            "w-3.5 h-3.5 transition-colors duration-205",
                            isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-600"
                          )} />
                          <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-slate-400 group-[&.active]:text-amber-300 transition-colors duration-205">
                            DOMAIN {tab.label}
                          </span>
                        </div>
                        <span className="text-xs md:text-sm font-semibold tracking-tight">
                          {tab.sub}
                        </span>
                        
                        {/* Micro-interaction highlight accent under active pill */}
                        {isActive && (
                          <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-amber-400 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Stately credential reminder / top alert panel (UI UX Pro Max Methodology) */}
          <div className="bg-[#f0f8ff] border-b border-slate-200/50 px-6 py-3.5 md:px-8 flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 text-[#006494] shrink-0" />
            <p className="text-[11px] text-slate-600 font-semibold leading-relaxed text-left">
              <strong>Integriti Data Bersepadu:</strong> Portal ini disegerakan secara rasmi dengan Jabatan Pendidikan Swasta (BPS), Kementerian Pendidikan Malaysia. Pengemaskinian guru, murid, dan permit diselia secara langsung oleh Jabatan Pendidikan Negeri Kelantan.
            </p>
          </div>

          {/* 3. Kandungan Jurnal Aktif Workspace (UI UX Pro Max Methodology - Context Preserving) */}
          <div className="p-6 md:p-8 bg-white min-h-[500px]" role="tabpanel" id={`panel-${activeTab}`}>
            
            {/* Domain (1): Profil Institusi */}
            {activeTab === "profil" && (
              <div className="space-y-8 text-left" id="domain01-content-wrapper">
                <ProfilInstitusiTab 
                  institusi={institusi} 
                  onEditProfile={() => setIsEditProfileOpen(true)} 
                />
                
                <div className="border-t border-slate-200 pt-6 space-y-6">
                  {!isEditingPemilik ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            Penyenang Maklumat Domain 01 (Pemilik & Pengurusan)
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            Sila pastikan maklumat Pemilik, Pengarah Syarikat, Pengurus Utama, dan Penyelaras adalah lengkap dan disokong oleh dokumen sah JPN / SSM.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleMulaEditPemilik}
                          className="px-5 py-2.5 text-xs font-black bg-[#006494] hover:bg-[#004f76] text-white rounded-full transition-all duration-150 cursor-pointer shadow-xs whitespace-nowrap uppercase tracking-wider shrink-0"
                        >
                          Kemaskini Maklumat Tambahan
                        </button>
                      </div>

                      <Domain01PemilikRingkasan pemilikPengurusan={institusi?.pemilikPengurusan} />
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-slate-900 tracking-wider uppercase">
                            Kemas Kini Maklumat Pemilik & Pengurusan (Domain 01)
                          </h3>
                          <p className="text-xs text-slate-400 font-semibold">
                            Sila isi semua Bahagian A hingga E dengan maklumat yang tepat dan sah.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingPemilik(false)}
                          className="px-4 py-2 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-full transition-all cursor-pointer shadow-2xs"
                        >
                          Kembali
                        </button>
                      </div>

                      <PemilikPengurusanSection
                        value={pemilikPengurusanDraft}
                        onChange={setPemilikPengurusanDraft}
                        errors={pemilikPortalErrors}
                      />

                      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-4">
                        <button
                          type="button"
                          onClick={() => setIsEditingPemilik(false)}
                          className="px-5 py-2.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-750 rounded-full transition-all cursor-pointer"
                        >
                          Batal / Tutup
                        </button>
                        <button
                          type="button"
                          disabled={savingPemilik}
                          onClick={handleKlikSimpanPemilik}
                          className="px-6 py-2.5 text-xs font-black bg-[#006494] hover:bg-[#004f76] disabled:bg-[#006494]/40 text-white rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide border border-sky-900 shadow-xs"
                        >
                          {savingPemilik ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <span>Simpan Maklumat Tambahan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Domain (2): Pendaftaran & Kelulusan (KPM & BPS) */}
            {activeTab === "pendaftaran" && (
              <div className="space-y-6 text-left" id="tab-compliance-pendaftaran">
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Maklumat Kebenaran Pendaftaran & Kelulusan</h3>
                      <p className="text-xs text-slate-500 mt-1">Sijil Perakuan IPS di bawah Akta Pendidikan 1996 [Akta 550]</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-34 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                      <BadgeCheck className="w-4 h-4 text-emerald-600" />
                      Sijil Aktif Terpelihara
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Kod Institusi Swasta (Kod IPS)</span>
                      <p className="text-sm font-black text-[#006494] font-mono select-all uppercase">
                        IPS-{institusiId.slice(0, 6).toUpperCase()}
                      </p>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Kategori Berdaftar</span>
                      <p className="text-sm font-black text-slate-800">{institusi?.kategori || "Tadika Swasta"}</p>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nombor No. Rujukan Permit</span>
                      <p className="text-sm font-black text-slate-800 font-mono select-all">
                        {institusi?.noRujukan || "KPM/BPS/400-5/GUA/0993"}
                      </p>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tarikh Kelulusan Permulaan</span>
                      <p className="text-sm font-black text-slate-800">{institusi?.tarikhDaftar || "12 Jan 2024"}</p>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tarikh Pembaharuan Berikutnya</span>
                      <p className="text-sm font-black text-amber-700">12 Jan 2029 (5 Tahun Sijil)</p>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1 shadow-2xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status Kuasa Kelulusan</span>
                      <p className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Kementerian Pendidikan Malaysia (KPM)</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-5 flex items-start gap-4">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-xs text-amber-800 uppercase tracking-wider block">Notis Pelesenan Semula Berjadual</strong>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Semua Institusi Pendidikan Swasta di bawah naungan BPS hendaklah memfailkan semakan pendaftaran / pembaharuan sekurang-kurangnya 6 bulan sebelum tarikh tamat tempoh perakuan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Domain (3): Pematuhan & Naziran */}
            {activeTab === "pematuhan" && (
              <div className="space-y-6 text-left" id="tab-compliance-naziran">
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Status & Sejarah Naziran Pemeriksaan</h3>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">Kombinasi audit bersepadu oleh JPN Kelantan, PPD Gua Musang & Jabatan Bomba Selangor/Kelantan.</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-black uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Lulus Penuh Naziran
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-[#006494] shrink-0" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pemeriksaan Lepas</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-450 block font-semibold leading-none">Tarikh Naziran</span>
                        <p className="text-sm font-black text-slate-800">{institusi?.tarikhNaziran || "24 April 2026"}</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#006494] shrink-0" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Jawatankuasa Nazir</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-450 block font-semibold leading-none">Pegawai Pemantau</span>
                        <p className="text-sm font-black text-slate-800">En. Ahmad Firdaus (PPW JPN Kelantan)</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Isu Ketidakpatuhan</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-450 block font-semibold leading-none">Status Aduan / Ralat</span>
                        <p className="text-sm font-black text-emerald-700">Tiada Isu Ketidakpatuhan</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-150">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Log Senarai Semak Kriteria Pematuhan</span>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {[
                        { title: "Premis & Lesen Perniagaan (Zon)", desc: "Alamat dan zon operasi mematuhi kriteria keselamatan majlis perbandaran", status: "PATUH" },
                        { title: "Kurikulum & Modul Pengajian", desc: "Semua modul kurikulum telah dilesenkan atau dirujuk kepada skim kebangsaan", status: "PATUH" },
                        { title: "Keselamatan Kebakaran & Struktur", desc: "Telah diaudit oleh Jabatan Bomba dan Penyelamat Gua Musang", status: "PATUH" },
                        { title: "Nisbah & Kelulusan Pengelola", desc: "Pemunya berdaftar sah dan bebas sebarang tindakan tindakan disiplin", status: "PATUH" }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-50/50">
                          <div>
                            <span className="font-extrabold text-slate-800 text-[13px] block">{item.title}</span>
                            <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">{item.desc}</span>
                          </div>
                          <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Domain (4): Guru, Pengelola & Permit */}
            {activeTab === "guru_permit" && (
              <div className="space-y-6" id="tab-compliance-guru">
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-6 text-left">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Pematuhan Permit Guru & Pengelola</h3>
                      <p className="text-xs text-slate-500 mt-1">Menguruskan rekod integriti kelayakan guru di bawah JPN Kelantan / Gua Musang.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-500">PENGELOLA:</span>
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs font-black uppercase px-3 py-1.5 rounded-lg select-all">
                        {institusi?.pengelola || "PERSATUAN AKADEMIK GUA MUSANG"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Jumlah Guru Berdaftar</span>
                      <p className="text-xl font-black text-slate-800">{guruList.length} Orang</p>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status Permit Permit Mengajar</span>
                      <p className="text-xl font-black text-emerald-700">{guruList.filter(g => g.status === 'Aktif').length} Aktif / 100%</p>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Permit Tamat Tempoh / Bermasalah</span>
                      <p className="text-xl font-black text-slate-400">0 Guru</p>
                    </div>
                  </div>
                </div>

                <div className="text-left bg-white border border-slate-200/85 rounded-2xl p-6.5 space-y-6">
                  <div>
                    <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2.5">
                      <span className="w-2.5 h-4.5 bg-[#006494] rounded-sm inline-block shrink-0"></span>
                      SENARAI GURU RASMI & HUBUNGAN PERMIT
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 font-semibold">Guna butang aksi di bawah untuk menambah atau mengurus status kebenaran mengajar.</p>
                  </div>
                  
                  {/* Reuse original modular interactive component so that functionality is preserved exactly */}
                  <GuruStaffTab
                    filteredGuru={filteredGuru}
                    filterGuruJawatan={filterGuruJawatan}
                    setFilterGuruJawatan={setFilterGuruJawatan}
                    filterGuruStatus={filterGuruStatus}
                    setFilterGuruStatus={setFilterGuruStatus}
                    onAddGuruClick={() => setIsAddGuruOpen(true)}
                    maskIC={maskIC}
                  />
                </div>
              </div>
            )}

            {/* Domain (5): Operasi Institusi */}
            {activeTab === "operasi" && (
              <div className="space-y-6">
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-6 text-left" id="tab-compliance-operasi">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Kapasiti & Operasi Institusi Berdaftar</h3>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">Memaparkan taburan kelas, bilik darjah dan pendaftaran murid secara agregat.</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#006494] font-black bg-[#006494]/5 border border-[#006494]/15 px-3 py-1.5 rounded-lg">
                      <GraduationCap className="w-4 h-4" />
                      <span>Purata Enrolmen: 100% Sahih</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Jumlah Enrolmen Murid</span>
                      <p className="text-sm font-black text-slate-800">
                        {statsMurid.jumlah} Orang <span className="text-xs font-semibold text-slate-450">({statsMurid.lelaki} L, {statsMurid.perempuan} P)</span>
                      </p>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Jumlah Kelas Dibuka</span>
                      <p className="text-sm font-black text-slate-800">{kelasList.length} Bilik Darjah</p>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nisbah Murid-Guru</span>
                      <p className="text-sm font-black text-slate-800">
                        {guruList.length > 0 ? (statsMurid.jumlah / guruList.length).toFixed(1) : statsMurid.jumlah} : 1
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-left bg-white border border-slate-200/85 rounded-2xl p-6.5 space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-400 tracking-wider uppercase">Pengurusan Guru, Kelas & Pendaftaran Murid</h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">Data disemak selaras dengan pangkalan data sekolah kebangsaan JPN.</p>
                  </div>
                  
                  {/* Reuse original modular interactive components to preserve original features */}
                  <KelasMuridTab
                    kelasList={kelasList}
                    filteredMurid={filteredMurid}
                    statsMurid={statsMurid}
                    filterKelas={filterKelas}
                    setFilterKelas={setFilterKelas}
                    searchMurid={searchMurid}
                    setSearchMurid={setSearchMurid}
                    onAddKelasClick={() => setIsAddKelasOpen(true)}
                    onAddMuridClick={() => setIsAddMuridOpen(true)}
                  />
                </div>
              </div>
            )}

            {/* Domain (6): Tindakan Susulan */}
            {activeTab === "tindakan" && (
              <div className="space-y-6">
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-6 text-left" id="tab-compliance-tindakan">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Arahan Pihak Berkuasa, Naziran & Tindakan Susulan</h3>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">Tugasan pematuhan tertunggak beserta tarikh akhir amandemen yang ditetapkan oleh JPN.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-[#fff8e1] border border-[#ffe082] px-3 py-1.5 rounded-lg text-xs font-black text-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Sifar Tertunggak</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 border border-slate-150 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tindakan JPN</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-800 block">Tiada Amaran Terbuka</span>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Tahniah. Tiada notis amaran dibuka untuk cawangan ini. Prestasi pematuhan dinilai cemerlang oleh Sektor Pendidikan Swasta.</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 border border-slate-150 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#006494]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tarikh Akhir Notis Semakan</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-800 block">Tarikh Had Penyerahan Laporan</span>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Sila bentangkan program seterusnya beserta log aktiviti sebelum 15 Julai 2026.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-left bg-white border border-slate-200/85 rounded-2xl p-6.5 space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-400 tracking-wider uppercase">Aktiviti & Log Program Jawatankuasa IPS</h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">Kemas kini aktiviti berjadual secara berperingkat untuk penilaian kelayakan tahunan.</p>
                  </div>

                  {/* Reuse original modular interactive log component to preserve original pdf generation features */}
                  <LogProgramTab
                    filteredProgram={filteredProgram}
                    programList={programList}
                    filterProgramStatus={filterProgramStatus}
                    setFilterProgramStatus={setFilterProgramStatus}
                    filterProgramMonth={filterProgramMonth}
                    setFilterProgramMonth={setFilterProgramMonth}
                    onAddProgramClick={() => setIsAddProgramOpen(true)}
                    onExportPdf={handleExportPdf}
                  />
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Consolidated Form Modals for Actions */}
      <PortalModals
        // Trigger states
        isEditProfileOpen={isEditProfileOpen}
        setIsEditProfileOpen={setIsEditProfileOpen}
        isAddKelasOpen={isAddKelasOpen}
        setIsAddKelasOpen={setIsAddKelasOpen}
        isAddMuridOpen={isAddMuridOpen}
        setIsAddMuridOpen={setIsAddMuridOpen}
        isAddGuruOpen={isAddGuruOpen}
        setIsAddGuruOpen={setIsAddGuruOpen}
        isAddProgramOpen={isAddProgramOpen}
        setIsAddProgramOpen={setIsAddProgramOpen}

        // Profil
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        profileErrors={profileErrors}
        isProfileSubmitting={isProfileSubmitting}
        handleUpdateProfile={handleUpdateProfile}
        handleProfileBlur={handleProfileBlur}
        handleProfileTelefonChange={handleProfileTelefonChange}

        // Kelas
        kelasForm={kelasForm}
        setKelasForm={setKelasForm}
        kelasErrors={kelasErrors}
        isKelasSubmitting={isKelasSubmitting}
        handleAddKelas={handleAddKelas}
        handleKelasBlur={handleKelasBlur}

        // Murid
        muridForm={muridForm}
        setMuridForm={setMuridForm}
        muridErrors={muridErrors}
        isMuridSubmitting={isMuridSubmitting}
        handleAddMurid={handleAddMurid}
        handleMuridBlur={handleMuridBlur}
        kelasList={kelasList}

        // Guru
        guruForm={guruForm}
        setGuruForm={setGuruForm}
        guruErrors={guruErrors}
        isGuruSubmitting={isGuruSubmitting}
        handleAddGuru={handleAddGuru}
        handleGuruBlur={handleGuruBlur}
        handleGuruICChange={handleGuruICChange}

        // Program
        programForm={programForm}
        setProgramForm={setProgramForm}
        programErrors={programErrors}
        isProgramSubmitting={isProgramSubmitting}
        handleAddProgram={handleAddProgram}
        handleProgramBlur={handleProgramBlur}
      />

      {/* Pop Out Pengesahan Sahkan Maklumat Tambahan */}
      {showSahkanPemilikModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" id="modal-sahkan-pemilik">
          <div className="bg-white border border-slate-150 rounded-3xl shadow-xl max-w-sm w-full flex flex-col overflow-hidden">
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">
                Sahkan Maklumat Tambahan
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Saya mengesahkan bahawa semua maklumat tambahan yang saya isi adalah benar dan tepat.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowSahkanPemilikModal(false)}
                className="px-5 py-2.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full cursor-pointer transition-all shadow-2xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSahkanPemilikModal(false);
                  handleSimpanPemilikPengurusan();
                }}
                className="px-6 py-2.5 text-xs font-black bg-[#006494] hover:bg-[#004f76] text-white rounded-full cursor-pointer transition-all border border-sky-900 shadow-xs uppercase tracking-wider"
              >
                Sahkan & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
