import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getBorangList, addBorangRecord, updateBorangStatus, updateBorangRecord } from "../services/borangService";
import { syncBorangToInstitusi } from "../services/borangDomain";
import { getInstitusiList, updateInstitusiRecord } from "../../institusi/services/institusiService";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { BorangRecord, BorangStatus } from "../../../types/borang";
import { InstitusiRecord } from "../../../types/institusi";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { useRole } from "../../../shared/contexts/RoleContext";
import { KpiCard } from "../../../shared/components/ui/KpiCard";
import { FilterBar, FilterField } from "../../../shared/components/ui/FilterBar";
import { StatusBadge } from "../../../shared/components/ui/StatusBadge";
import { SectionCard } from "../../../shared/components/ui/SectionCard";
import { LoadingSkeleton } from "../../../shared/components/ui/LoadingSkeleton";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { 
  Search, 
  FileText, 
  Plus, 
  RefreshCw, 
  Calendar, 
  User, 
  FileCheck, 
  ClipboardList, 
  AlertCircle, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  X, 
  Info,
  CheckCircle,
  XCircle,
  TrendingUp,
  FilePenLine,
  HelpCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { BorangFormFields, BORANG_TYPES_MAP } from "../components/BorangFormFields";
import { BorangDetailViewer } from "../components/BorangDetailViewer";
import { BORANG_METADATA_LIST } from "../constants/borangMetadata";

export default function BorangPage() {
  const { role, userEmail, permissions } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectInstId = searchParams.get("instId");

  const [borangList, setBorangList] = useState<BorangRecord[]>([]);
  const [institutions, setInstitutions] = useState<InstitusiRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal forms state
  const [isOpenRegModal, setIsOpenRegModal] = useState<boolean>(false);
  const [isOpenActionModal, setIsOpenActionModal] = useState<boolean>(false);
  const [selectedBorang, setSelectedBorang] = useState<BorangRecord | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [jenisBorangFilter, setJenisBorangFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jenisInstFilter, setJenisInstFilter] = useState("all");
  const [bulanFilter, setBulanFilter] = useState("all");

  // Registration Form State
  const [regNoRujukan, setRegNoRujukan] = useState("");
  const [regInstitusiId, setRegInstitusiId] = useState("");
  const [regJenisBorang, setRegJenisBorang] = useState("BPS_I");
  const [regTarikhKemuka, setRegTarikhKemuka] = useState(new Date().toISOString().split("T")[0]);
  const [regPegawai, setRegPegawai] = useState("Encik Ahmad Sukri Bin Ramli");
  const [regStatus, setRegStatus] = useState<BorangStatus>("dikemukakan");
  const [regCatatan, setRegCatatan] = useState("");
  const [regDetailFields, setRegDetailFields] = useState<Record<string, any>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Right Drawer & Stepper States
  const [step, setStep] = useState<number>(1);
  const [isOpenInstDropdown, setIsOpenInstDropdown] = useState<boolean>(false);
  const [instSearchQuery, setInstSearchQuery] = useState("");
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Action Form State
  const [actStatus, setActStatus] = useState<BorangStatus>("diproses");
  const [actCatatan, setActCatatan] = useState("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Auto-generate unique reference number
  const generateRefNo = () => {
    return "BPS-KPM/GM/" + Math.floor(1000 + Math.random() * 9000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const bList = await getBorangList();
      setBorangList(bList || []);
      const insts = await getInstitusiList();
      setInstitutions(insts || []);
    } catch (err: any) {
      console.error(err);
      setError("Gagal menghubungkan pangkalan data Firestore untuk memproses data Borang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedInst = useMemo(() => {
    return institutions.find(i => i.id === regInstitusiId);
  }, [institutions, regInstitusiId]);

  // Two-Way Sync Auto-Populate Logic
  useEffect(() => {
    if (selectedInst) {
      const autofill: Record<string, any> = { ...regDetailFields };
      autofill.ipsId = selectedInst.id;

      // Auto-populate based on selected institution attributes
      autofill.nama_lama = selectedInst.namaInstitusi;
      autofill.nama_sekolah = selectedInst.namaInstitusi;
      autofill.nama_ips = selectedInst.namaInstitusi;
      autofill.nama_institusi = selectedInst.namaInstitusi;

      autofill.alamat_lama = selectedInst.alamat;
      autofill.alamat_premis = selectedInst.alamat;
      autofill.alamat_sekolah = selectedInst.alamat;
      autofill.alamat_institusi = selectedInst.alamat;

      autofill.nama_pengelola = selectedInst.pengelola || "";
      autofill.nama_gb_pengetua = selectedInst.pengelola || "";
      autofill.nama_guru_besar = selectedInst.pengelola || "";
      autofill.nama_pengetua = selectedInst.pengelola || "";

      autofill.no_telefon = selectedInst.telefon || "";
      autofill.no_kelulusan_penubuhan = selectedInst.noRujukan || "";
      autofill.yuran_semasa = selectedInst.yuran_semasa || selectedInst.yuranSemasa || 1500;

      if (regJenisBorang === "BPS_IV" && !autofill.yuran_cadangan) {
        autofill.yuran_cadangan = Math.round(Number(autofill.yuran_semasa) * 1.15);
        autofill.peratus_kenaikan = "15.0";
      }

      setRegDetailFields(autofill);
    }
  }, [regInstitusiId, regJenisBorang, institutions]);

  // Prepopulate institution if query param instId is active
  useEffect(() => {
    const qParam = searchParams.get("search") || searchParams.get("q");
    if (qParam) {
      setSearchQuery(qParam);
    }
    if (selectInstId && institutions.length > 0) {
      setRegInstitusiId(selectInstId);
      setRegNoRujukan(generateRefNo());
      setRegJenisBorang("BPS_I");
      setRegDetailFields({});
      setStep(1);
      setIsOpenRegModal(true);
      // clean params
      setSearchParams({});
    }
  }, [selectInstId, institutions, searchParams]);

  // Open Registration Modal with default setup
  const handleOpenReg = () => {
    setRegNoRujukan(generateRefNo());
    if (institutions.length > 0) {
      setRegInstitusiId(institutions[0].id);
    }
    setRegJenisBorang("BPS_I");
    setRegTarikhKemuka(new Date().toISOString().split("T")[0]);
    setRegPegawai("Encik Ahmad Sukri Bin Ramli");
    setRegStatus("dikemukakan");
    setRegCatatan("");
    setRegDetailFields({});
    setStep(1);
    setUploadProgress(null);
    setUploadedUrl(null);
    setFileName(null);
    setIsOpenRegModal(true);
  };

  // Open Action Modal
  const handleOpenAction = (borang: BorangRecord) => {
    setSelectedBorang(borang);
    setActStatus(borang.status);
    setActCatatan(borang.catatan || "");
    setIsOpenActionModal(true);
  };

  // Handle Two-way synching for status updates to lulus / submit
  const handleStatusBorangChange = async (borangId: string, statusBaharu: BorangStatus) => {
    console.log("[Dev Audit] Mencetuskan penyelarasan dua hala via Domain Layer...", { borangId, statusBaharu });
    try {
      const listLatest = await getBorangList();
      const borang = listLatest.find(b => b.id === borangId);
      if (!borang) {
        console.warn("[Dev Audit] Ralat Sync: Rekod borang tidak ditemui untuk ID:", borangId);
        return;
      }

      const performer = { email: userEmail, role };
      const syncResult = await syncBorangToInstitusi(borang, statusBaharu, performer);

      if (syncResult.success) {
        toast.success(syncResult.message);
      } else {
        console.log(`[Dev Audit] Sync Selesai: ${syncResult.message}`);
      }
    } catch (err) {
      console.error("[Dev Audit] Gagal menyelaraskan rekod institusi berkaitan:", err);
      toast.error("Penyelarasan automatik ke data institusi gagal dijalankan.");
    }
  };

  // Submit New Borang Form (Simpan Draf | Kemuka Permohonan)
  const handleRegisterBorang = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleRegisterBorangWithStatus("dikemukakan");
  };

  const handleRegisterBorangWithStatus = async (targetStatus: BorangStatus) => {
    if (!regInstitusiId) {
      toast.error("Sila pilih Institusi rujukan sedia ada!");
      return;
    }

    const currentSelectedInst = institutions.find(i => i.id === regInstitusiId);
    if (!currentSelectedInst) {
      toast.error("Pilihan institusi tidak sah.");
      return;
    }

    setActionLoading(true);
    try {
      const labelText = BORANG_TYPES_MAP[regJenisBorang]?.label || regJenisBorang;
      const newRecord: Omit<BorangRecord, "id"> = {
        noRujukan: regNoRujukan || generateRefNo(),
        institusiId: regInstitusiId,
        namaInstitusi: currentSelectedInst.namaInstitusi,
        jenisBorang: labelText,
        tarikhKemuka: regTarikhKemuka || new Date().toISOString().split("T")[0],
        status: targetStatus,
        pegawai: regPegawai,
        jenisInstitusi: currentSelectedInst.kategori,
        catatan: regCatatan,
        detailFields: {
          ...regDetailFields,
          ipsId: regInstitusiId,
        },
      };

      const docSaved = await addBorangRecord(newRecord, { email: userEmail, role });
      if (docSaved && docSaved.id) {
        // Trigger sync immediately!
        await handleStatusBorangChange(docSaved.id, targetStatus);
      }

      toast.success(
        targetStatus === "draf" 
          ? "Draf permohonan borang berjaya disimpan!" 
          : "Keputusan permohonan borang berjaya dikemukakan!"
      );
      setIsOpenRegModal(false);
      resetRegisterForm();
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal mendaftar borang ke Firestore.");
    } finally {
      setActionLoading(false);
    }
  };

  const resetRegisterForm = () => {
    setRegNoRujukan(generateRefNo());
    setRegInstitusiId("");
    setRegJenisBorang("BPS_I");
    setRegTarikhKemuka(new Date().toISOString().split("T")[0]);
    setRegPegawai("Encik Ahmad Sukri Bin Ramli");
    setRegStatus("dikemukakan");
    setRegCatatan("");
    setRegDetailFields({});
    setStep(1);
    setUploadProgress(null);
    setUploadedUrl(null);
    setFileName(null);
  };

  // Submit Status Update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorang) return;

    setActionLoading(true);
    try {
      await updateBorangStatus(selectedBorang.id, actStatus, actCatatan, { email: userEmail, role });
      // Run two-way data synching
      await handleStatusBorangChange(selectedBorang.id, actStatus);
      toast.success("Status borang berjaya dikemas kini!");
      setIsOpenActionModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengemas kini status borang.");
    } finally {
      setActionLoading(false);
    }
  };

  // Extract unique elements for filtering dynamically
  const uniqueMonths = useMemo(() => {
    const list = borangList
      .map((item) => item.tarikhKemuka?.substring(0, 7))
      .filter((m): m is string => Boolean(m && m.length === 7));
    return Array.from(new Set(list)).sort().reverse();
  }, [borangList]);

  // Handle local searching and filtering
  const filteredBorang = useMemo(() => {
    return borangList.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.namaInstitusi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.noRujukan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.pegawai && item.pegawai.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesJenisBorang =
        jenisBorangFilter === "all" ||
        item.jenisBorang.toLowerCase().includes(jenisBorangFilter.toLowerCase()) ||
        Object.values(BORANG_TYPES_MAP).some((opt) => {
          return (
            opt.label.toLowerCase() === item.jenisBorang.toLowerCase() &&
            opt.kumpulan.toLowerCase().includes(jenisBorangFilter.toLowerCase())
          );
        });

      const matchesStatus =
        statusFilter === "all" ||
        item.status === statusFilter;

      const matchesJenisInst =
        jenisInstFilter === "all" ||
        item.jenisInstitusi.toLowerCase().includes(jenisInstFilter.toLowerCase());

      const matchesBulan =
        bulanFilter === "all" ||
        item.tarikhKemuka?.startsWith(bulanFilter);

      return matchesSearch && matchesJenisBorang && matchesStatus && matchesJenisInst && matchesBulan;
    });
  }, [borangList, searchQuery, jenisBorangFilter, statusFilter, jenisInstFilter, bulanFilter]);

  // Calculate summary stats dynamically based on complete borang collection (unfiltered)
  const stats = useMemo(() => {
    let aktif = 0; // draf + dikemukakan
    let diproses = 0;
    let lulus = 0;
    let tolak = 0;

    borangList.forEach(item => {
      if (item.status === "draf" || item.status === "dikemukakan") {
        aktif++;
      } else if (item.status === "diproses") {
        diproses++;
      } else if (item.status === "lulus") {
        lulus++;
      } else if (item.status === "tolak") {
        tolak++;
      }
    });

    return { aktif, diproses, lulus, tolak };
  }, [borangList]);

  // Formulate parameters to match the FilterBar child component API
  const filterFieldsConfig: FilterField[] = [
    {
      key: "jenisBorang",
      label: "Jenis Kumpulan Borang",
      value: jenisBorangFilter,
      options: [
        { label: "Semua Jenis BPS", value: "all" },
        { label: "Kump 1 - Penubuhan & Pendaftaran", value: "Kumpulan 1" },
        { label: "Kump 2 - Pas Pelajar Antarabangsa", value: "Kumpulan 2" },
        { label: "Kump 3 - Pengurusan Operasi (IPS)", value: "Kumpulan 3" },
        { label: "Kump 4 - Data & Penyelidikan", value: "Kumpulan 4" },
        { label: "Kump 5 - Resit & Pembayaran", value: "Kumpulan 5" }
      ]
    },
    {
      key: "status",
      label: "Status Borang",
      value: statusFilter,
      options: [
        { label: "Semua Status", value: "all" },
        { label: "Draf", value: "draf" },
        { label: "Dikemukakan", value: "dikemukakan" },
        { label: "Dalam Proses", value: "diproses" },
        { label: "Lulus", value: "lulus" },
        { label: "Ditolak / Semakan", value: "tolak" }
      ]
    },
    {
      key: "jenisInst",
      label: "Jenis Institusi",
      value: jenisInstFilter,
      options: [
        { label: "Semua Institusi", value: "all" },
        { label: "Tadika Swasta", value: "tadika" },
        { label: "Sekolah Swasta", value: "sekolah" },
        { label: "Pusat Tuisyen", value: "tuisyen" },
        { label: "Sekolah Antarabangsa", value: "antarabangsa" },
        { label: "Pusat Bahasa", value: "bahasa" },
        { label: "Lain-Lain", value: "lain" }
      ]
    },
    {
      key: "bulan",
      label: "Tarikh (Bulan)",
      value: bulanFilter,
      options: [
        { label: "Semua Bulan", value: "all" },
        ...uniqueMonths.map(month => {
          const [year, mVal] = month.split("-");
          const monthsMap: Record<string, string> = {
            "01": "Januari", "02": "Februari", "03": "Mac", "04": "April",
            "05": "Mei", "06": "Jun", "07": "Julai", "08": "Ogos",
            "09": "September", "10": "Oktober", "11": "November", "12": "Disember"
          };
          const text = `${monthsMap[mVal] || mVal} ${year}`;
          return { label: text, value: month };
        })
      ]
    }
  ];

  const handleFilterBarChange = (key: string, value: string) => {
    if (key === "jenisBorang") setJenisBorangFilter(value);
    else if (key === "status") setStatusFilter(value);
    else if (key === "jenisInst") setJenisInstFilter(value);
    else if (key === "bulan") setBulanFilter(value);
  };

  const getStatusBadgeProps = (status: BorangStatus) => {
    switch (status) {
      case "draf":
        return { label: "Draf", tone: "neutral" as const };
      case "dikemukakan":
        return { label: "Dikemukakan", tone: "info" as const };
      case "diproses":
        return { label: "Diproses", tone: "warning" as const };
      case "lulus":
        return { label: "Lulus", tone: "success" as const };
      case "tolak":
        return { label: "Semakan / Tolak", tone: "danger" as const };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="borang-system-root">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Modul Urusan Borang Rasmi BPS KPM"
          subtitle="Sistem penyelarasan pengemukaan dokumen, pendaftaran pengelola, permit mengajar, dan pertukaran lesen IPS."
        />
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleOpenReg}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-black bg-primary-800 hover:bg-primary-900 text-white rounded-full transition-all cursor-pointer shadow-md border border-primary-950/20"
          >
            <Plus className="w-4 h-4 text-secondary-300 font-extrabold" />
            <span>Mula Borang Baharu</span>
          </button>
        </div>
      </div>

      {/* 2. Loading State */}
      {loading && (
        <div className="space-y-6" id="borang-loading-skeleton">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
          <LoadingSkeleton rows={5} />
        </div>
      )}

      {/* 3. Error Case */}
      {!loading && error && (
        <div className="py-8" id="borang-error-fallback">
          <EmptyState title="Sistem Gagal Mewujudkan Sambungan" description={error} />
          <div className="text-center mt-4">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-black bg-primary-800 hover:bg-primary-900 text-white rounded-full shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Muat Semula Pangkalan Data
            </button>
          </div>
        </div>
      )}

      {/* 4. Display Content Success */}
      {!loading && !error && (
        <>
          {/* KPI Dashboard Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="borang-kpi-row">
            <KpiCard
              label="Borang Aktif (Draf + Kemuka)"
              value={stats.aktif}
              hint="Menanti penilaian awal pegawai"
              tone="info"
            />
            <KpiCard
              label="Borang Diproses"
              value={stats.diproses}
              hint="Sedang dalam penilaian agensi"
              tone="warning"
            />
            <KpiCard
              label="Hasil Borang Lulus"
              value={stats.lulus}
              hint="Telah disah kelulusan bertulis"
              tone="success"
            />
            <KpiCard
              label="Borang Perlu Semakan"
              value={stats.tolak}
              hint="Tolak / pindaan dokumen sokongan"
              tone="danger"
            />
          </div>

          {/* Search, Reset & Filter Area */}
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm" id="borang-filter-area">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end w-full">
              {/* Text Search Field */}
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                  Carian Borang & Nama IPS
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tulis nama institusi pendidikan swasta, nombor rujukan borang, atau nama pegawai..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 font-semibold transition-all focus:border-primary-500 focus:bg-white focus:outline-hidden placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Reset Controller */}
              {(searchQuery || jenisBorangFilter !== "all" || statusFilter !== "all" || jenisInstFilter !== "all" || bulanFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setJenisBorangFilter("all");
                    setStatusFilter("all");
                    setJenisInstFilter("all");
                    setBulanFilter("all");
                  }}
                  className="px-4 py-2.5 text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50/50 hover:bg-rose-50 border border-rose-200/40 rounded-lg cursor-pointer transition-all self-start md:self-auto uppercase tracking-wider"
                >
                  Set Semula Tapisan
                </button>
              )}
            </div>

            {/* Custom Filter Bar standard with list filter layout */}
            <FilterBar fields={filterFieldsConfig} onChange={handleFilterBarChange} />
          </div>

          {/* Results List Component */}
          <SectionCard 
            title={`Senarai Permohonan Borang BPS KPM (${filteredBorang.length} Rekod)`}
          >
            {filteredBorang.length === 0 ? (
              <div className="py-12 bg-slate-50/30 rounded-xl" id="borang-empty-view">
                <EmptyState 
                  title="Tiada Rekod Pengemukaan Borang" 
                  description="Tiada boring rasmi dijumpai sepadan dengan kriteria penapisan data semasa anda." 
                />
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto" id="borang-desktop-table">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">No. Rujukan</th>
                        <th className="py-3 px-4">Nama IPS & Kategori</th>
                        <th className="py-3 px-4">Jenis Borang</th>
                        <th className="py-3 px-4">Tarikh Kemuka</th>
                        <th className="py-3 px-4">Pegawai</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                     <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                      {filteredBorang.map((borang) => {
                        const bStatus = getStatusBadgeProps(borang.status);
                        const isExpanded = !!expandedRows[borang.id];
                        return (
                          <React.Fragment key={borang.id}>
                            <tr className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-4 px-4 font-mono text-xs text-slate-700 font-bold whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => toggleRow(borang.id)}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-primary-900 rounded font-bold transition-all focus:outline-hidden cursor-pointer"
                                >
                                  <span className="text-[9px] font-mono select-none">
                                    {isExpanded ? "▼" : "▶"}
                                  </span>
                                  <span>{borang.noRujukan}</span>
                                </button>
                              </td>
                              <td className="py-4 px-4 space-y-0.5">
                                <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                                  {borang.namaInstitusi}
                                </span>
                                <span className="text-[10px] font-mono font-bold uppercase py-0.5 px-2 bg-slate-100 rounded text-slate-500 inline-block tracking-wide">
                                  {borang.jenisInstitusi || "Tadika"}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-xs font-bold text-slate-700 max-w-[200px]">
                                {borang.jenisBorang}
                              </td>
                              <td className="py-4 px-4 text-xs text-slate-600 font-bold font-mono whitespace-nowrap">
                                {borang.tarikhKemuka || "N/A"}
                              </td>
                              <td className="py-4 px-4 text-xs text-slate-500 font-extrabold">
                                {borang.pegawai || "PPD GM"}
                              </td>
                              <td className="py-4 px-4">
                                <StatusBadge label={bStatus.label} tone={bStatus.tone} />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <button
                                  onClick={() => handleOpenAction(borang)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-primary-50 text-primary-800 border border-primary-200/55 hover:bg-primary-100 rounded-lg cursor-pointer transition-all"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-primary-700" />
                                  <span>Kemas Kini</span>
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/20">
                                <td colSpan={7} className="p-4 bg-slate-50/10 border-b border-slate-200">
                                  <div className="max-w-3xl mx-auto">
                                    <BorangDetailViewer borang={borang} />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Card List */}
                <div className="md:hidden space-y-4" id="borang-mobile-cards">
                  {filteredBorang.map((borang) => {
                    const bStatus = getStatusBadgeProps(borang.status);
                    return (
                      <div key={borang.id} className="bg-slate-50/40 border border-slate-200/70 p-4 rounded-xl space-y-3.5">
                        <div className="flex justify-between items-start border-b border-dashed border-slate-200/60 pb-2.5">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 font-mono block">NO. RUJUKAN</span>
                            <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded">{borang.noRujukan}</span>
                          </div>
                          <StatusBadge label={bStatus.label} tone={bStatus.tone} />
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{borang.namaInstitusi}</h4>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] bg-slate-200/60 text-slate-600 font-bold py-0.5 px-1.5 rounded uppercase font-mono">{borang.jenisInstitusi || "Tadika"}</span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">Kemuka: {borang.tarikhKemuka}</span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white border border-slate-200/50 rounded-lg text-xs space-y-1">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Borang:</span>
                          <p className="font-extrabold text-slate-700 leading-relaxed">{borang.jenisBorang}</p>
                        </div>

                        {borang.detailFields && Object.keys(borang.detailFields).length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => toggleRow(borang.id)}
                              className="text-primary-700 hover:text-primary-800 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1"
                            >
                              <span>{expandedRows[borang.id] ? "Tutup Butiran" : "Buka Butiran Borang"}</span>
                              <span>{expandedRows[borang.id] ? "▲" : "▼"}</span>
                            </button>
                            {expandedRows[borang.id] && (
                              <div className="mt-2 text-left">
                                <BorangDetailViewer borang={borang} />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs pt-1">
                          <span className="text-slate-500 font-bold">Penyelia: {borang.pegawai || "PPD GM"}</span>
                          <button
                            onClick={() => handleOpenAction(borang)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-primary-50 text-primary-800 border border-primary-200/55 hover:bg-primary-100 rounded-lg cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Tindakan</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </SectionCard>
        </>
      )}

      {/* 5. DRAWER KANAN: Pendaftaran Borang Baharu */}
      <AnimatePresence>
        {isOpenRegModal && (
          <div className="fixed inset-0 z-50 overflow-hidden" id="registration-borang-drawer">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsOpenRegModal(false)}
            />

            {/* Right-side Sliding Drawer Container */}
            <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200"
              >
                {/* Drawer Header */}
                <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                      <FilePenLine className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded leading-none">
                        {regJenisBorang}
                      </span>
                      <h3 className="text-sm md:text-base font-black tracking-tight leading-normal mt-1 truncate max-w-[400px]">
                        {BORANG_TYPES_MAP[regJenisBorang]?.label || regJenisBorang}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpenRegModal(false);
                      resetRegisterForm();
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Stepper Bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/50 shadow-xs">
                  {[
                    { num: 1, label: "Maklumat Asas" },
                    { num: 2, label: "Butiran Khusus" },
                    { num: 3, label: "Lampiran & Pengesahan" }
                  ].map((s) => (
                    <div key={s.num} className="flex items-center gap-2">
                      <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        step === s.num 
                          ? "bg-primary-950 text-white ring-4 ring-primary-900/10" 
                          : step > s.num 
                            ? "bg-emerald-600 text-white" 
                            : "bg-slate-100 text-slate-450 border border-slate-200"
                      }`}>
                        {step > s.num ? "✓" : s.num}
                      </div>
                      <span className={`text-[11px] font-black leading-none ${step === s.num ? "text-primary-950" : "text-slate-400"}`}>
                        {s.label}
                      </span>
                      {s.num < 3 && <div className="w-8 h-[1px] bg-slate-200" />}
                    </div>
                  ))}
                </div>

                {/* Drawer Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* STEP 1: Maklumat Asas */}
                  {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Reference Number */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                            No. Rujukan Permohonan <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-300 text-slate-950 text-xs font-mono font-black rounded-lg px-3 py-2.5 focus:border-primary-500 focus:bg-white focus:outline-hidden"
                            value={regNoRujukan}
                            onChange={(e) => setRegNoRujukan(e.target.value)}
                            required
                          />
                        </div>

                        {/* Date Submitted */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                            Tarikh Pengemukaan <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            className="w-full bg-slate-50 border border-slate-300 text-slate-950 text-xs font-bold rounded-lg px-3 py-2 focus:border-primary-500 focus:bg-white focus:outline-hidden"
                            value={regTarikhKemuka}
                            onChange={(e) => setRegTarikhKemuka(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Custom Real-Time Dropdown (IPS ID + Jenis + Status Badge) */}
                      <div className="relative space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                          Hubungkan Dengan Institusi Rujukan (Gua Musang) <span className="text-rose-500">*</span>
                        </label>
                        <div 
                          onClick={() => setIsOpenInstDropdown(!isOpenInstDropdown)}
                          className="w-full bg-white border border-slate-350 text-slate-900 text-xs font-extrabold rounded-lg px-3.5 py-3 cursor-pointer flex justify-between items-center hover:bg-slate-50/45 focus:border-primary-500"
                        >
                          {selectedInst ? (
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-950">{selectedInst.namaInstitusi}</span>
                              <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {selectedInst.kategori}
                              </span>
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                selectedInst.statusOperasi === "aktif" 
                                  ? "bg-emerald-100 text-emerald-800"
                                  : selectedInst.statusOperasi === "tidak aktif"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}>
                                {selectedInst.statusOperasi}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">-- Pilih Institusi Rujukan --</span>
                          )}
                          <span className="text-slate-400">▼</span>
                        </div>

                        {isOpenInstDropdown && (
                          <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-2 space-y-1">
                            <input
                              type="text"
                              placeholder="Cari IPS Gua Musang..."
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-2 mb-1.5 focus:bg-white focus:outline-hidden"
                              value={instSearchQuery}
                              onChange={(e) => setInstSearchQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {institutions
                              .filter(inst => inst.namaInstitusi.toLowerCase().includes(instSearchQuery.toLowerCase()))
                              .map((inst) => (
                                <div
                                  key={inst.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRegInstitusiId(inst.id);
                                    setIsOpenInstDropdown(false);
                                    setInstSearchQuery("");
                                  }}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 text-xs"
                                >
                                  <div>
                                    <p className="font-extrabold text-slate-900 leading-tight">{inst.namaInstitusi}</p>
                                    <span className="text-[10px] text-slate-450 font-semibold">{inst.kategori}</span>
                                  </div>
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                    inst.statusOperasi === "aktif" 
                                      ? "bg-emerald-100 text-emerald-800"
                                      : inst.statusOperasi === "tidak aktif"
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {inst.statusOperasi}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium pl-0.5 block mt-1 leading-normal">
                          * Dropdown dwi-arah ini menghubungkan terus dokumen ini secara real-time ke Firestore Institusi.
                        </span>
                      </div>

                      {/* Jenis Borang BPS KPM */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                          Jenis Borang Rasmi KPM BPS <span className="text-rose-500">*</span>
                        </label>
                        <select
                          className="w-full bg-white border border-slate-350 text-slate-900 text-xs font-semibold rounded-lg px-3 py-2.5 cursor-pointer focus:border-primary-500 focus:outline-hidden"
                          value={regJenisBorang}
                          onChange={(e) => {
                            setRegJenisBorang(e.target.value);
                            setRegDetailFields({});
                          }}
                          required
                        >
                          {Array.from(new Set(BORANG_METADATA_LIST.map(item => item.kategori))).map(kategori => (
                            <optgroup key={kategori} label={kategori}>
                              {BORANG_METADATA_LIST.filter(item => item.kategori === kategori).map(item => (
                                <option key={item.code} value={item.code}>
                                  {item.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      {/* Pegawai Penyelia */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                          Pegawai Penyelia <span className="text-rose-500">*</span>
                        </label>
                        <select
                          className="w-full bg-white border border-slate-350 text-slate-900 text-xs font-semibold rounded-lg px-3 py-2.5 cursor-pointer focus:border-primary-500 focus:outline-hidden"
                          value={regPegawai}
                          onChange={(e) => setRegPegawai(e.target.value)}
                          required
                        >
                          <option value="Encik Ahmad Sukri Bin Ramli">Encik Ahmad Sukri Bin Ramli</option>
                          <option value="Puan Noraini Binti Zakaria">Puan Noraini Binti Zakaria</option>
                          <option value="Sektor Pengurusan Swasta PPD">Sektor Pengurusan Swasta PPD</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Butiran Khusus Borang */}
                  {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                          INSTITUSI PILIHAN SEMENTARA
                        </h4>
                        <div className="flex items-center gap-2.5">
                          <span className="font-extrabold text-slate-950 text-sm">{selectedInst?.namaInstitusi}</span>
                          <span className="text-[10px] uppercase font-black text-slate-400 bg-white px-2 py-0.5 border border-slate-200 rounded">
                            {selectedInst?.kategori}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold mt-1.5 leading-normal">
                          * Semua maklumat di bawah telah diautofil secara sinkronisasi terus dari pangkalan data sistem IPS Gua Musang.
                        </p>
                      </div>

                      <BorangFormFields
                        jenisBorangCode={regJenisBorang}
                        values={regDetailFields}
                        onChange={setRegDetailFields}
                        institutions={institutions}
                        selectedInstitutionId={regInstitusiId}
                      />
                    </div>
                  )}

                  {/* STEP 3: Dokumen & Pengesahan */}
                  {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Document upload section (Firebase Storage) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                          Bahagian Muat Naik Dokumen Sokongan <span className="text-rose-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-2xl p-6 bg-slate-50 hover:bg-slate-50/50 transition-all text-center flex flex-col items-center justify-center relative cursor-pointer group">
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              setFileName(file.name);
                              setUploadProgress("Sedang mengunggah...");
                              const fileRef = storageRef(storage, `borang/${Date.now()}_${file.name}`);
                              uploadBytes(fileRef, file).then((snapshot) => {
                                getDownloadURL(snapshot.ref).then((downloadUrl) => {
                                  setUploadedUrl(downloadUrl);
                                  setUploadProgress("Berjaya dimuat naik!");
                                  toast.success("Dokumen berjaya dimuat naik ke Firebase Storage!");
                                  setRegDetailFields(prev => ({
                                    ...prev,
                                    dokumen_sokongan: file.name,
                                    dokumen_url: downloadUrl,
                                  }));
                                });
                              }).catch((err) => {
                                console.error(err);
                                setUploadProgress("Gagal muat naik.");
                                toast.error("Gagal muat naik dokumen ke Firebase Storage.");
                              });
                            }}
                          />
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                            <FilePenLine className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 leading-normal">
                              Seret & Lepas dokumen di sini atau klik untuk mendaftar fail
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Sokongan fail: PDF, JPG, PNG, DOC (Maksimum 5MB)
                            </p>
                          </div>
                        </div>

                        {/* File upload progress */}
                        {uploadProgress && (
                          <div className="p-3 bg-slate-100/60 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 mt-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              {fileName ? `File: ${fileName}` : uploadProgress}
                            </span>
                            <span className="text-[10px] uppercase font-black tracking-wider text-primary-800">
                              {uploadProgress === "Berjaya dimuat naik!" ? "Selesai" : "Mengunggah"}
                            </span>
                          </div>
                        )}

                        {uploadedUrl && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between text-xs font-bold text-green-800 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              <span className="truncate max-w-[400px]">Dokumen dimuat naik: {fileName}</span>
                            </div>
                            <a 
                              href={uploadedUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-700 underline font-black text-[10px] uppercase tracking-wider"
                            >
                              Lihat Fail
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Catatan Deskripsi */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                          Catatan Deskripsi Ringkas Penyerahan
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Masukkan ulasan ringkas mengenai penyerahan borang, isu, atau dokumen sementara yang dibawa..."
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-lg px-3.5 py-3 focus:border-primary-500 focus:bg-white focus:outline-hidden"
                          value={regCatatan}
                          onChange={(e) => setRegCatatan(e.target.value)}
                        />
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed font-bold space-y-1.5">
                        <span className="text-[10px] tracking-widest text-primary-800 uppercase block font-black">
                          SISTEM INTEGRASI DWI-ARAH
                        </span>
                        <p className="font-semibold text-slate-500">
                          Menyerahkan borang ini dengan status draf hanya akan disimpan secara dalaman, manakala status kelulusan akan melaraskan secara automatik parameter premis institusi bersangkutan.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Drawer Footer with Actions Pinned to bottom */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center shadow-inner">
                  <div>
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={() => setStep(prev => prev - 1)}
                        className="px-4 py-2.5 text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl cursor-pointer"
                      >
                        Kembali
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpenRegModal(false);
                          resetRegisterForm();
                        }}
                        className="px-4 py-2.5 text-xs font-bold border border-slate-200 text-rose-700 bg-white hover:bg-rose-50/50 rounded-xl cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Simpan Draf button */}
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleRegisterBorangWithStatus("draf")}
                      className="px-4.5 py-2.5 text-xs font-bold border border-slate-350 text-slate-800 bg-white hover:bg-slate-50 rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {actionLoading ? "Menyimpan draf..." : "Simpan Draf"}
                    </button>

                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (step === 1 && !regInstitusiId) {
                            toast.error("Sila pilih institusi rujukan terlebih dahulu!");
                            return;
                          }
                          setStep(prev => prev + 1);
                        }}
                        className="px-5 py-2.5 text-xs font-black bg-primary-800 hover:bg-primary-950 text-white rounded-xl shadow-xs cursor-pointer transition-all"
                      >
                        Seterusnya
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleRegisterBorangWithStatus("dikemukakan")}
                        className="px-6 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        {actionLoading ? "Mengirim..." : "Kemuka Permohonan"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: Kemas Kini Status & Tindakan Borang */}
      {isOpenActionModal && selectedBorang && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="action-borang-modal">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop overlay */}
            <div className="fixed inset-0 transition-opacity bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsOpenActionModal(false)} />

            {/* Centering offset helper */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-xl sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-slate-200">
              {/* Header */}
              <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-secondary-300">
                    <FilePenLine className="w-4 h-4 text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-secondary-400 leading-none mb-0.5">TINDAKAN PENYELIA</h3>
                    <p className="text-sm font-black tracking-tight leading-normal">Kemas Kini Urusan Borang</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpenActionModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleUpdateStatus} className="p-5 space-y-4">
                {/* Meta details of selected doc */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-medium text-xs text-slate-700 leading-relaxed space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Rujukan:</span>
                    <span className="font-mono font-black text-slate-900">{selectedBorang.noRujukan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">Institusi:</span>
                    <p className="font-extrabold text-slate-900">{selectedBorang.namaInstitusi}</p>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-1.5 mt-1.5">
                    <span className="text-slate-400 font-bold">Jenis Borang:</span>
                    <span className="font-bold text-slate-800 text-[11px] truncate max-w-[200px]">{selectedBorang.jenisBorang}</span>
                  </div>
                </div>

                {/* Structured Form Field Answers Viewer */}
                <BorangDetailViewer borang={selectedBorang} />

                {/* Status selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                    Ketetapan Status Urusan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className={`w-full text-slate-900 text-sm font-extrabold rounded-lg px-3 py-2.5 cursor-pointer focus:border-primary-500 focus:outline-hidden ${
                      permissions.canUpdateBorangStatus
                        ? "bg-white border border-slate-350"
                        : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                    value={actStatus}
                    onChange={(e) => setActStatus(e.target.value as BorangStatus)}
                    disabled={!permissions.canUpdateBorangStatus}
                    required
                  >
                    <option value="draf">Draf Sedia Ada (Simpanan Tempatan)</option>
                    <option value="dikemukakan">Dikemukakan (Baru Diterima)</option>
                    <option value="diproses">Sedang Diproses (Draf Dinilai)</option>
                    <option value="lulus">Lulus (Disahkan & Selesai)</option>
                    <option value="tolak">Ditolak / Perlu Semakan Khas</option>
                  </select>
                </div>

                {/* Notes update */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                    Ulasan / Catatan Penilaian Sektor
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Berikan alasan kelulusan, kritikan sekiranya ditolak, atau arahan pindaan pembetulan secara ringkas..."
                    className={`w-full text-xs font-semibold rounded-lg px-3.5 py-3 focus:outline-hidden ${
                      permissions.canUpdateBorangStatus
                        ? "bg-slate-50 border border-slate-200 text-slate-900 focus:border-primary-500 focus:bg-white"
                        : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                    value={actCatatan}
                    onChange={(e) => setActCatatan(e.target.value)}
                    disabled={!permissions.canUpdateBorangStatus}
                  />
                </div>

                {/* Help tip information */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2 text-[11px] text-amber-900 leading-normal">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Kemas kini ini akan direkodkan terus secara aktif serta mengubah data tabulasi di papan pemuka utama SPS KPM.</span>
                </div>

                {/* Footer CTA */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsOpenActionModal(false)}
                    className="px-5 py-2.5 text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  {permissions.canUpdateBorangStatus ? (
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-6 py-2.5 text-xs font-black bg-primary-800 hover:bg-primary-900 text-white rounded-xl shadow-xs transition-all disabled:bg-primary-300"
                    >
                      {actionLoading ? "Menyimpan..." : "Kemas Kini Status"}
                    </button>
                  ) : (
                    <div className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3.5 py-2.5 rounded-xl">
                      Akses Terhad ({role === "viewer" ? "Pemerhati" : "Pegawai"}) — Tiada hak menukar status
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
