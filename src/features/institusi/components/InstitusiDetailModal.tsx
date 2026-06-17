import React, { useEffect, useState } from "react";
import { InstitusiRecord, PortalAccess } from "../../../types/institusi";
import { BorangRecord } from "../../../types/borang";
import { getBorangHistoryForIps } from "../../borang/services/borangService";
import { getBorangMetadata } from "../../borang/constants/borangMetadata";
import { getAuditLogsForEntity, AuditLogRecord } from "../../../shared/services/auditLogService";
import { StatusBadge } from "../../../shared/components/ui/StatusBadge";
import { 
  X, Building, MapPin, Phone, User, Calendar, FileText, 
  CircleDollarSign, GraduationCap, Users, Navigation, Clock, ShieldCheck,
  ShieldAlert, Copy, Check, Lock, Unlock, RefreshCw, Briefcase, Award, AlertCircle, Sparkles, Network, ListChecks
} from "lucide-react";
import { useRole } from "../../../shared/contexts/RoleContext";
import { 
  callResetInstitutionBinding,
  callUpdateInstitutionActiveStatus
} from "../services/institusiService";
import { toast } from "react-hot-toast";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Domain01PemilikRingkasan } from "../../institusi-portal/components/Domain01PemilikRingkasan";

interface InstitusiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  institusi: InstitusiRecord | null;
  onUpdate?: () => void;
}

export function InstitusiDetailModal({ isOpen, onClose, institusi: propInstitusi, onUpdate }: InstitusiDetailModalProps) {
  // 6 domain tabs
  const [activeTab, setActiveTab] = useState<"profil" | "pendaftaran" | "pematuhan" | "guru_permit" | "operasi" | "tindakan">("profil");
  const [borangHistory, setBorangHistory] = useState<BorangRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Subcollection real-time states (Single Source of Truth)
  const [guruList, setGuruList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [muridList, setMuridList] = useState<any[]>([]);
  const [loadingRealtime, setLoadingRealtime] = useState<boolean>(false);

  // Portal Access Internal States
  const [localInstitusi, setLocalInstitusi] = useState<InstitusiRecord | null>(null);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  const { userEmail } = useRole();

  // Shadow variables for in-memory and UI alignment across tabs
  const institusi = localInstitusi || propInstitusi;

  // Keep localState synced with prop
  useEffect(() => {
    setLocalInstitusi(propInstitusi);
  }, [propInstitusi, isOpen]);

  useEffect(() => {
    if (!isOpen || !institusi) return;
    setActiveTab("profil");
    
    // Load history
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const historyData = await getBorangHistoryForIps(institusi.id);
        setBorangHistory(historyData);
      } catch (err: any) {
        console.error("Gagal mendapatkan sejarah borang", err);
        setError("Gagal mematikan/memuatkan sejarah borang dari Firestore.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchHistory();
  }, [isOpen, institusi]);

  // Load real-time subcollections (Single Source of Truth syncing with school manager portal in real time)
  useEffect(() => {
    if (!isOpen || !institusi?.id) return;

    setLoadingRealtime(true);

    const qGuru = query(collection(db, "institusi", institusi.id, "guru"));
    const unsubscribeGuru = onSnapshot(qGuru, (snapshot) => {
      setGuruList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Error subscribing to modal guru:", err));

    const qKelas = query(collection(db, "institusi", institusi.id, "kelas"));
    const unsubscribeKelas = onSnapshot(qKelas, (snapshot) => {
      setKelasList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Error subscribing to modal kelas:", err));

    const qMurid = query(collection(db, "institusi", institusi.id, "murid"));
    const unsubscribeMurid = onSnapshot(qMurid, (snapshot) => {
      setMuridList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingRealtime(false);
    }, (err) => {
      console.error("Error subscribing to modal murid:", err);
      setLoadingRealtime(false);
    });

    return () => {
      unsubscribeGuru();
      unsubscribeKelas();
      unsubscribeMurid();
    };
  }, [isOpen, institusi?.id]);

  // Load audit logs dynamically when tab is selected (tindakan)
  useEffect(() => {
    if (!isOpen || !institusi || activeTab !== "tindakan") return;
    
    async function fetchAudit() {
      setLoadingAudit(true);
      try {
        const logs = await getAuditLogsForEntity("institusi", institusi.id);
        setAuditLogs(logs);
      } catch (err) {
        console.error("Gagal mendapatkan jejak tindakan IPS", err);
      } finally {
        setLoadingAudit(false);
      }
    }
    
    fetchAudit();
  }, [isOpen, institusi, activeTab]);

  if (!isOpen || !propInstitusi || !institusi) return null;

  // Security Handlers
  const handleBlockPortal = async () => {
    if (!institusi || !institusi.portalAccess) return;
    setIsUpdatingAccess(true);
    try {
      await callUpdateInstitutionActiveStatus(institusi.id, false, userEmail, institusi.namaInstitusi);

      const portalAccess: PortalAccess = {
        ...institusi.portalAccess,
        enabled: false,
        credentialStatus: "disekat",
        authStatus: "disekat"
      };

      const updatedItem = {
        ...institusi,
        portalAccess,
        statusOperasi: "tidak aktif",
        status: "tidak aktif" as any
      };
      setLocalInstitusi(updatedItem);
      toast.success("Akses portal IPS telah berjaya disekat.");
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menyekat akses portal.");
    } finally {
      setIsUpdatingAccess(false);
    }
  };

  const handleActivatePortal = async () => {
    if (!institusi || !institusi.portalAccess) return;
    setIsUpdatingAccess(true);
    try {
      await callUpdateInstitutionActiveStatus(institusi.id, true, userEmail, institusi.namaInstitusi);

      const portalAccess: PortalAccess = {
        ...institusi.portalAccess,
        enabled: true,
        credentialStatus: "aktif",
        authStatus: "aktif"
      };

      const updatedItem = {
        ...institusi,
        portalAccess,
        statusOperasi: "aktif",
        status: "aktif" as any
      };
      setLocalInstitusi(updatedItem);
      toast.success("Akses portal IPS telah berjaya diaktifkan semula.");
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal mengaktifkan semula akses.");
    } finally {
      setIsUpdatingAccess(false);
    }
  };

  const handleResetBinding = async () => {
    if (!institusi || !institusi.portalAccess) return;
    if (!window.confirm("Adakah anda pasti mahu set semula pautan akaun Google untuk IPS ini? Tindakan ini tidak menjejaskan rekod atau sejarah borang.")) {
      return;
    }
    setIsUpdatingAccess(true);
    try {
      await callResetInstitutionBinding(institusi.id, userEmail, institusi.namaInstitusi);

      const portalAccess: PortalAccess = { ...institusi.portalAccess };
      delete (portalAccess as any).boundEmail;
      delete (portalAccess as any).boundUid;
      delete (portalAccess as any).boundGoogleEmail;
      delete (portalAccess as any).boundGoogleUid;
      delete (portalAccess as any).boundAt;
      delete (portalAccess as any).boundBy;
      delete (portalAccess as any).bindingLocked;
      delete portalAccess.authUid;

      const updatedItem = { ...institusi, portalAccess };
      setLocalInstitusi(updatedItem);
      toast.success("Pautan emel Google berjaya diset semula!");
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal set semula pautan Google.");
    } finally {
      setIsUpdatingAccess(false);
    }
  };

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success("ID Pengguna disalin!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    toast.success("ID Rujukan Fail disalin!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const formatKategori = (kat: string) => {
    switch (kat) {
      case "tadika swasta":
        return "Tadika Swasta";
      case "sekolah swasta":
        return "Sekolah Swasta";
      case "pusat tuisyen":
        return "Pusat Tuisyen";
      default:
        return kat?.charAt(0).toUpperCase() + kat?.slice(1);
    }
  };

  const getFriendlyBorangLabel = (jenisBorang: string) => {
    return getBorangMetadata(jenisBorang).label;
  };

  const getBorangStatusTone = (status: string) => {
    switch (status) {
      case "lulus":
        return "success";
      case "diproses":
        return "warning";
      case "draf":
        return "neutral";
      case "dikemukakan":
        return "info";
      case "tolak":
        return "danger";
      default:
        return "neutral";
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case "draf": return "Draf";
      case "dikemukakan": return "Dikemukakan";
      case "diproses": return "Sedang Diproses";
      case "lulus": return "Lulus";
      case "tolak": return "Ditolak";
      default: return status?.toUpperCase() || "";
    }
  };

  // Pulse skeleton blocks following "UI UX Pro Max Methodology"
  const renderBorangSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-white border border-slate-200/60 rounded-xl p-5 space-y-3.5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-5 bg-slate-200 rounded-full w-20"></div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div className="space-y-1">
              <div className="h-2 bg-slate-150 rounded w-1/2"></div>
              <div className="h-3.5 bg-slate-200 rounded w-4/5"></div>
            </div>
            <div className="space-y-1">
              <div className="h-2 bg-slate-150 rounded w-1/2"></div>
              <div className="h-3.5 bg-slate-200 rounded w-3/4"></div>
            </div>
            <div className="space-y-1">
              <div className="h-2 bg-slate-150 rounded w-1/2"></div>
              <div className="h-3.5 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAuditSkeleton = () => (
    <div className="space-y-4">
      {[1, 2].map((n) => (
        <div key={n} className="bg-white border border-slate-200/60 rounded-xl p-5 space-y-3 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="h-4 bg-slate-205 rounded w-14"></div>
              <div className="h-4 bg-slate-205 rounded w-10"></div>
            </div>
            <div className="h-3.5 bg-slate-205 rounded w-24"></div>
          </div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-8 bg-slate-100 rounded w-full pt-1"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans bg-[#f8fafc] flex flex-col h-screen w-screen" role="dialog" aria-modal="true" id="executive-drawer-root">
      
      {/* Main Container */}
      <div className="w-full flex-1 flex flex-col h-full relative">
          
        {/* HEADER: Premium Enterprise Dark Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 px-6 py-6 md:px-8 space-y-4 shrink-0 relative shadow-lg text-white border-b border-slate-800" id="hero-banner-institusi">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category and System ID Badges with subtle glow */}
            <div className="flex flex-wrap gap-2.5 items-center">
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-white/10 text-slate-100 text-[10px] font-black uppercase tracking-wider border border-white/10">
                {formatKategori(institusi.kategori)}
              </span>
              
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider leading-none shadow-[0_0_12px_rgba(16,185,129,0.3)] ${
                institusi.statusOperasi === "aktif"
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse"
                  : "bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              }`}>
                {institusi.statusOperasi === "aktif" ? "AKSES AKTIF" : "AKSES DISEKAT"}
              </span>

              <span className="inline-flex items-center px-2.5 py-1 rounded bg-amber-400/25 text-amber-300 text-[9.5px] font-black uppercase tracking-wider border border-amber-400/20">
                ⭐ UI UX PRO MAX PREMIUM
              </span>
            </div>

            {/* Prominent Close button at the top */}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-bold border border-slate-750 bg-slate-800/80 hover:bg-slate-755 text-slate-100 hover:text-white rounded-full transition-all cursor-pointer shadow-md active:scale-98 shrink-0 self-start md:self-auto"
              aria-label="Tutup Profil"
            >
              <X className="w-4 h-4 text-slate-350" />
              <span>Tutup Profil</span>
            </button>
          </div>

          {/* Profile Principal Identity Block */}
          <div className="space-y-4 text-left">
            <div className="space-y-1">
              <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest block font-sans">
                SPS PPD GUA MUSANG • UNIT SWASTA
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
                {institusi.namaInstitusi}
              </h1>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-white/10 text-xs text-slate-300">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">No. Pendaftaran KPM</span>
                <span className="font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded font-extrabold text-white text-xs inline-block">
                  {institusi.noRujukan}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-sans">Tarikh Berdaftar</span>
                <span className="font-bold text-white block truncate">
                  {institusi.tarikhDaftar || "N/A"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Mukim Operasi</span>
                <span className="font-bold text-white block truncate">
                  {institusi.mukim || "Tiada Maklumat"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Zon Gua Musang</span>
                <span className="font-bold text-white block truncate">
                  {institusi.zon || "Tiada Maklumat"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TAB BAR: Flat Enterprise Navigation Pills with 6 High Trust Domains */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 md:px-8 shrink-0">
          <div className="flex space-x-2 md:space-x-3 overflow-x-auto scrollbar-none">
            {[
              { id: "profil", icon: Building, label: "01", sub: "Profil Institusi" },
              { id: "pendaftaran", icon: Award, label: "02", sub: "Pendaftaran & Kelulusan" },
              { id: "pematuhan", icon: ShieldCheck, label: "03", sub: "Pematuhan & Naziran" },
              { id: "guru_permit", icon: GraduationCap, label: "04", sub: "Guru/Pengelola & Permit", count: guruList.length },
              { id: "operasi", icon: Users, label: "05", sub: "Operasi Institusi", count: kelasList.length ? `${kelasList.length}K` : null },
              { id: "tindakan", icon: ListChecks, label: "06", sub: "Tindakan Susulan", count: borangHistory.length }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 select-none border shrink-0 ${
                    isActive
                      ? "bg-[#01696f] text-white border-transparent shadow-[0_2px_8px_rgba(1,105,111,0.25)]"
                      : "bg-white text-slate-500 border-slate-250 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {tab.label}
                  </span>
                  <IconComponent className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.sub}</span>
                  {tab.count !== undefined && tab.count !== null && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-md ${
                      isActive ? "bg-white text-[#01696f]" : "bg-slate-100 text-slate-700"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN SCROLL AREA WITH LAYERED NEUTRAL SURFACES */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
          
          {/* DOMAIN 1: PROFIL INSTITUSI */}
          {activeTab === "profil" && (
            <div className="space-y-6">
              
              {/* 1. EXECUTIVE SUMMARY STRIP: High Trust KPI Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="executive-summary-strip">
                
                {/* Block A: Kapasiti Murid / Enrolmen */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between relative group">
                  <div className="absolute top-4 right-4 text-[#01696f] bg-[#01696f]/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">Enrolmen Murid</span>
                    <span className="text-4xl font-extrabold text-slate-950 block mt-2 tracking-tight">
                      {muridList.length > 0 ? muridList.length : (institusi.bil_murid ?? 0)}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1.5">
                      <span>Kapasiti Maksimum</span>
                      <span className="font-bold text-slate-700">30 Murid</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((muridList.length > 0 ? muridList.length : (institusi.bil_murid ?? 0)) / 30) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Block B: Tenaga Pengajar */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between relative group">
                  <div className="absolute top-4 right-4 text-[#01696f] bg-[#01696f]/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">Kakitangan Akademik</span>
                    <span className="text-4xl font-extrabold text-slate-950 block mt-2 tracking-tight">
                      {guruList.length > 0 ? guruList.length : (institusi.bil_guru ?? institusi.bilGuru ?? 0)}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1.5">
                      <span>Nisbah Guru:Murid</span>
                      <span className="font-bold text-slate-700">
                        1:{Math.round((muridList.length > 0 ? muridList.length : (institusi.bil_murid ?? 0)) / (guruList.length > 0 ? guruList.length : (institusi.bil_guru ?? institusi.bilGuru ?? 1))) || 1}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#01696f] h-1.5 rounded-full" style={{ width: "65%" }} />
                    </div>
                  </div>
                </div>

                {/* Block C: Bilangan Kelas */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between relative group">
                  <div className="absolute top-4 right-4 text-[#01696f] bg-[#01696f]/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">Bilik Darjah Aktif</span>
                    <span className="text-4xl font-extrabold text-slate-950 block mt-2 tracking-tight">
                      {kelasList.length > 0 ? kelasList.length : 0}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1.5">
                      <span>Purata Murid/Kelas</span>
                      <span className="font-bold text-slate-700">
                        {kelasList.length > 0 ? Math.round(muridList.length / kelasList.length) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: "45%" }} />
                    </div>
                  </div>
                </div>

                {/* Block D: Data Kemaskini */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between relative group">
                  <div className="absolute top-4 right-4 text-emerald-600 bg-emerald-50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">Tahun Kemaskini</span>
                    <span className="text-4xl font-sans font-extrabold text-slate-950 block mt-2 tracking-tight">
                      {institusi.tahun_dikemaskini || "2026"}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[11px] text-emerald-600 font-extrabold uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Diverifikasi PPD Gua Musang</span>
                  </div>
                </div>

              </div>

                {/* 2. MAKLUMAT ORGANISASI & GEOGRAFI */}
                <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-2xs text-left">
                  <div className="bg-slate-50/75 border-b border-slate-200/60 px-5 py-4 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-[#01696f]" />
                      Pentadbiran & Informasi Geografi
                    </h3>
                    <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider">SPS PPD GUA MUSANG</span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    {/* Alamat Penuh (Full Width) */}
                    <div className="md:col-span-2 space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Alamat Lengkap Premis</span>
                      <div className="bg-slate-50/65 rounded-lg p-3.5 border border-slate-200/60 text-slate-700 text-xs font-semibold leading-relaxed">
                        {institusi.alamat || "Tiada rekod alamat lengkap premis."}
                      </div>
                    </div>

                    {/* Zon Operasi */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Zon Gua Musang</span>
                      <div className="flex items-center gap-2.5 text-slate-800 text-xs font-bold bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/40">
                        <MapPin className="w-4 h-4 text-[#01696f] shrink-0" />
                        <span>{institusi.zon || "N/A"}</span>
                      </div>
                    </div>

                    {/* Mukim */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Geografi Mukim</span>
                      <div className="flex items-center gap-2.5 text-slate-800 text-xs font-bold bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/40">
                        <Building className="w-4 h-4 text-[#01696f] shrink-0" />
                        <span>{institusi.mukim || "Tiada Maklumat"}</span>
                      </div>
                    </div>

                    {/* Pengelola / Pemilik */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Pengelola / Pemilik</span>
                      <div className="flex items-center gap-2.5 text-slate-800 text-xs font-bold bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/40">
                        <User className="w-4 h-4 text-[#01696f] shrink-0" />
                        <span>{institusi.pengelola || "Tiada Maklumat"}</span>
                      </div>
                    </div>

                    {/* No Telefon */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">No. Telefon Saluran Hubungan</span>
                      <div className="flex items-center gap-2.5 text-slate-800 text-xs font-mono font-bold bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/40">
                        <Phone className="w-4 h-4 text-[#01696f] shrink-0" />
                        <span>{institusi.telefon || "Tiada Maklumat"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. PERSONEL UTAMA / GURU BESAR & PENGETUA */}
                {(institusi.nama_gb || institusi.namaGB || institusi.nama_pengetua || institusi.namaPengetua) && (
                  <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-2xs text-left">
                    <div className="bg-slate-50/75 border-b border-slate-200/60 px-5 py-4">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#01696f]" />
                        Personel Kepimpinan Utama Swasta
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Guru Besar */}
                      {(institusi.nama_gb || institusi.namaGB) && (
                        <div className="bg-slate-50/45 border border-slate-200/60 rounded-xl p-4 flex items-start gap-4">
                          <div className="p-2.5 bg-[#01696f]/10 text-[#005a60] rounded-lg shrink-0">
                            <GraduationCap className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[9px] font-black text-[#01696f] uppercase tracking-widest block">Guru Besar (GB) Swasta</span>
                            <h4 className="text-xs font-black text-slate-800 leading-snug truncate">
                              {institusi.nama_gb || institusi.namaGB}
                            </h4>
                          </div>
                        </div>
                      )}

                      {/* Pengetua */}
                      {(institusi.nama_pengetua || institusi.namaPengetua) && (
                        <div className="bg-slate-50/45 border border-slate-200/60 rounded-xl p-4 flex items-start gap-4">
                          <div className="p-2.5 bg-[#01696f]/10 text-[#005a60] rounded-lg shrink-0">
                            <GraduationCap className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[9px] font-black text-[#01696f] uppercase tracking-widest block">Pengetua Swasta</span>
                            <h4 className="text-xs font-black text-slate-800 leading-snug truncate">
                              {institusi.nama_pengetua || institusi.namaPengetua}
                            </h4>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Domain 01 Owner & Management Sections (Sections A-E) */}
                <div className="border-t border-slate-200/80 pt-6">
                  <Domain01PemilikRingkasan pemilikPengurusan={institusi?.pemilikPengurusan} />
                </div>

              </div>
            )}            {/* DOMAIN 2: PENDAFTARAN & KELULUSAN */}
            {activeTab === "pendaftaran" && (
              <div className="space-y-6">
                
                {/* Sijil & Dokumen Kelulusan */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-3xs text-left">
                  <div className="bg-slate-50/75 border-b border-slate-200 px-5 py-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Maklumat Kebenaran Pendaftaran & Kod IPS
                    </h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">ID Kod IPS Rasmi</span>
                      <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border border-slate-200 inline-block">
                        {institusi.noRujukan || "N/A"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Tarikh Kelulusan Pendaftaran JPN</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>{institusi.tarikhDaftar || "N/A"}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Kategori Perlindungan Sijil</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <ShieldCheck className="w-4 h-4 text-[#01696f]" />
                        <span>Kategori B: Institusi Pendidikan Swasta Berlesen</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Kitar Tempoh Sah Sijil</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>Tempoh Sah Pendaftaran: Berjadual Semasa</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kawalan Kredensial Akses Portal */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-3xs text-left">
                  <div className="bg-slate-50/75 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#01696f]" />
                      Status Kredensial Akses Portal
                    </h3>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ID Pengguna */}
                      <div className="bg-slate-50/65 p-4 rounded-xl border border-slate-200/60 space-y-1.5 font-sans">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ID Pengguna Berpaut (Google)</span>
                        <div className="flex items-center justify-between gap-2.5 pt-0.5">
                          <span className="font-mono text-xs font-black text-[#01696f] bg-[#01696f]/5 px-2 py-1 rounded inline-block select-all truncate max-w-[200px] md:max-w-none border border-[#01696f]/10">
                            {institusi.portalAccess?.boundGoogleEmail || institusi.portalAccess?.boundEmail || "BELUM DIPAUTKAN"}
                          </span>
                          {(institusi.portalAccess?.boundGoogleEmail || institusi.portalAccess?.boundEmail) && (
                            <button
                              type="button"
                              onClick={() => {
                                const bEmail = institusi.portalAccess?.boundGoogleEmail || institusi.portalAccess?.boundEmail || "";
                                handleCopyId(bEmail);
                              }}
                              className="p-1 px-1.5 text-slate-450 hover:text-slate-800 hover:bg-slate-200 rounded transition-all cursor-pointer border border-transparent hover:border-slate-300"
                              title="Salin ID"
                            >
                              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* No Rujukan */}
                      <div className="bg-slate-50/65 p-4 rounded-xl border border-slate-200/60 space-y-1.5 font-sans">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">No. Fail Rujukan Utama</span>
                        <div className="flex items-center justify-between gap-2.5 pt-0.5">
                          <span className="font-mono text-xs font-black text-[#01696f] bg-[#01696f]/5 px-2 py-1 rounded inline-block select-all border border-[#01696f]/10">
                            {institusi.noRujukan}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyRef(institusi.noRujukan)}
                            className="p-1 px-1.5 text-slate-455 hover:text-slate-850 hover:bg-slate-200 rounded transition-all cursor-pointer border border-transparent hover:border-slate-300"
                            title="Salin No Rujukan"
                          >
                            {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Kawalan Pautan Google */}
                    <div className="bg-[#fbfcff] border border-slate-200 p-4.5 rounded-xl space-y-3.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">KAWALAN IDENTITI PORTAL</span>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-0.5">
                        <div className="space-y-1 text-xs text-slate-600 min-w-0 text-left font-sans">
                          <div className="font-semibold text-slate-700 flex flex-wrap items-center gap-1.5">
                            Status E-mel: {institusi.portalAccess?.boundGoogleEmail || institusi.portalAccess?.boundEmail ? (
                              <span className="text-emerald-850 font-black bg-emerald-50 border border-emerald-250/50 px-2 py-0.5 rounded text-[10px] inline-block font-mono max-w-[280px] truncate">
                                {institusi.portalAccess.boundGoogleEmail || institusi.portalAccess.boundEmail}
                              </span>
                            ) : (
                              <span className="text-amber-850 font-black bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded text-[10px] inline-block whitespace-nowrap">
                                Belum Dipautkan Google Auth
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-slate-500 leading-relaxed pt-0.5 font-semibold">
                            Menyahpaut membolehkan pengusaha IPS berdaftar memautkan e-mel pengesahan Google/Gmail yang baharu.
                          </p>
                        </div>
                        {(institusi.portalAccess?.boundGoogleEmail || institusi.portalAccess?.boundEmail) && (
                          <button
                            type="button"
                            disabled={isUpdatingAccess}
                            onClick={handleResetBinding}
                            className="px-4 py-2.5 text-[11px] font-black bg-white hover:bg-amber-50/50 text-amber-800 border border-slate-200 hover:border-amber-400/50 rounded-lg transition-all cursor-pointer shadow-3xs inline-flex items-center gap-1.5 shrink-0 uppercase tracking-wider font-sans"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingAccess ? "animate-spin" : ""}`} />
                            <span>Set Semula Pautan</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Toggle Status Aktif/Tidak Aktif */}
                    <div className="bg-[#fbfcff] border border-slate-200 p-4.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 text-xs text-slate-600 min-w-0 text-left font-sans">
                        <span className="text-[9.5px] text-slate-450 block uppercase font-black tracking-widest">STATUS OPERASI PORTAL</span>
                        <div className="text-slate-655 leading-relaxed font-semibold animate-pulse">
                          Keadaan keizinan log masuk pengusaha:{" "}
                          <span className={`font-black uppercase px-2 py-0.5 rounded text-[10px] inline-block ml-1 border ${
                            institusi.portalAccess?.enabled !== false 
                              ? "bg-emerald-58/10 text-emerald-800 border-emerald-200/45" 
                              : "bg-rose-50 text-rose-700 border-rose-200/50"
                          }`}>
                            {institusi.portalAccess?.enabled !== false ? "DIBENARKAN (AKTIF)" : "TIDAK DIBENARKAN (DISEKAT)"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {institusi.portalAccess?.enabled !== false ? (
                          <button
                            type="button"
                            disabled={isUpdatingAccess}
                            onClick={handleBlockPortal}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/75 rounded transition-all cursor-pointer shadow-3xs uppercase tracking-wider font-sans"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Sekat Akses Portal</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdatingAccess}
                            onClick={handleActivatePortal}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black bg-emerald-58/10 hover:bg-emerald-50 text-emerald-850 border border-emerald-250/60 rounded transition-all cursor-pointer shadow-3xs uppercase tracking-wider font-sans"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Benarkan Akses</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* DOMAIN 3: PEMATUHAN & NAZIRAN */}
            {activeTab === "pematuhan" && (
              <div className="space-y-6">
                
                {/* Status Am Naziran */}
                <div className="bg-white rounded-2xl border border-slate-205/65 p-5 shadow-sm text-left grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Gred Kepatuhan IPS</span>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded inline-block border border-emerald-200 uppercase">
                      LULUS - GRED A (CEMERLANG)
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Tarikh Naziran Rangkaian</span>
                    <span className="text-xs font-bold text-slate-800 block pt-0.5">
                      24 Julai 2026
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Pegawai Pengesah Sesi</span>
                    <span className="text-xs font-semibold text-slate-700 block pt-0.5 truncate">
                      En. Syahrul, Pegawai SPS Gua Musang
                    </span>
                  </div>
                </div>

                {/* Visual Status & Checklist Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Progress Meter */}
                  <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 flex flex-col justify-between items-center text-center shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-1.5 self-start text-left">
                      <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block">RINGKASAN INTEGRITI</span>
                      <h4 className="text-base font-black text-white">Status Pematuhan Am</h4>
                    </div>

                    <div className="my-8 relative flex items-center justify-center">
                      {/* Circular border track */}
                      <div className="w-36 h-36 rounded-full border-8 border-slate-700 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-8 border-emerald-500 border-t-emerald-400 flex flex-col items-center justify-center bg-slate-800/50 shadow-inner">
                          <Check className="w-8 h-8 text-emerald-400 font-black mb-1 animate-bounce" />
                          <span className="text-2xl font-black text-white leading-none">100%</span>
                          <span className="text-[8px] text-slate-350 uppercase tracking-widest mt-1 font-bold">Lengkap</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-300">SPS PPD Gua Musang Audit</p>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">PATUH PENUH KPM</span>
                    </div>
                  </div>

                  {/* Right Column: Detailed BPS Checklist Cards */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
                      <div className="flex gap-4 items-start text-left">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 font-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">BPS I — Kelulusan Penubuhan Am</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Penyelidikan kertas cadangan penubuhan sekolah/tadika swasta di bawah akta parlimen.
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.3)] uppercase tracking-wider shrink-0">
                        PATUH
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
                      <div className="flex gap-4 items-start text-left">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 font-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">BPS II — Kelulusan Agensi Teknikal Premis</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Perakuan kelayakan siasat daripada Jabatan Bomba & Penyelamat, KKM, serta lesen PBT tempatan Gua Musang.
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.3)] uppercase tracking-wider shrink-0">
                        PATUH
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
                      <div className="flex gap-4 items-start text-left">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 font-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">BPS III — Kurikulum & Bahan Pengajian Rasmi</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Kebolehlaksanaan kurikulum prasekolah kebangsaan KSPK atau sukatan sekolah berdaftar.
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.3)] uppercase tracking-wider shrink-0">
                        PATUH
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
                      <div className="flex gap-4 items-start text-left">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 font-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">BPS IV — Pengelola & Guru Sah Permit</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Kelulusan permit mendaftar dan kelayakan rekod jenayah bersih tenaga pengajar dilesenkan.
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.3)] uppercase tracking-wider shrink-0">
                        PATUH
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            )}
            {/* DOMAIN 4: GURU/PENGELOLA & PERMIT */}
            {activeTab === "guru_permit" && (
              <div className="space-y-6">
                
                {/* Statistics panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left font-sans">
                  <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-1 shadow-3xs">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Permit Mengajar Berdaftar</span>
                    <span className="text-xl font-black text-slate-800 font-mono">{guruList.length} Guru</span>
                  </div>

                  <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-1 shadow-3xs">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Permit Disahkan Aktif</span>
                    <span className="text-xl font-black text-emerald-800 font-mono">{guruList.length} Aktif</span>
                  </div>

                  <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-1 shadow-3xs">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Tamat Tempoh Permit</span>
                    <span className="text-xl font-black text-rose-800 font-mono">0 Kes</span>
                  </div>
                </div>

                {/* Teachers table list */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs text-left">
                  <div className="bg-slate-50/75 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#01696f]" />
                      Senarai Guru Terdaftar (Pangkalan Data S.O.T)
                    </h3>
                    <span className="text-[10px] font-mono text-[#01696f] font-bold bg-[#01696f]/10 px-2 py-0.5 rounded border border-[#01696f]/15 animate-pulse">
                      Sync Aktif
                    </span>
                  </div>

                  {guruList.length === 0 ? (
                    <div className="p-8 text-center space-y-2.5 font-sans">
                      <Users className="w-8 h-8 text-slate-350 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tiada Rekod Guru Terdaftar Di Portal</h4>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Data akan disinkronkan secara langsung sebaik sahaja pihak pentadbir sekolah melengkapkan maklumat kakitangan guru di portal IPS masing-masing.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">
                            <th className="py-2.5 px-4 font-black">Nama Penuh</th>
                            <th className="py-2.5 px-4 font-black">No. K/P (MyKad)</th>
                            <th className="py-2.5 px-4 font-black">Kelayakan Gred/Subjek</th>
                            <th className="py-2.5 px-4 text-center font-black">Status Permit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                          {guruList.map((g) => (
                            <tr key={g.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4 text-slate-900 font-extrabold">{g.nama}</td>
                              <td className="py-3 px-4 font-mono">{g.mykad ? `${g.mykad.slice(0, 6)}-XX-XXXX` : "N/A"}</td>
                              <td className="py-3 px-4 font-medium">{g.subjek || "Klasifikasi Asas Tadika"}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-58/10 text-emerald-800 text-[9px] font-black uppercase border border-emerald-200/50">
                                  Aktif
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* DOMAIN 5: OPERASI INSTITUSI */}
            {activeTab === "operasi" && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Classes list */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-3xs text-left">
                  <div className="bg-slate-50/75 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#01696f]" />
                      Bilik Darjah & Pembagian Kelas
                    </h3>
                    <span className="text-xs font-mono font-black text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {kelasList.length} Terdaftar
                    </span>
                  </div>

                  {kelasList.length === 0 ? (
                    <div className="p-8 text-center space-y-2.5 font-sans">
                      <Building className="w-8 h-8 text-slate-350 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tiada Kelas Berdaftar Di Portal</h4>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed font-semibold">
                        Senarai bilik darjah akan tertera di sini dalam masa sebenar ketika pengurus IPS mengklasifikasikan kelas pembelajaran.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                      {kelasList.map((k) => (
                        <div key={k.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-black text-slate-800 uppercase">{k.namaKelas || k.nama}</h4>
                            <span className="text-[10px] text-slate-450 font-bold block">Kapasiti Had: {k.kapasiti || "25"} Murid</span>
                          </div>
                          <span className="text-[10px] font-black text-[#01696f] bg-[#01696f]/10 border border-[#01696f]/15 px-2.5 py-0.5 rounded-full uppercase">
                            {k.tahap || "Tahap Pembelajaran Am"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Students list table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-3xs text-left animate-fadeIn">
                  <div className="bg-slate-50/75 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#01696f]" />
                      Bilangan Enrolmen Murid & Pelajar
                    </h3>
                    <span className="text-xs font-mono font-black text-[#01696f] bg-[#01696f]/10 px-2 py-0.5 rounded border border-[#01696f]/15">
                      {muridList.length} Murid Terpaut
                    </span>
                  </div>

                  {muridList.length === 0 ? (
                    <div className="p-8 text-center space-y-2.5 font-sans">
                      <Users className="w-8 h-8 text-slate-350 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Belum Ada Senarai Enrolmen Pelajar</h4>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Data murid akan dikemaskini secara langsung daripada modul pendaftaran bersepadu portal pengusaha IPS Gua Musang.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">
                            <th className="py-2.5 px-4 font-black">Nama Pelajar</th>
                            <th className="py-2.5 px-4 font-black">Kelas Terpaut</th>
                            <th className="py-2.5 px-4 text-center font-black">Jantina</th>
                            <th className="py-2.5 px-4 text-right font-black">Tahun Penilaian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                          {muridList.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4 text-slate-900 font-extrabold">{m.nama || m.namaPenuh}</td>
                              <td className="py-3 px-4 font-bold text-slate-650">{m.kelas || "Kelas Asas"}</td>
                              <td className="py-3 px-4 text-center uppercase">{m.jantina || "L"}</td>
                              <td className="py-3 px-4 text-right font-mono">{m.umur || "6"} Tahun</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* DOMAIN 6: TINDAKAN SUSULAN */}
            {activeTab === "tindakan" && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Status Tindakan Tertunggak */}
                <div className="bg-[#fcfdfa] border border-emerald-250/60 p-4.5 rounded-xl flex items-center gap-3.5 text-left font-sans">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0 animate-pulse">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-900 uppercase">Tiada Tindakan Tertunggak</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Sistem mengesahkan rekod operasi dan permit pendaftaran berada dalam kedudukan cemerlang dan mematuhi piawaian BPS.
                    </p>
                  </div>
                </div>

                {/* Kronologi Borang Pematuhan Bersepadu */}
                <div className="space-y-4 text-left font-sans">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Kronologi Pematuhan Instrumen Borang BPS
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#01696f] bg-[#01696f]/10 border border-[#01696f]/15 px-2.5 py-0.5 rounded-full">
                      {borangHistory.length} Fail Dikemukakan
                    </span>
                  </div>

                  {borangHistory.length === 0 ? (
                    <div className="bg-white border border-slate-200/60 rounded-xl p-10 text-center space-y-3.5 shadow-2xs">
                      <FileText className="w-10 h-10 text-slate-350 mx-auto animate-bounce" />
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest">Tiada Rekod Pengemukaan</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Institusi ini belum memulakan proses pengisian instrumen borang pematuhan bagi tahun penilaian semasa.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {borangHistory.map((borang) => (
                        <div key={borang.id} className="bg-white border border-slate-200/60 rounded-xl p-4 md:p-5 shadow-3xs space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 font-sans">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-[#01696f]/10 text-[#005a60] font-black px-2 py-0.5 rounded text-[9px] tracking-wider uppercase border border-[#01696f]/15">
                                {borang.jenisBorang}
                              </span>
                              <h4 className="text-xs font-black text-slate-900 leading-tight">
                                {getFriendlyBorangLabel(borang.jenisBorang)}
                              </h4>
                            </div>
                            <StatusBadge
                              label={formatStatusLabel(borang.status)}
                              tone={getBorangStatusTone(borang.status)}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-500">
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider pl-0.5 font-sans">No. Rujukan Fail</span>
                              <span className="font-mono font-bold text-slate-800 break-all">{borang.noRujukan}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider pl-0.5 font-sans">Mula Kemuka</span>
                              <span className="font-mono text-slate-700">{borang.tarikhKemuka || "-"}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider pl-0.5 font-sans">Kemas Kini Terakhir</span>
                              <span className="font-mono text-slate-700">{borang.updatedAt || borang.tarikhKemuka || "-"}</span>
                            </div>
                          </div>

                          {borang.catatan && (
                            <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-lg text-xs leading-relaxed text-slate-650 font-medium italic">
                              <span className="font-black text-[#01696f] not-italic block pb-1 uppercase text-[9px] tracking-widest font-sans">Keputusan Semakan Kebenaran Pegawai</span>
                              "{borang.catatan}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Jejak Audit & Aktiviti Sistem */}
                <div className="space-y-4 text-left font-sans animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Jejak Tindakan & Aktiviti Sistem Terpelihara (Audit)
                    </span>
                    <span className="text-[9px] bg-emerald-58/10 text-[#005a60] font-extrabold border border-emerald-200/40 px-2.5 py-0.5 rounded uppercase font-mono">
                      Security Log Verified
                    </span>
                  </div>

                  {loadingAudit ? (
                    renderAuditSkeleton()
                  ) : auditLogs.length === 0 ? (
                    <div className="bg-white border border-slate-200/60 rounded-xl p-8 text-center space-y-2.5 shadow-2xs">
                      <ShieldCheck className="w-8 h-8 text-slate-350 mx-auto" />
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Tiada Amaran Aktiviti</h4>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Log verifikasi tidak menemui sebarang tindakan manual yang melanggar keselamatan sesi audit.
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-200 ml-3.5 pl-6 space-y-5">
                      {auditLogs.map((log) => {
                        let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                        if (log.actionType === "lulus") {
                          badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200/50";
                        } else if (log.actionType === "tolak") {
                          badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                        } else if (log.actionType === "cipta" || log.actionType === "kemuka") {
                          badgeColor = "bg-[#01696f]/10 text-[#005a60] border-[#01696f]/15";
                        } else if (log.actionType === "kemas_kini" || log.actionType === "tukar_status") {
                          badgeColor = "bg-amber-50 text-amber-800 border-amber-200/60";
                        }

                        return (
                          <div key={log.id} className="relative group">
                            <span className="absolute -left-9.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-[#01696f] shadow-2xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#01696f]" />
                            </span>
                            
                            <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-3xs space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
                                <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 border rounded-md ${badgeColor}`}>
                                  {log.actionType}
                                </span>
                                <span className="text-[9px] font-mono font-bold text-slate-400">
                                  {log.timestamp}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-850">
                                {log.description}
                              </p>
                              <div className="text-[9.5px] text-[#01696f] bg-[#01696f]/5 p-2 rounded-lg border border-[#01696f]/10 font-semibold">
                                Pegawai: <span className="text-slate-800 font-extrabold uppercase">{log.performedBy || "Sistem SPS"}</span> ({log.performedEmail})
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* STICKY ACTION FOOTER (PREMIUM & RESTRAINED - NO DANGER ZONE COMPATIBILITY) */}
          <div className="bg-white border-t border-slate-200/80 px-6 py-5 flex items-center justify-between shrink-0 gap-3">
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase hidden sm:inline">
              Sistem Pengesahan & Pematuhan SPS
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-black bg-slate-100 hover:bg-slate-200/85 text-slate-700 rounded transition-all cursor-pointer border border-slate-205/65 shadow-3xs uppercase tracking-widest shrink-0 ml-auto"
            >
              Tutup Profil
            </button>
          </div>

      </div>
    </div>
  );
}
