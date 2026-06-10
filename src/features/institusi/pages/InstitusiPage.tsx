import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getInstitusiList } from "../services/institusiService";
import { InstitusiRecord, InstitusiKategori, InstitusiStatus } from "../../../types/institusi";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { KpiCard } from "../../../shared/components/ui/KpiCard";
import { FilterBar, FilterField } from "../../../shared/components/ui/FilterBar";
import { StatusBadge } from "../../../shared/components/ui/StatusBadge";
import { LoadingSkeleton } from "../../../shared/components/ui/LoadingSkeleton";
import { EmptyState } from "../../../shared/components/ui/EmptyState";
import { Search, MapPin, Phone, User, Calendar, FileText, RefreshCw, Building, Plus, ShieldCheck, Info } from "lucide-react";
import { BorangPendaftaran } from "../components/BorangPendaftaran";
import { InstitusiDetailModal } from "../components/InstitusiDetailModal";

export function InstitusiPage() {
  const [institusi, setInstitusi] = useState<InstitusiRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Detail Modal States
  const [selectedDetailInst, setSelectedDetailInst] = useState<InstitusiRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zonFilter, setZonFilter] = useState("all");

  async function loadInstitusi() {
    console.log("loadInstitusi refetch start");
    setLoading(true);
    setError(null);
    try {
      const data = await getInstitusiList();
      setInstitusi(data);
    } catch (err: any) {
      console.error(err);
      setError("Gagal mendapatkan senarai rekod institusi dari Firestore.");
    } finally {
      setLoading(false);
      console.log("loadInstitusi refetch end");
    }
  }

  useEffect(() => {
    loadInstitusi();
  }, []);

  // Filter local using useMemo
  const filteredInstitusi = useMemo(() => {
    return institusi.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.namaInstitusi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.noRujukan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.alamat && item.alamat.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesKategori =
        kategoriFilter === "all" ||
        item.kategori.toLowerCase() === kategoriFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        item.statusOperasi.toLowerCase() === statusFilter.toLowerCase();

      const matchesZon =
        zonFilter === "all" ||
        item.zon.toLowerCase().includes(zonFilter.toLowerCase());

      return matchesSearch && matchesKategori && matchesStatus && matchesZon;
    });
  }, [institusi, searchQuery, kategoriFilter, statusFilter, zonFilter]);

  // KPI calculations based on current filter list
  const kpiStats = useMemo(() => {
    const totalFiltered = filteredInstitusi.length;
    const totalAktif = filteredInstitusi.filter((x) => x.statusOperasi === "aktif").length;
    const totalPasif = filteredInstitusi.filter(
      (x) => x.statusOperasi === "tidak aktif" || x.statusOperasi === "digantung"
    ).length;

    return {
      totalFiltered,
      totalAktif,
      totalPasif,
    };
  }, [filteredInstitusi]);

  // Migration stats for reporting dashboard
  const migrationStats = useMemo(() => {
    let legacyCount = 0;
    let hybridCount = 0;
    let firebaseAuthOnlyCount = 0;

    institusi.forEach((item) => {
      const state = item.portalAccess?.migrationState || "legacy";
      if (!item.portalAccess || item.portalAccess.credentialStatus === "belum-diset") {
        legacyCount++;
      } else if (state === "firebase-auth-only") {
        firebaseAuthOnlyCount++;
      } else if (state === "hybrid") {
        hybridCount++;
      } else {
        legacyCount++;
      }
    });

    return {
      legacyCount,
      hybridCount,
      firebaseAuthOnlyCount,
    };
  }, [institusi]);

  // Constructing FilterBar configuration
  const filterFields: FilterField[] = [
    {
      key: "kategori",
      label: "Kategori",
      value: kategoriFilter,
      options: [
        { label: "Semua Kategori", value: "all" },
        { label: "Tadika Swasta", value: "tadika swasta" },
        { label: "Sekolah Swasta", value: "sekolah swasta" },
        { label: "Pusat Tuisyen", value: "pusat tuisyen" },
      ],
    },
    {
      key: "statusOperasi",
      label: "Status Operasi",
      value: statusFilter,
      options: [
        { label: "Semua Status", value: "all" },
        { label: "Aktif", value: "aktif" },
        { label: "Tidak Aktif", value: "tidak aktif" },
        { label: "Digantung", value: "digantung" },
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
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === "kategori") setKategoriFilter(value);
    else if (key === "statusOperasi") setStatusFilter(value);
    else if (key === "zon") setZonFilter(value);
  };

  const getStatusTone = (status: InstitusiStatus) => {
    switch (status) {
      case "aktif":
        return "success";
      case "tidak aktif":
        return "warning";
      case "digantung":
        return "danger";
      default:
        return "neutral";
    }
  };

  // Humanize categories
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

  if (isRegistering) {
    return (
      <div className="space-y-6" id="institusi-page-container">
        <PageHeader
          title="Pendaftaran Institusi Swasta"
          subtitle="Isi borang di bawah untuk mendaftarkan Institusi Pendidikan Swasta (IPS) yang baharu."
        />
        <BorangPendaftaran onBack={() => {
          setIsRegistering(false);
          loadInstitusi();
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            const elem = document.getElementById("institusi-page-container");
            if (elem) {
              elem.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 100);
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="institusi-page-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Senarai Institusi Pendidikan Swasta"
          subtitle="Menguruskan pendaftaran, permit, dan zon operasi Institusi Pendidikan Swasta berdaftar di Gua Musang."
        />
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsRegistering(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-800 hover:bg-primary-900 text-white rounded-full transition-all cursor-pointer shadow-xs border border-primary-950/20"
          >
            <Plus className="w-4 h-4 text-secondary-300 font-extrabold" />
            <span>Daftar IPS Baru</span>
          </button>
          <button
            onClick={loadInstitusi}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400 font-bold" />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Loading Block */}
      {loading && (
        <div className="space-y-6" id="institusi-loading">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
          <LoadingSkeleton rows={6} />
        </div>
      )}

      {/* Error Block */}
      {!loading && error && (
        <div className="space-y-4" id="institusi-error">
          <EmptyState title="Ralat Memuat Data" description={error} />
          <div className="flex justify-center">
            <button
              onClick={loadInstitusi}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Cuba Semula
            </button>
          </div>
        </div>
      )}

      {/* Success Block */}
      {!loading && !error && (
        <>
          {/* Row 1: KPI Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="institusi-kpi-grid">
            <KpiCard
              label="Hasil Carian / Tapisan"
              value={kpiStats.totalFiltered}
              hint="Jumlah rekod memenuhi kriteria"
              tone="default"
            />
            <KpiCard
              label="Operasi Aktif"
              value={kpiStats.totalAktif}
              hint="Institusi aktif berdaftar"
              tone="success"
            />
            <KpiCard
              label="Berisiko / Pasif"
              value={kpiStats.totalPasif}
              hint="Tidak Aktif & Digantung"
              tone="warning"
            />
          </div>

          {/* Migration status report banner */}
          <div className="bg-slate-100/80 border border-slate-200/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left" id="migration-status-report">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary-100 rounded-xl text-primary-800 shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary-800" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Laporan Integrasi & Migrasi Firebase Auth
                </h4>
                <p className="text-xs text-slate-500 font-semibold max-w-xl">
                  Memantau transisi keselamatan dari kredensial hash yang lama kepada sistem kawalan pengesahan Firebase Authentication yang tulen.
                </p>
              </div>
            </div>

            {/* Stats badges side-by-side */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="bg-white border border-slate-250/50 px-3 py-1.5 rounded-lg text-center shadow-3xs">
                <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider">Legacy</span>
                <span className="text-xs font-black text-slate-700">{migrationStats.legacyCount}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200/50 px-3 py-1.5 rounded-lg text-center shadow-3xs">
                <span className="text-[10px] text-amber-600 font-extrabold block uppercase tracking-wider">Hybrid</span>
                <span className="text-xs font-black text-amber-700">{migrationStats.hybridCount}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-center shadow-3xs">
                <span className="text-[10px] text-emerald-600 font-extrabold block uppercase tracking-wider">Secure Auth</span>
                <span className="text-xs font-black text-emerald-700">{migrationStats.firebaseAuthOnlyCount}</span>
              </div>
            </div>
          </div>

          {/* Unified Carian & Filter Section */}
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm" id="filter-wrapper">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end w-full">
              {/* Search Box */}
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block pl-0.5">
                  Carian Institusi
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Masukkan nama institusi, no. rujukan pengelola, alamat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-2.5 font-semibold transition-all focus:border-primary-500 focus:bg-white focus:outline-hidden placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Reset trigger */}
              {(searchQuery || kategoriFilter !== "all" || statusFilter !== "all" || zonFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setKategoriFilter("all");
                    setStatusFilter("all");
                    setZonFilter("all");
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-100 transition-colors cursor-pointer self-start md:self-auto shrink-0 mb-0.5"
                >
                  Set Semula Tapisan
                </button>
              )}
            </div>

            {/* FilterBar selection drawer */}
            <FilterBar fields={filterFields} onChange={handleFilterChange} />
          </div>

          {/* Zero results block */}
          {filteredInstitusi.length === 0 ? (
            <EmptyState
              title="Tiada Institusi Bertepatan"
              description="Sila periksa kata kunci input atau ubah tetapan tapisan kategori, status operasi, dan zon Gua Musang yang dipilih."
            />
          ) : (
            <>
              {/* Desktop view (table) */}
              <div className="hidden md:block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm" id="desktop-tablet-view">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Nama Institusi</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Zon / No. Rujukan</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Mukim / Alamat</th>
                      <th className="py-3.5 px-4 text-right">Tarikh Daftar</th>
                      <th className="py-3.5 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {filteredInstitusi.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => {
                              setSelectedDetailInst(item);
                              setIsDetailOpen(true);
                            }}
                            className="font-extrabold text-slate-900 text-sm md:text-base hover:text-primary-800 hover:underline transition-all cursor-pointer text-left focus:outline-hidden"
                          >
                            {item.namaInstitusi}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 capitalize">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md text-xs font-semibold text-slate-700 uppercase">
                            {formatKategori(item.kategori)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block text-sm">{item.zon}</span>
                            <span className="text-xs text-slate-500 font-mono tracking-wide">{item.noRujukan}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <StatusBadge
                              label={item.statusOperasi === "aktif" ? "Aktif" : item.statusOperasi === "tidak aktif" ? "Tidak Aktif" : "Digantung"}
                              tone={getStatusTone(item.statusOperasi)}
                            />
                            {(!item.statusProfil || item.statusProfil === "belum-mula") && <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold tracking-wider">PROFIL BELUM MULA</span>}
                            {item.statusProfil === "sedang-dikemaskini" && <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded font-bold tracking-wider">DIKEMASKINI: {item.completionPercentage || 0}%</span>}
                            {item.statusProfil === "lengkap" && <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded font-bold tracking-wider">PROFIL LENGKAP</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold block truncate text-slate-800 text-sm">{item.mukim}</span>
                            <span className="text-xs text-slate-500 block truncate" title={item.alamat}>
                              {item.alamat || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600 font-bold text-xs md:text-sm">
                          {item.tarikhDaftar || "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedDetailInst(item);
                                setIsDetailOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full border border-slate-200 shadow-2xs cursor-pointer transition-all uppercase"
                              title="Papar Maklumat Detail IPS"
                            >
                              <Info className="w-3.5 h-3.5 text-slate-500 font-bold" />
                              <span>Profil</span>
                            </button>
                            <Link
                              to={`/pematuhan?instId=${item.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-primary-800 bg-primary-50 hover:bg-primary-100 rounded-full border border-primary-200 shadow-2xs cursor-pointer transition-all uppercase"
                              title="Buka Borang Pematuhan Institusi"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-secondary-600" />
                              <span>Pematuhan</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-slate-50 border-t border-slate-200 py-2.5 px-4 flex items-center justify-between text-xs text-slate-500 font-semibold tracking-wider">
                  <span>Sektor Pengurusan Sekolah - Gua Musang</span>
                  <span className="font-mono">Menaparkan {filteredInstitusi.length} daripada {institusi.length} institusi</span>
                </div>
              </div>

              {/* Mobile View (cards < 768px) */}
              <div className="md:hidden space-y-4" id="mobile-cards-view">
                {filteredInstitusi.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{formatKategori(item.kategori)}</span>
                        <h4 
                          onClick={() => {
                            setSelectedDetailInst(item);
                            setIsDetailOpen(true);
                          }}
                          className="text-base font-black text-slate-900 leading-snug hover:text-primary-800 hover:underline cursor-pointer text-left"
                        >
                          {item.namaInstitusi}
                        </h4>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge
                          label={item.statusOperasi === "aktif" ? "Aktif" : item.statusOperasi === "tidak aktif" ? "Tidak Aktif" : "Digantung"}
                          tone={getStatusTone(item.statusOperasi)}
                        />
                        {(!item.statusProfil || item.statusProfil === "belum-mula") && <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold tracking-wider">PROFIL BELUM MULA</span>}
                        {item.statusProfil === "sedang-dikemaskini" && <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded font-bold tracking-wider">DIKEMASKINI: {item.completionPercentage || 0}%</span>}
                        {item.statusProfil === "lengkap" && <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded font-bold tracking-wider">PROFIL LENGKAP</span>}
                      </div>
                    </div>

                    {/* Metadata items list */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-650">
                      <div className="flex items-center gap-1.5 col-span-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold truncate">{item.zon}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-xs font-semibold truncate">{item.noRujukan}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold truncate">{item.tarikhDaftar || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-1">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold truncate">{item.mukim || "N/A"}</span>
                      </div>
                    </div>

                    {/* Contact & Pengelola details if available */}
                    {(item.pengelola || item.telefon || item.alamat) && (
                      <div className="border-t border-dashed border-slate-150 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                        {item.pengelola && (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold truncate max-w-[130px]">{item.pengelola}</span>
                          </div>
                        )}
                        {item.telefon && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-800">{item.telefon}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Urus Pematuhan button for mobile */}
                    <div className="pt-1 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedDetailInst(item);
                          setIsDetailOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer uppercase font-sans"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-500 font-bold" />
                        <span>Profil IPS</span>
                      </button>
                      <Link
                        to={`/pematuhan?instId=${item.id}`}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-black text-primary-800 bg-primary-50 hover:bg-primary-100 rounded-xl border border-primary-200 shadow-2xs transition-all cursor-pointer uppercase font-sans"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-secondary-600 font-extrabold" />
                        <span>Pematuhan</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Institution Detail Modal containing history tab */}
          <InstitusiDetailModal
            isOpen={isDetailOpen}
            onClose={() => {
              setIsDetailOpen(false);
              setSelectedDetailInst(null);
            }}
            institusi={selectedDetailInst}
            onUpdate={loadInstitusi}
          />
        </>
      )}
    </div>
  );
}

export default InstitusiPage;
