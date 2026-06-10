import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getTindakanList } from "../services/kesService";
import { TindakanRecord, StatusKes, KeutamaanKes } from "../../../types/tindakan";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { KpiCard } from "../../../shared/components/ui/KpiCard";
import { FilterBar, FilterField } from "../../../shared/components/ui/FilterBar";
import { StatusBadge } from "../../../shared/components/ui/StatusBadge";
import { SectionCard } from "../../../shared/components/ui/SectionCard";
import { LoadingSkeleton } from "../../../shared/components/ui/LoadingSkeleton";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { Search, Calendar, User, RefreshCw, AlertCircle, Clock, ShieldAlert, CheckCircle2, ChevronRight, MapPin, Briefcase, Plus, Zap } from "lucide-react";
import { BorangTindakan } from "../components/BorangTindakan";

export function TindakanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const instIdParam = searchParams.get("instId");
  const isuParam = searchParams.get("isu");
  const keutamaanParam = searchParams.get("keutamaan");
  const isNewParam = searchParams.get("new") === "true";

  const [tindakan, setTindakan] = useState<TindakanRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFillingBorang, setIsFillingBorang] = useState<boolean>(false);

  // Auto-open measures form if query parameters are present
  useEffect(() => {
    if (instIdParam || isNewParam) {
      setIsFillingBorang(true);
    }
  }, [instIdParam, isNewParam]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [pegawaiFilter, setPegawaiFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [keutamaanFilter, setKeutamaanFilter] = useState("all");
  const [bulanFilter, setBulanFilter] = useState("all");

  async function loadTindakan() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTindakanList();
      setTindakan(data);
    } catch (err: any) {
      console.error(err);
      setError("Gagal mendapatkan rekod tindakan dan kes penyeliaan dari Firestore.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTindakan();
  }, []);

  // Filter local using useMemo
  const filteredTindakan = useMemo(() => {
    return tindakan.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.namaInstitusi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.jenisKes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.catatan && item.catatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.pegawai && item.pegawai.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPegawai =
        pegawaiFilter === "all" ||
        (item.pegawai && item.pegawai.toLowerCase() === pegawaiFilter.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        item.statusKes.toLowerCase() === statusFilter.toLowerCase();

      const matchesKeutamaan =
        keutamaanFilter === "all" ||
        (item.keutamaan && item.keutamaan.toLowerCase() === keutamaanFilter.toLowerCase());

      const matchesBulan =
        bulanFilter === "all" ||
        (item.tarikhTindakan && item.tarikhTindakan.startsWith(bulanFilter));

      return matchesSearch && matchesPegawai && matchesStatus && matchesKeutamaan && matchesBulan;
    });
  }, [tindakan, searchQuery, pegawaiFilter, statusFilter, keutamaanFilter, bulanFilter]);

  // Dynamic unique Officers extractor
  const uniquePegawai = useMemo(() => {
    const list = tindakan
      .map((item) => item.pegawai)
      .filter((peg): peg is string => Boolean(peg && peg.trim() !== ""));
    return Array.from(new Set(list)).sort();
  }, [tindakan]);

  // Total count for KPIs based on current filtered dataset
  const kpiStats = useMemo(() => {
    let baru = 0;
    let dalamTindakan = 0;
    let overdue = 0;
    let selesai = 0;

    filteredTindakan.forEach((item) => {
      if (item.statusKes === "baru") baru++;
      else if (item.statusKes === "dalam tindakan") dalamTindakan++;
      else if (item.statusKes === "overdue") overdue++;
      else if (item.statusKes === "selesai") selesai++;
    });

    return {
      baru,
      dalamTindakan,
      overdue,
      selesai,
    };
  }, [filteredTindakan]);

  // Column 1: Active Cases list (status !== "selesai")
  const kesAktifList = useMemo(() => {
    return filteredTindakan.filter((item) => item.statusKes !== "selesai");
  }, [filteredTindakan]);

  // Column 2: Officers load (group by officer and counts)
  const bebanPegawai = useMemo(() => {
    const counts: Record<string, { nama: string; aktif: number; overdue: number; selesai: number }> = {};
    filteredTindakan.forEach((t) => {
      const peg = t.pegawai || "Pegawai Tidak Dinamakan";
      if (!counts[peg]) {
        counts[peg] = { nama: peg, aktif: 0, overdue: 0, selesai: 0 };
      }
      if (t.statusKes === "selesai") {
        counts[peg].selesai++;
      } else {
        counts[peg].aktif++;
      }
      if (t.statusKes === "overdue") {
        counts[peg].overdue++;
      }
    });
    return Object.values(counts).sort((a, b) => b.aktif - a.aktif);
  }, [filteredTindakan]);

  // Recent visits (jenisAktiviti or types context contains "lawatan")
  const lawatanTerkiniList = useMemo(() => {
    return filteredTindakan
      .filter((t) => {
        const akt = (t.jenisAktiviti ?? "").toLowerCase();
        const kes = (t.jenisKes ?? "").toLowerCase();
        const cat = (t.catatan ?? "").toLowerCase();
        return akt.includes("lawatan") || kes.includes("lawatan") || cat.includes("lawatan");
      })
      .slice(0, 5);
  }, [filteredTindakan]);

  // Timeline list (top 5 most recent activities ordered desc)
  const timelineAktiviti = useMemo(() => {
    return [...filteredTindakan]
      .sort((a, b) => (b.tarikhTindakan ?? "").localeCompare(a.tarikhTindakan ?? ""))
      .slice(0, 5);
  }, [filteredTindakan]);

  // Formulating Filter fields configuration
  const filterFields: FilterField[] = [
    {
      key: "pegawai",
      label: "Pegawai Penyelia",
      value: pegawaiFilter,
      options: [
        { label: "Semua Pegawai", value: "all" },
        ...uniquePegawai.map((peg) => ({ label: peg, value: peg.toLowerCase() })),
      ],
    },
    {
      key: "statusKes",
      label: "Status Kes",
      value: statusFilter,
      options: [
        { label: "Semua Status", value: "all" },
        { label: "Baru", value: "baru" },
        { label: "Dalam Tindakan", value: "dalam tindakan" },
        { label: "Overdue", value: "overdue" },
        { label: "Selesai", value: "selesai" },
      ],
    },
    {
      key: "keutamaan",
      label: "Keutamaan",
      value: keutamaanFilter,
      options: [
        { label: "Semua Keutamaan", value: "all" },
        { label: "Tinggi", value: "tinggi" },
        { label: "Sederhana", value: "sederhana" },
        { label: "Rendah", value: "rendah" },
      ],
    },
    {
      key: "bulan",
      label: "Bulan Aktiviti",
      value: bulanFilter,
      options: [
        { label: "Semua Bulan", value: "all" },
        { label: "Mei 2026", value: "2026-05" },
        { label: "April 2026", value: "2026-04" },
        { label: "Mac 2026", value: "2026-03" },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === "pegawai") setPegawaiFilter(value);
    else if (key === "statusKes") setStatusFilter(value);
    else if (key === "keutamaan") setKeutamaanFilter(value);
    else if (key === "bulan") setBulanFilter(value);
  };

  const getStatusLabelAndTone = (status: StatusKes) => {
    switch (status) {
      case "baru":
        return { label: "Baru", tone: "info" as const };
      case "dalam tindakan":
        return { label: "Dalam Tindakan", tone: "warning" as const };
      case "overdue":
        return { label: "Tertunggak", tone: "danger" as const };
      case "selesai":
        return { label: "Selesai", tone: "success" as const };
      default:
        return { label: status, tone: "neutral" as const };
    }
  };

  const getKeutamaanLabel = (keutamaan?: KeutamaanKes) => {
    switch (keutamaan) {
      case "tinggi":
        return "Tinggi";
      case "sederhana":
        return "Sederhana";
      case "rendah":
        return "Rendah";
      default:
        return "-";
    }
  };

  const getKeutamaanTone = (keutamaan?: KeutamaanKes) => {
    switch (keutamaan) {
      case "tinggi":
        return "danger";
      case "sederhana":
        return "warning";
      case "rendah":
        return "success";
      default:
        return "neutral";
    }
  };

  const getKeutamaanBadgeClasses = (keutamaan?: KeutamaanKes) => {
    switch (keutamaan) {
      case "tinggi":
        return "text-rose-600 bg-rose-50 border-rose-100";
      case "sederhana":
        return "text-amber-600 bg-amber-50 border-amber-100";
      case "rendah":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      default:
        return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  if (isFillingBorang) {
    return (
      <div className="space-y-6" id="tindakan-page-container">
        <PageHeader
          title="Tindakan Susulan & Kes Keselamatan"
          subtitle="Menguruskan aduan, arahan penambahbaikan premis swasta, serta tindakan susulan bersepadu."
        />
        <BorangTindakan 
          onBack={() => {
            setIsFillingBorang(false);
            setSearchParams({});
          }} 
          preselectedInstId={instIdParam}
          preselectedIsu={isuParam}
          preselectedKeutamaan={keutamaanParam}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="tindakan-page-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Tindakan Susulan & Kes Keselamatan"
          subtitle="Menguruskan aduan, arahan penambahbaikan premis swasta, serta tindakan susulan bersepadu."
        />
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsFillingBorang(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-black bg-primary-800 hover:bg-primary-900 text-white rounded-full transition-all cursor-pointer shadow-xs border border-primary-950/20"
          >
            <Plus className="w-4 h-4 text-secondary-300 font-extrabold" />
            <span>Tambah Rekod Tindakan</span>
          </button>
          <button
            onClick={loadTindakan}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400 font-bold" />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Loading Block */}
      {loading && (
        <div className="space-y-6" id="tindakan-loading">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LoadingSkeleton rows={4} />
            </div>
            <div>
              <div className="h-56 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Error View */}
      {!loading && error && (
        <div className="space-y-4" id="tindakan-error">
          <EmptyState title="Gagal Menghubungkan Pengkalan Data" description={error} />
          <div className="flex justify-center">
            <button
              onClick={loadTindakan}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Cuba Semula
            </button>
          </div>
        </div>
      )}

      {/* Main Content SUCCESS */}
      {!loading && !error && (
        <>
          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="tindakan-kpis">
            <KpiCard
              label="Kes Baru"
              value={kpiStats.baru}
              hint="Aduan baru diterima"
              tone="info"
            />
            <KpiCard
              label="Dalam Tindakan"
              value={kpiStats.dalamTindakan}
              hint="Sedang disemak / diambil tindakan"
              tone="warning"
            />
            <KpiCard
              label="Tertunggak"
              value={kpiStats.overdue}
              hint="Melebihi tempoh penyelesaian"
              tone="danger"
            />
            <KpiCard
              label="Selesai"
              value={kpiStats.selesai}
              hint="Kes ditutup secara rasmi"
              tone="success"
            />
          </div>

          {/* Unified search & filtering panel */}
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm" id="filter-wrapper">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end w-full">
              {/* Search Box */}
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                  Carian Aduan & Catatan
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Masukkan nama institusi, jenis kes susulan, tindakan, atau catatan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 font-semibold transition-all focus:border-primary-500 focus:bg-white focus:outline-hidden placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Reset trigger */}
              {(searchQuery || pegawaiFilter !== "all" || statusFilter !== "all" || keutamaanFilter !== "all" || bulanFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPegawaiFilter("all");
                    setStatusFilter("all");
                    setKeutamaanFilter("all");
                    setBulanFilter("all");
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-100 transition-colors cursor-pointer self-start md:self-auto shrink-0 mb-0.5"
                >
                  Set Semula Tapisan
                </button>
              )}
            </div>

            {/* Filter selectors row */}
            <FilterBar fields={filterFields} onChange={handleFilterChange} />
          </div>

          {/* Row 3: Active Cases List (2/3 width) & Officer load (1/3 width) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="tindakan-layout-grid-major">
            {/* Active Cases Column */}
            <div className="lg:col-span-2">
              <SectionCard title="Senarai Kes Aktif Dalam Tindakan">
                <div className="space-y-4">
                  {kesAktifList.length === 0 ? (
                    <EmptyState
                      title="Sifar Kes Aktif"
                      description="Tiada kes baru, tertunggak, atau tindakan susulan dikesan yang sepadan dengan hasil tapisan."
                    />
                  ) : (
                    <>
                      {/* Desktop view (table) */}
                      <div className="hidden md:block overflow-hidden" id="desktop-table-aktif">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-4">Nama Institusi</th>
                              <th className="py-3 px-4">Jenis Kes / Catatan</th>
                              <th className="py-3 px-4 text-center">Keutamaan</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4">Pegawai Penyelia</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                            {kesAktifList.map((item) => {
                              const badgeInfo = getStatusLabelAndTone(item.statusKes);
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="py-3 px-4">
                                    <div className="space-y-0.5">
                                      <span className="font-extrabold text-slate-900 block text-sm md:text-base">{item.namaInstitusi}</span>
                                      <span className="text-xs text-slate-500 font-mono tracking-wide">{item.tarikhTindakan || "Tiada Tarikh"}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 max-w-xs">
                                    <div className="space-y-1">
                                      <span className="font-extrabold text-slate-800 block text-sm">{item.jenisKes}</span>
                                      {item.catatan && (
                                        <span className="text-xs text-slate-500 font-semibold block line-clamp-1 italic">
                                          "{item.catatan}"
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold border ${getKeutamaanBadgeClasses(item.keutamaan)}`}>
                                      {getKeutamaanLabel(item.keutamaan)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <StatusBadge label={badgeInfo.label} tone={badgeInfo.tone} />
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-700">
                                    {item.pegawai}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile view (cards) */}
                      <div className="md:hidden space-y-3" id="mobile-cards-aktif">
                        {kesAktifList.map((item) => {
                          const badgeInfo = getStatusLabelAndTone(item.statusKes);
                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-xl border border-slate-200/90 p-3.5 space-y-3 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="text-base font-black text-slate-900 leading-snug">
                                  {item.namaInstitusi}
                                </h4>
                                <StatusBadge label={badgeInfo.label} tone={badgeInfo.tone} />
                              </div>

                              <div className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                                <p className="font-bold text-slate-700">{item.jenisKes}</p>
                                {item.catatan && (
                                  <p className="font-medium text-slate-400 italic">"{item.catatan}"</p>
                                )}
                                <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between items-center text-xs text-slate-500 gap-2">
                                  <span>Penyelia: {item.pegawai}</span>
                                  <span className="font-mono">{item.tarikhTindakan || "N/A"}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-bold">Kategori Keutamaan:</span>
                                <StatusBadge
                                  label={getKeutamaanLabel(item.keutamaan)}
                                  tone={getKeutamaanTone(item.keutamaan)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Officer Workload Column */}
            <div>
              <SectionCard title="Beban Tugas Pegawai">
                <div className="space-y-4">
                  {bebanPegawai.length === 0 ? (
                    <EmptyState
                      title="Tiada Rekod Tugas"
                      description="Belum ada pembahagian rekod tindakan dikaitkan kepada pegawai penyelia setakat ini."
                    />
                  ) : (
                    <div className="space-y-4">
                      {bebanPegawai.map((peg, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 line-clamp-1 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {peg.nama}
                            </span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Pegawai</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            {/* Active tasks */}
                            <div className="bg-amber-50 text-amber-950 p-2 rounded-lg border border-amber-100">
                              <span className="block font-black text-xs text-amber-700">{peg.aktif}</span>
                              <span className="text-[10px] font-extrabold text-amber-600/90 tracking-wider">AKTIF</span>
                            </div>

                            {/* Overdue */}
                            <div className={`p-2 rounded-lg border ${
                              peg.overdue > 0 
                                ? "bg-rose-50 text-rose-950 border-rose-100" 
                                : "bg-slate-50 text-slate-500 border-slate-100"
                            }`}>
                              <span className={`block font-black text-xs ${peg.overdue > 0 ? "text-rose-600" : "text-slate-400"}`}>
                                {peg.overdue}
                              </span>
                              <span className={`text-[10px] font-extrabold tracking-wider ${peg.overdue > 0 ? "text-rose-600/90" : "text-slate-400"}`}>OVERDUE</span>
                            </div>

                            {/* Resolved */}
                            <div className="bg-emerald-50 text-emerald-950 p-2 rounded-lg border border-emerald-100">
                              <span className="block font-black text-xs text-emerald-700">{peg.selesai}</span>
                              <span className="text-[10px] font-extrabold text-emerald-600/90 tracking-wider">SELESAI</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Row 4: Lawatan Terkini & Timeline Aktiviti (2 columns on desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="tindakan-layout-grid-minor">
            {/* Lawatan Terkini */}
            <div>
              <SectionCard title="Log Lawatan Terkini (Zon / PPD)">
                <div className="space-y-4">
                  {lawatanTerkiniList.length === 0 ? (
                    <EmptyState
                      title="Tiada Rekod Lawatan"
                      description="Tiada sebarang tindakan lawatan pemantauan atau pemeriksaan direkodkan berdasarkan tapisan semasa."
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {lawatanTerkiniList.map((lawatan) => (
                        <div key={lawatan.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900">{lawatan.namaInstitusi}</h4>
                            <p className="text-xs text-slate-650 font-semibold">
                              Tujuan: {lawatan.jenisKes}
                            </p>
                            <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-semibold">
                                <User className="w-3 h-3 text-slate-400" />
                                {lawatan.pegawai}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs text-slate-550 font-bold block uppercase tracking-wider">Tarikh Lawatan</span>
                            <span className="text-xs font-mono font-bold text-primary-600 flex items-center justify-end gap-1 mt-0.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {lawatan.tarikhTindakan || "N/A"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Timeline Aktiviti */}
            <div>
              <SectionCard title="Timeline Log Aktiviti Kes">
                <div className="space-y-4">
                  {timelineAktiviti.length === 0 ? (
                    <EmptyState
                      title="Tiada Garis Masa"
                      description="Rekod log tindakan tidak mencukupi untuk menjana garisan masa."
                    />
                  ) : (
                    <div className="relative border-l border-slate-200 ml-2.5 pl-5 space-y-5 py-1">
                      {timelineAktiviti.map((act) => {
                        const isSelesai = act.statusKes === "selesai";
                        return (
                          <div key={act.id} className="relative text-xs">
                            {/* Point Indicator */}
                            <span className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                              isSelesai ? "bg-emerald-500" : "bg-primary-500"
                            }`} />

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/85 space-y-1">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="font-extrabold text-slate-900">{act.namaInstitusi}</span>
                                <span className="text-xs font-mono text-slate-500 font-bold shrink-0">{act.tarikhTindakan || "N/A"}</span>
                              </div>
                              <p className="text-xs text-slate-600 font-semibold">
                                <span className="font-bold text-primary-700">[{act.jenisKes}]</span>: {act.catatan || "Tiada catatan tambahan."}
                              </p>
                              <div className="pt-1.5 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/35">
                                <span className="font-semibold">{act.pegawai}</span>
                                <span className={`uppercase font-black text-xs tracking-wider ${isSelesai ? "text-emerald-600" : "text-amber-600"}`}>
                                  {act.statusKes}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TindakanPage;
