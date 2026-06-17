import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getPematuhanList } from "../services/pematuhanService";
import { PematuhanRecord, StatusDokumen } from "../../../types/pematuhan";
import { InstitusiKategori } from "../../../types/institusi";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { KpiCard } from "../../../shared/components/ui/KpiCard";
import { FilterBar, FilterField } from "../../../shared/components/ui/FilterBar";
import { StatusBadge } from "../../../shared/components/ui/StatusBadge";
import { SectionCard } from "../../../shared/components/ui/SectionCard";
import { LoadingSkeleton } from "../../../shared/components/ui/LoadingSkeleton";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { Search, AlertCircle, Clock, CheckCircle, ShieldAlert, RefreshCw, Calendar, User, MapPin, Plus, Zap } from "lucide-react";
import { BorangPematuhan } from "../components/BorangPematuhan";

export function PematuhanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const instIdParam = searchParams.get("instId");
  const isNewParam = searchParams.get("new") === "true";

  const [pematuhan, setPematuhan] = useState<PematuhanRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFillingBorang, setIsFillingBorang] = useState<boolean>(false);

  // Auto-open compliance form if query parameters are present
  useEffect(() => {
    if (instIdParam || isNewParam) {
      setIsFillingBorang(true);
    }
  }, [instIdParam, isNewParam]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zonFilter, setZonFilter] = useState("all");
  const [pegawaiFilter, setPegawaiFilter] = useState("all");

  async function loadPematuhan() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPematuhanList();
      setPematuhan(data);
    } catch (err: any) {
      console.error(err);
      setError("Gagal mendapatkan rekod pematuhan daripada pangkalan data Firestore.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPematuhan();
  }, []);

  // Extract list of unique officers dynamically from loaded data for the Officer filter
  const uniquePegawai = useMemo(() => {
    const list = pematuhan
      .map((item) => item.pegawai)
      .filter((pegar): pegar is string => Boolean(pegar && pegar.trim() !== ""));
    return Array.from(new Set(list)).sort();
  }, [pematuhan]);

  // Handle all filtering locally
  const filteredPematuhan = useMemo(() => {
    return pematuhan.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.namaInstitusi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.jenisDokumen.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.pegawai && item.pegawai.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesKategori =
        kategoriFilter === "all" ||
        item.kategori.toLowerCase() === kategoriFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        item.statusDokumen.toLowerCase() === statusFilter.toLowerCase();

      const matchesZon =
        zonFilter === "all" ||
        item.zon.toLowerCase().includes(zonFilter.toLowerCase());

      const matchesPegawai =
        pegawaiFilter === "all" ||
        (item.pegawai && item.pegawai.toLowerCase() === pegawaiFilter.toLowerCase());

      return matchesSearch && matchesKategori && matchesStatus && matchesZon && matchesPegawai;
    });
  }, [pematuhan, searchQuery, kategoriFilter, statusFilter, zonFilter, pegawaiFilter]);

  // Aggregate statistics for the KPI cards
  const kpiStats = useMemo(() => {
    let lengkap = 0;
    let tidakLengkap = 0;
    let hampirLuput = 0;
    let tindakanSegera = 0;

    filteredPematuhan.forEach((item) => {
      if (item.statusDokumen === "lengkap") lengkap++;
      else if (item.statusDokumen === "tidak lengkap") tidakLengkap++;
      else if (item.statusDokumen === "hampir luput") hampirLuput++;

      if (item.tindakanSegera) tindakanSegera++;
    });

    return {
      lengkap,
      tidakLengkap,
      hampirLuput,
      tindakanSegera,
    };
  }, [filteredPematuhan]);

  // Sub-sections lists: hampir luput & tidak patuh (limit to top 5)
  const hampirLuputList = useMemo(() => {
    return filteredPematuhan
      .filter((item) => item.statusDokumen === "hampir luput")
      .slice(0, 5);
  }, [filteredPematuhan]);

  const tidakPatuhList = useMemo(() => {
    return filteredPematuhan
      .filter((item) => item.statusDokumen === "tidak lengkap" || item.tindakanSegera)
      .slice(0, 5);
  }, [filteredPematuhan]);

  // Construct Filter Fields
  const filterFields: FilterField[] = [
    {
      key: "kategori",
      label: "Kategori Institusi",
      value: kategoriFilter,
      options: [
        { label: "Semua Kategori", value: "all" },
        { label: "Tadika Swasta", value: "tadika swasta" },
        { label: "Sekolah Swasta", value: "sekolah swasta" },
        { label: "Pusat Tuisyen", value: "pusat tuisyen" },
      ],
    },
    {
      key: "statusDokumen",
      label: "Status Dokumen",
      value: statusFilter,
      options: [
        { label: "Semua Status", value: "all" },
        { label: "Lengkap", value: "lengkap" },
        { label: "Tidak Lengkap", value: "tidak lengkap" },
        { label: "Hampir Luput", value: "hampir luput" },
      ],
    },
    {
      key: "zon",
      label: "Zon",
      value: zonFilter,
      options: [
        { label: "Semua Zon", value: "all" },
        { label: "Bandar Gua Musang", value: "bandar" },
        { label: "Zon Paloh", value: "paloh" },
        { label: "Zon Lojing", value: "lojing" },
      ],
    },
    {
      key: "pegawai",
      label: "Pegawai Penyelia",
      value: pegawaiFilter,
      options: [
        { label: "Semua Pegawai", value: "all" },
        ...uniquePegawai.map((peg) => ({ label: peg, value: peg.toLowerCase() })),
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === "kategori") setKategoriFilter(value);
    else if (key === "statusDokumen") setStatusFilter(value);
    else if (key === "zon") setZonFilter(value);
    else if (key === "pegawai") setPegawaiFilter(value);
  };

  const getStatusTone = (status: StatusDokumen) => {
    switch (status) {
      case "lengkap":
        return "success";
      case "hampir luput":
        return "warning";
      case "tidak lengkap":
        return "danger";
      default:
        return "neutral";
    }
  };

  const formatKategori = (kat: InstitusiKategori) => {
    switch (kat) {
      case "tadika swasta":
        return "Tadika Swasta";
      case "sekolah swasta":
        return "Sekolah Swasta";
      case "pusat tuisyen":
        return "Pusat Tuisyen";
      default:
        return kat;
    }
  };

  if (isFillingBorang) {
    return (
      <div className="space-y-6" id="pematuhan-page-container">
        <PageHeader
          title="Unit Pematuhan Institusi Swasta"
          subtitle="Kemaskini perakuan kelulusan bomba, kebersihan KKM, permit PBT dan surat pematuhan IPS berdaftar."
        />
        <BorangPematuhan 
          onBack={(shouldRefresh) => {
            setIsFillingBorang(false);
            setSearchParams({});
            if (shouldRefresh) {
              loadPematuhan();
            }
          }} 
          preselectedInstId={instIdParam}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="pematuhan-page-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Status Pematuhan Dokumen"
          subtitle="Pemantauan persetujuan Bomba, KKM, Majlis Daerah, serta surat kebenaran premis Institusi Swasta."
        />
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsFillingBorang(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-black bg-primary-800 hover:bg-primary-900 text-white rounded-full transition-all cursor-pointer shadow-xs border border-primary-950/20"
          >
            <Plus className="w-4 h-4 text-secondary-300 font-extrabold" />
            <span>Tambah Rekod Pematuhan</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6" id="pematuhan-loading">
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
              <div className="h-64 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Error View */}
      {!loading && error && (
        <div className="space-y-4" id="pematuhan-error">
          <EmptyState title="Sistem Gagal Memuat" description={error} />
          <div className="flex justify-center">
            <button
              onClick={loadPematuhan}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Cuba Semula
            </button>
          </div>
        </div>
      )}

      {/* Main Success View */}
      {!loading && !error && (
        <>
          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="pematuhan-kpis">
            <KpiCard
              label="Lengkap"
              value={kpiStats.lengkap}
              hint="Status pematuhan terbaik"
              tone="success"
            />
            <KpiCard
              label="Hampir Luput"
              value={kpiStats.hampirLuput}
              hint="Permit permit tamat tempoh"
              tone="warning"
            />
            <KpiCard
              label="Tidak Lengkap"
              value={kpiStats.tidakLengkap}
              hint="Gagal mematuhi standard"
              tone="danger"
            />
            <KpiCard
              label="Tindakan Segera"
              value={kpiStats.tindakanSegera}
              hint="Memerlukan tindakan segera"
              tone="danger"
            />
          </div>

          {/* Unified search & filtering panel */}
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm" id="filter-wrapper">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end w-full">
              {/* Search Box */}
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                  Carian Dokumen & Institusi
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Masukkan nama institusi, jenis dokumen kebenaran, atau pegawai penyelia..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 font-semibold transition-all focus:border-primary-500 focus:bg-white focus:outline-hidden placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Reset trigger */}
              {(searchQuery || kategoriFilter !== "all" || statusFilter !== "all" || zonFilter !== "all" || pegawaiFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setKategoriFilter("all");
                    setStatusFilter("all");
                    setZonFilter("all");
                    setPegawaiFilter("all");
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

          {/* Row 2: List Sub-sections with splits */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="pematuhan-splits">
            {/* Column 1: Hampir Luput (2/3 width) */}
            <div className="lg:col-span-2">
              <SectionCard title="Senarai Dokumen Hampir Luput">
                <div className="space-y-4">
                  {hampirLuputList.length === 0 ? (
                    <EmptyState
                      title="Tiada Dokumen Hampir Luput"
                      description="Semua permit dan kebenaran sokongan institusi berada dalam tempoh sah yang selamat."
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {hampirLuputList.map((item) => (
                        <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-slate-900">{item.namaInstitusi}</h4>
                            <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 tracking-wide font-mono text-xs uppercase">
                                {formatKategori(item.kategori)}
                              </span>
                              <span>• Document: {item.jenisDokumen}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-left sm:text-right">
                              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Tarikh Tamat</span>
                              <span className="text-xs font-mono font-bold text-amber-600 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                {item.tarikhTamat || "Tiada Maklumat"}
                              </span>
                            </div>
                            <StatusBadge label="Hampir Luput" tone="warning" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Column 2: Tidak Patuh & Segera (1/3 width) */}
            <div>
              <SectionCard title="Institusi Tidak Patuh">
                <div className="space-y-4">
                  {tidakPatuhList.length === 0 ? (
                    <EmptyState
                      title="Sifar Ketidakpatuhan"
                      description="Hebat! Tiada rekod ketidakpatuhan dikesan berdasarkan hasil tapisan semasa."
                    />
                  ) : (
                    <div className="space-y-3">
                      {tidakPatuhList.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-rose-50/45 border border-rose-100/70 rounded-xl space-y-2.5"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                              {item.namaInstitusi}
                            </h4>
                            <p className="text-xs text-slate-600 font-semibold line-clamp-2">
                              Isu: {item.jenisDokumen} (Dokumen tidak dikemaskini)
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-rose-100/30 text-xs">
                            <span className="text-slate-500 font-bold truncate max-w-[120px]">
                              Penyelia: {item.pegawai || "PPD GM"}
                            </span>
                            <StatusBadge
                              label={item.tindakanSegera ? "Kritikal" : "Tidak Lengkap"}
                              tone="danger"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Row 3: Full-width status summary table */}
          {filteredPematuhan.length === 0 ? (
            <EmptyState
              title="Tiada Rekod Secara Kumulatif"
              description="Ubahsuai penapis carian di bahagian atas untuk memulakan semakan semula status dokumen kebenaran beroperasi."
            />
          ) : (
            <div id="kumulatif-summary-section">
              <SectionCard title="Ringkasan Status Dokumen Pematuhan (Keseluruhan)">
                {/* Desktop view (table) */}
                <div className="hidden md:block overflow-hidden" id="desktop-table">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Nama Institusi</th>
                        <th className="py-3 px-4">Jenis Dokumen Kelulusan</th>
                        <th className="py-3 px-4 text-center">Status Dokumen</th>
                        <th className="py-3 px-4 text-center">Tindakan Segera</th>
                        <th className="py-3 px-4">Pegawai Penyelia</th>
                        <th className="py-3 px-4 text-center">Tarikh Tamat</th>
                        <th className="py-3 px-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                      {filteredPematuhan.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-900 block text-sm md:text-base">{item.namaInstitusi}</span>
                              <span className="text-xs text-slate-500 capitalize font-semibold">{formatKategori(item.kategori)} • {item.zon}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {item.jenisDokumen}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge
                              label={item.statusDokumen === "lengkap" ? "Lengkap" : item.statusDokumen === "tidak lengkap" ? "Tidak Lengkap" : "Hampir Luput"}
                              tone={getStatusTone(item.statusDokumen)}
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.tindakanSegera ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 animate-pulse">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                YA
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                Neutral
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-bold">
                            {item.pegawai || "Pegawai Unit Swasta"}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-650 font-bold text-sm">
                            {item.tarikhTamat || "Tiada Had"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              to={`/tindakan?instId=${item.id}&isu=${encodeURIComponent(item.jenisDokumen)}&keutamaan=${item.tindakanSegera ? 'tinggi' : 'sederhana'}&new=true`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-full border border-amber-200 shadow-2xs transition-all cursor-pointer whitespace-nowrap uppercase"
                              title="Buka Borang Tindakan untuk Pematuhan ini"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-600" />
                              <span>Ambil Tindakan</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View (cards) */}
                <div className="md:hidden space-y-4" id="mobile-cards">
                  {filteredPematuhan.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{formatKategori(item.kategori)}</span>
                          <h4 className="text-base font-black text-slate-900 leading-snug">
                            {item.namaInstitusi}
                          </h4>
                        </div>
                        <StatusBadge
                          label={item.statusDokumen === "lengkap" ? "Lengkap" : item.statusDokumen === "tidak lengkap" ? "Tidak Lengkap" : "Hampir Luput"}
                          tone={getStatusTone(item.statusDokumen)}
                        />
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-700 font-semibold">
                        <div className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span>Dokumen: {item.jenisDokumen}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span>Penyelia: {item.pegawai || "PPD Gua Musang"}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span>Zon Operasi: {item.zon}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span className="font-mono">Tamat Permit: {item.tarikhTamat || "Tiada Had"}</span>
                        </div>
                      </div>

                      {item.tindakanSegera && (
                        <div className="bg-rose-50 border border-rose-100 min-h-[34px] rounded-lg p-2 flex items-center gap-2 text-rose-800 text-xs font-bold tracking-normal">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>TINDAKAN SEGERA DIKEHENDAKI ATAS ARAHAN SEKTOR</span>
                        </div>
                      )}

                      {/* Mobile Action trigger */}
                      <div className="pt-1">
                        <Link
                          to={`/tindakan?instId=${item.id}&isu=${encodeURIComponent(item.jenisDokumen)}&keutamaan=${item.tindakanSegera ? 'tinggi' : 'sederhana'}&new=true`}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-black text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 shadow-2xs transition-all cursor-pointer uppercase"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-600 font-extrabold animate-pulse" />
                          <span>Daftar Tindakan Susulan</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PematuhanPage;
