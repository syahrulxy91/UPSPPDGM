import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  Briefcase, 
  Calendar, 
  LogOut, 
  ShieldAlert, 
  Clock,
  Landmark
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
import { getInstitusiList } from "../../institusi/services/institusiService";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";

// UI/UX Pro Max Modular Components
import { ProfilInstitusiTab } from "../components/ProfilInstitusiTab";
import { KelasMuridTab } from "../components/KelasMuridTab";
import { GuruStaffTab } from "../components/GuruStaffTab";
import { LogProgramTab } from "../components/LogProgramTab";
import { PortalModals } from "../components/PortalModals";

interface InstitusiPortalDashboardProps {
  institusiId: string;
  onLogout: () => void;
}

export function InstitusiPortalDashboard({ institusiId, onLogout }: InstitusiPortalDashboardProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "kelas" | "guru" | "program">("profil");
  
  // States for backend data
  const [institusi, setInstitusi] = useState<any | null>(null);
  const [kelasList, setKelasListState] = useState<KelasRecord[]>([]);
  const [muridList, setMuridListState] = useState<MuridRecord[]>([]);
  const [guruList, setGuruListState] = useState<GuruRecord[]>([]);
  const [programList, setProgramListState] = useState<ProgramRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
    kategori: "tadika swasta",
    noRujukan: "",
    statusOperasi: "aktif",
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
    jawatan: "",
    subjek: "",
    status: "Aktif" as "Aktif" | "Cuti" | "Keluar"
  }, {
    nama: (val) => (!val || val.trim().length < 5) ? "Nama penuh guru wajib diisi" : null,
    icNumber: (val) => {
      if (!val) return "Format No. IC tidak sah (contoh: 900101-10-1234)";
      if (!/^\d{6}-\d{2}-\d{4}$/.test(val)) return "Format No. IC tidak sah (contoh: 900101-10-1234)";
      return null;
    },
    jawatan: (val) => !val ? "Jawatan guru wajib diisi" : null,
    subjek: (val) => !val ? "Mata pelajaran wajib diisi" : null,
    status: (val) => !val ? "Sila pilih status guru" : null,
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
        // Fallback: search in the list of PPDGM institutions
        const listAll = await getInstitusiList().catch(() => []);
        const found = listAll.find(i => i.id === institusiId);
        if (found) {
          prof = found;
          // Seed back into specific profil document
          await updatePortalProfile(institusiId, {
            namaInstitusi: found.namaInstitusi || "Institusi Pendidikan Swasta",
            alamat: found.alamat || "Gua Musang, Kelantan",
            kategori: found.kategori || "tadika swasta",
            noRujukan: found.noRujukan || "KPM/SW/001",
            statusOperasi: found.statusOperasi || "aktif",
            pengelola: found.pengelola || "Pengetua Cemerlang",
            telefon: found.telefon || "019-XXXXXXX",
            email: found.email || "institusi.swasta@gmail.com",
            tarikhDaftar: found.tarikhDaftar || "2024-01-10",
            tarikhKemaskiniLast: new Date().toISOString().substring(0, 10)
          });
          prof = {
            id: institusiId,
            namaInstitusi: found.namaInstitusi,
            alamat: found.alamat,
            kategori: found.kategori,
            noRujukan: found.noRujukan,
            statusOperasi: found.statusOperasi,
            pengelola: found.pengelola,
            telefon: found.telefon,
            email: found.email || "institusi.swasta@gmail.com",
            tarikhDaftar: found.tarikhDaftar,
            tarikhKemaskiniLast: new Date().toISOString().substring(0, 10)
          };
        } else {
          // Absolute mock default seeds if not found at all
          const tempProf = {
            namaInstitusi: "Tadika Seri Bestari Gua Musang",
            alamat: "Kelab Lama, 18300 Gua Musang, Kelantan",
            kategori: "tadika swasta",
            noRujukan: "SMUD/IP/6002-12-GM",
            statusOperasi: "aktif",
            pengelola: "Puan Noor Hazimah binti Awang",
            telefon: "013-9458294",
            email: "seribestari.gm@moe-dl.edu.my",
            tarikhDaftar: "2025-02-15",
            tarikhKemaskiniLast: "2026-06-01"
          };
          await updatePortalProfile(institusiId, tempProf);
          prof = { id: institusiId, ...tempProf };
        }
      }

      setInstitusi(prof);
      setProfileForm({
        namaInstitusi: prof.namaInstitusi || "",
        alamat: prof.alamat || "",
        kategori: prof.kategori || "tadika swasta",
        noRujukan: prof.noRujukan || "",
        statusOperasi: prof.statusOperasi || "aktif",
        pengelola: prof.pengelola || "",
        telefon: prof.telefon || "",
        email: prof.email || "institusi.swasta@gmail.com",
        tarikhDaftar: prof.tarikhDaftar || "2025-01-01",
        tarikhKemaskiniLast: prof.tarikhKemaskiniLast || new Date().toISOString().substring(0, 10)
      });

      // 2. Fetch Classes
      let classes = await getKelasList(institusiId);
      if (classes.length === 0) {
        // Seed default classes
        const defaultClasses: Omit<KelasRecord, "id">[] = [
          { namaKelas: "Pintar A", tahap: "Umur 5 Tahun", bilanganMurid: 15 },
          { namaKelas: "Cemerlang B", tahap: "Umur 6 Tahun", bilanganMurid: 18 },
          { namaKelas: "Wawasan C", tahap: "Umur 4 Tahun", bilanganMurid: 10 }
        ];
        for (const c of defaultClasses) {
          await addKelasRecord(institusiId, c);
        }
        classes = await getKelasList(institusiId);
      }
      setKelasListState(classes);

      // 3. Fetch Students
      let students = await getMuridList(institusiId);
      if (students.length === 0 && classes.length > 0) {
        const defaultStudents: Omit<MuridRecord, "id">[] = [
          { nama: "Ahmad Afiq bin Md Sukor", kelasId: classes[0].id, kelasNama: classes[0].namaKelas, jantina: "Lelaki", umur: 5 },
          { nama: "Siti Sarah binti Mohd Ali", kelasId: classes[0].id, kelasNama: classes[0].namaKelas, jantina: "Perempuan", umur: 5 },
          { nama: "Muhammad Darwisy bin Zaki", kelasId: classes[1].id, kelasNama: classes[1].namaKelas, jantina: "Lelaki", umur: 6 },
          { nama: "Nur Damia Humaira binti Yusuf", kelasId: classes[1].id, kelasNama: classes[1].namaKelas, jantina: "Perempuan", umur: 6 },
          { nama: "Daniel Haikal bin Mustaffa", kelasId: classes[2].id, kelasNama: classes[2].namaKelas, jantina: "Lelaki", umur: 4 }
        ];
        for (const s of defaultStudents) {
          await addMuridRecord(institusiId, s);
        }
        students = await getMuridList(institusiId);
      }
      setMuridListState(students);

      // 4. Fetch Teachers
      let teachers = await getGuruList(institusiId);
      if (teachers.length === 0) {
        const defaultTeachers: Omit<GuruRecord, "id">[] = [
          { nama: "Fatimah Zahra Razali", icNumber: "940502-03-5120", jawatan: "Guru Besar", subjek: "Fardhu Ain / Matematik", status: "Aktif" },
          { nama: "Roslina binti Mat Ripin", icNumber: "891112-29-5564", jawatan: "Penolong Kanan", subjek: "Bahasa Melayu & Seni", status: "Aktif" },
          { nama: "Muhammad Syamil bin Azizi", icNumber: "960105-03-6051", jawatan: "Guru Kelas", subjek: "Bahasa Inggeris", status: "Cuti" }
        ];
        for (const t of defaultTeachers) {
          await addGuruRecord(institusiId, t);
        }
        teachers = await getGuruList(institusiId);
      }
      setGuruListState(teachers);

      // 5. Fetch Programs
      let programs = await getProgramList(institusiId);
      if (programs.length === 0) {
        const defaultPrograms: Omit<ProgramRecord, "id">[] = [
          { nama: "Sambutan Hari Sukaneka Tadika 2026", tarikh: "2026-05-12", penerangan: "Aktiviti riadah sukaneka tahunan murid bersama ibu bapa.", bilPeserta: 80, status: "Selesai" },
          { nama: "Program Celik Quran & Iqra", tarikh: "2026-07-20", penerangan: "Siri bengkel membaca Iqra dengan sebutan makhraj yang betul.", bilPeserta: 40, status: "Dirancang" },
          { nama: "Lawatan Sambil Belajar ke Zoo Negara", tarikh: "2026-09-05", penerangan: "Aktiviti lawatan luaran untuk pendedahan habitat haiwan liar.", bilPeserta: 55, status: "Dirancang" }
        ];
        for (const p of defaultPrograms) {
          await addProgramRecord(institusiId, p);
        }
        programs = await getProgramList(institusiId);
      }
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
          {/* Custom Royal Navy Academic Crest */}
          <div className="w-12 h-12 bg-gradient-to-br from-[#0c1b2a] to-[#014f76] text-white rounded-xl flex flex-col items-center justify-center font-black text-[13px] tracking-wider shadow-md hover:scale-105 transition-all relative overflow-hidden" id="inst-app-logo">
            <span className="leading-none mt-0.5">SPS</span>
            <span className="text-[7.5px] tracking-widest font-extrabold text-amber-400 mt-0.5 leading-none">PORTAL</span>
            <div className="absolute top-0 right-0 w-3 h-3 bg-amber-400 rounded-bl-full border-l border-b border-[#0c1b2a]" />
          </div>

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
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 md:p-8 gap-8">
        
        {/* Navigation Sidebar Rail */}
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col gap-1.5" id="portal-side-nav">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-3 mb-2.5 block leading-none">MODUL SISTEM</span>
            
            <button
              onClick={() => setActiveTab("profil")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-left text-xs md:text-sm font-extrabold tracking-wide transition-all border ${
                activeTab === "profil" 
                  ? "bg-[#006494] text-white border-[#004f76] shadow-sm font-black" 
                  : "text-slate-600 hover:bg-slate-50 border-transparent hover:text-[#006494]"
              }`}
              id="tab-profil"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <div className="flex flex-col">
                <span>Modul 2A</span>
                <span className={`text-[9.5px] font-bold ${activeTab === "profil" ? "text-slate-200" : "text-slate-400"}`}>Profil Institusi</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("kelas")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-left text-xs md:text-sm font-extrabold tracking-wide transition-all border ${
                activeTab === "kelas" 
                  ? "bg-[#006494] text-white border-[#004f76] shadow-sm font-black" 
                  : "text-slate-600 hover:bg-slate-50 border-transparent hover:text-[#006494]"
              }`}
              id="tab-kelas"
            >
              <Users className="w-4 h-4 shrink-0" />
              <div className="flex flex-col">
                <span>Modul 2B</span>
                <span className={`text-[9.5px] font-bold ${activeTab === "kelas" ? "text-slate-200" : "text-slate-400"}`}>Kelas & Murid</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("guru")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-left text-xs md:text-sm font-extrabold tracking-wide transition-all border ${
                activeTab === "guru" 
                  ? "bg-[#006494] text-white border-[#004f76] shadow-sm font-black" 
                  : "text-slate-600 hover:bg-slate-50 border-transparent hover:text-[#006494]"
              }`}
              id="tab-guru"
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <div className="flex flex-col">
                <span>Modul 2C</span>
                <span className={`text-[9.5px] font-bold ${activeTab === "guru" ? "text-slate-200" : "text-slate-400"}`}>Guru & Staff</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("program")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-left text-xs md:text-sm font-extrabold tracking-wide transition-all border ${
                activeTab === "program" 
                  ? "bg-[#006494] text-white border-[#004f76] shadow-sm font-black" 
                  : "text-slate-600 hover:bg-slate-50 border-transparent hover:text-[#006494]"
              }`}
              id="tab-program"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <div className="flex flex-col">
                <span>Modul 2D</span>
                <span className={`text-[9.5px] font-bold ${activeTab === "program" ? "text-slate-200" : "text-slate-400"}`}>Log Program</span>
              </div>
            </button>
          </div>

          {/* Stately credential reminder panel */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[#006494]">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider">Integriti Data Bersepadu</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Semua data murid dan guru diselaraskan secara langsung bersama PPD Gua Musang dan Jabatan Pendidikan Negeri. Sila kemas kini laporan program tahunan tepat pada masanya.
            </p>
          </div>
        </aside>

        {/* Main Content Workspace viewport */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* Module 2A: Profil Institusi */}
          {activeTab === "profil" && (
            <ProfilInstitusiTab 
              institusi={institusi} 
              onEditProfile={() => setIsEditProfileOpen(true)} 
            />
          )}

          {/* Module 2B: Enrollment Kelas & Murid */}
          {activeTab === "kelas" && (
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
          )}

          {/* Module 2C: Senarai Guru & Jawatan */}
          {activeTab === "guru" && (
            <GuruStaffTab
              filteredGuru={filteredGuru}
              filterGuruJawatan={filterGuruJawatan}
              setFilterGuruJawatan={setFilterGuruJawatan}
              filterGuruStatus={filterGuruStatus}
              setFilterGuruStatus={setFilterGuruStatus}
              onAddGuruClick={() => setIsAddGuruOpen(true)}
              maskIC={maskIC}
            />
          )}

          {/* Module 2D: Laporan Program / Aktiviti */}
          {activeTab === "program" && (
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
          )}

        </main>
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

    </div>
  );
}
