import React, { useEffect, useState } from "react";
import { InstitusiRecord, PortalAccess } from "../../../types/institusi";
import { BorangRecord } from "../../../types/borang";
import { getBorangHistoryForIps } from "../../borang/services/borangService";
import { getBorangMetadata } from "../../borang/constants/borangMetadata";
import { getAuditLogsForEntity, AuditLogRecord } from "../../../shared/services/auditLogService";
import { StatusBadge } from "../../../shared/components/ui/StatusBadge";
import { 
  X, Building, MapPin, Phone, User, Calendar, FileText, 
  Layers, CircleDollarSign, GraduationCap, Users, Navigation, Clock, ShieldCheck,
  Eye, EyeOff, ShieldAlert, Key, Copy, Check, Lock, Unlock
} from "lucide-react";
import { useRole } from "../../../shared/contexts/RoleContext";
import { 
  updateInstitusiAccess, 
  callCreateInstitutionAuthAccount, 
  callResetInstitutionPassword, 
  callSetInstitutionAccessState 
} from "../services/institusiService";
import { 
  generateInstitutionPassword, 
  generateSalt, 
  hashPassword, 
  validateInstitutionPassword 
} from "../utils/passwordUtils";
import { toast } from "react-hot-toast";

interface InstitusiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  institusi: InstitusiRecord | null;
  onUpdate?: () => void;
}

export function InstitusiDetailModal({ isOpen, onClose, institusi: propInstitusi, onUpdate }: InstitusiDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"umum" | "sejarah" | "audit" | "akses">("umum");
  const [borangHistory, setBorangHistory] = useState<BorangRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Portal Access Internal States
  const [localInstitusi, setLocalInstitusi] = useState<InstitusiRecord | null>(null);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState<boolean>(false);
  const [manualPassword, setManualPassword] = useState<string>("");
  const [manualConfirm, setManualConfirm] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [newPasswordToShow, setNewPasswordToShow] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const { userEmail, role } = useRole();

  // Shadow variables for in-memory and UI alignment across tabs
  const institusi = localInstitusi || propInstitusi;

  // Keep localState synced with prop
  useEffect(() => {
    setLocalInstitusi(propInstitusi);
  }, [propInstitusi, isOpen]);

  // Clean password view states on tab toggle
  useEffect(() => {
    if (activeTab !== "akses") {
      setNewPasswordToShow(null);
      setManualPassword("");
      setManualConfirm("");
      setIsCopied(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isOpen || !institusi) return;
    setActiveTab("umum");
    
    // Load history
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const historyData = await getBorangHistoryForIps(institusi.id);
        setBorangHistory(historyData);
      } catch (err: any) {
        console.error("Gagal mendapatkan sejarah borang", err);
        setError("Gagal memuatkan sejarah borang dari Firestore.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchHistory();
  }, [isOpen, institusi]);

  // Load audit logs dynamically when tab is selected
  useEffect(() => {
    if (!isOpen || !institusi || activeTab !== "audit") return;
    
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

  if (!isOpen || !propInstitusi) return null;

  // Security Handlers
  const handleUpdateMigrationState = async (newState: "legacy" | "hybrid" | "firebase-auth-only") => {
    if (!institusi || !institusi.portalAccess) return;
    setIsUpdatingAccess(true);
    try {
      const isFallbackAllowed = newState !== "firebase-auth-only";
      const portalAccess: PortalAccess = {
        ...institusi.portalAccess,
        migrationState: newState,
        legacyFallbackAllowed: isFallbackAllowed,
        passwordUpdatedAt: new Date().toISOString(),
        passwordUpdatedBy: userEmail
      };

      await updateInstitusiAccess(
        institusi.id,
        portalAccess,
        { email: userEmail, role },
        `Mengemas kini status migrasi portal kepada [${newState.toUpperCase()}] bagi IPS: ${institusi.namaInstitusi}`
      );

      const updatedItem = { ...institusi, portalAccess };
      setLocalInstitusi(updatedItem);
      toast.success(`Status migrasi berjaya ditukar kepada ${newState}!`);
      
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menukar status migrasi.");
    } finally {
      setIsUpdatingAccess(false);
    }
  };

  const handleCopyPassword = () => {
    if (!newPasswordToShow) return;
    navigator.clipboard.writeText(newPasswordToShow);
    setIsCopied(true);
    toast.success("Kata laluan berjaya disalin!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAutoGenerateAccess = async () => {
    if (!institusi) return;
    setIsUpdatingAccess(true);
    setNewPasswordToShow(null);
    try {
      const result = await callCreateInstitutionAuthAccount(
        institusi.id,
        undefined, // auto generates email
        undefined, // auto generates secure password
        userEmail,
        institusi.namaInstitusi
      );

      // Construct metadata aligned with schema
      const portalAccess: PortalAccess = {
        enabled: true,
        credentialStatus: "aktif",
        passwordHash: "",
        passwordSalt: "",
        passwordUpdatedAt: new Date().toISOString(),
        passwordUpdatedBy: userEmail,
        passwordAutoGenerated: true,
        loginReady: true,
        // Auth specific pointers
        authProvider: "firebase-auth",
        authUid: result.authUid,
        loginIdentifier: result.loginIdentifier,
        authStatus: "aktif",
        activatedBy: userEmail,
        activatedAt: new Date().toISOString(),
        migrationVersion: 2,
        lastPasswordResetAt: new Date().toISOString()
      };

      // Update in memory
      const updatedItem = { ...institusi, portalAccess };
      setLocalInstitusi(updatedItem);
      setNewPasswordToShow(result.temporaryPassword);
      toast.success("Akaun Firebase Auth & portal diaktifkan!");
      
      // Notify parent to refresh list
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal membina akaun portal.");
    } finally {
      setIsUpdatingAccess(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institusi) return;

    const validationErrors = validateInstitutionPassword(manualPassword, manualConfirm);
    if (validationErrors.length > 0) {
      validationErrors.forEach(err => toast.error(err));
      return;
    }

    setIsUpdatingAccess(true);
    setNewPasswordToShow(null);
    try {
      const alreadyActive = ifActivePortal();
      const loginIdentifier = institusi.portalAccess?.loginIdentifier || `institusi.${institusi.id.toLowerCase()}@upsppdgm.local`;

      if (alreadyActive) {
        await callResetInstitutionPassword(
          institusi.id,
          manualPassword,
          userEmail,
          institusi.namaInstitusi
        );
      } else {
        await callCreateInstitutionAuthAccount(
          institusi.id,
          loginIdentifier,
          manualPassword,
          userEmail,
          institusi.namaInstitusi
        );
      }

      const portalAccess: PortalAccess = {
        enabled: true,
        credentialStatus: "aktif",
        passwordHash: "",
        passwordSalt: "",
        passwordUpdatedAt: new Date().toISOString(),
        passwordUpdatedBy: userEmail,
        passwordAutoGenerated: false,
        loginReady: true,
        // Auth credentials parameters
        authProvider: "firebase-auth",
        authUid: institusi.portalAccess?.authUid || institusi.id,
        loginIdentifier: loginIdentifier,
        authStatus: "aktif",
        activatedBy: institusi.portalAccess?.activatedBy || userEmail,
        activatedAt: institusi.portalAccess?.activatedAt || new Date().toISOString(),
        migrationVersion: 2,
        lastPasswordResetAt: new Date().toISOString()
      };

      // Update in memory
      const updatedItem = { ...institusi, portalAccess };
      setLocalInstitusi(updatedItem);
      setNewPasswordToShow(manualPassword);
      setManualPassword("");
      setManualConfirm("");
      toast.success(alreadyActive ? "Kata laluan portal berjaya dikemas kini!" : "Akaun dan kata laluan diaktifkan!");
      
      // Notify parent to refresh list
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal mengemas kini akses manual.");
    } finally {
      setIsUpdatingAccess(false);
    }
  };

  const ifActivePortal = () => {
    return !!(institusi.portalAccess && institusi.portalAccess.credentialStatus === "aktif");
  };

  const handleBlockPortal = async () => {
    if (!institusi || !institusi.portalAccess) return;
    setIsUpdatingAccess(true);
    try {
      await callSetInstitutionAccessState(institusi.id, false, userEmail, institusi.namaInstitusi);

      const portalAccess: PortalAccess = {
        ...institusi.portalAccess,
        enabled: false,
        credentialStatus: "disekat",
        authStatus: "disekat",
        passwordUpdatedAt: new Date().toISOString(),
        passwordUpdatedBy: userEmail
      };

      const updatedItem = { ...institusi, portalAccess };
      setLocalInstitusi(updatedItem);
      toast.success("Akses portal disekat.");
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
      await callSetInstitutionAccessState(institusi.id, true, userEmail, institusi.namaInstitusi);

      const portalAccess: PortalAccess = {
        ...institusi.portalAccess,
        enabled: true,
        credentialStatus: "aktif",
        authStatus: "aktif",
        passwordUpdatedAt: new Date().toISOString(),
        passwordUpdatedBy: userEmail
      };

      const updatedItem = { ...institusi, portalAccess };
      setLocalInstitusi(updatedItem);
      toast.success("Akses portal diaktifkan semula.");
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal mengaktifkan semula akses.");
    } finally {
      setIsUpdatingAccess(false);
    }
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
        return kat.charAt(0).toUpperCase() + kat.slice(1);
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
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Overlay background */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Modal Content container */}
        <div className="relative w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all border border-slate-100 flex flex-col my-8">
          
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-150 px-6 py-5 flex items-start justify-between">
            <div className="space-y-1 pr-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-800 uppercase tracking-wider">
                Maklumat Terperinci IPS
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {institusi.namaInstitusi}
              </h3>
              <p className="text-xs text-slate-550 font-medium">
                No. Rujukan: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-extrabold text-slate-700">{institusi.noRujukan}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors pointer-events-auto"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 px-6 bg-white">
            <div className="flex space-x-6 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab("umum")}
                className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                  activeTab === "umum"
                    ? "border-primary-800 text-primary-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Maklumat Umum
              </button>
              <button
                onClick={() => setActiveTab("sejarah")}
                className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === "sejarah"
                    ? "border-primary-800 text-primary-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Sejarah Borang</span>
                {borangHistory.length > 0 && (
                  <span className="bg-primary-150 text-primary-800 font-extrabold px-1.5 py-0.5 text-[10px] rounded-full">
                    {borangHistory.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === "audit"
                    ? "border-primary-800 text-primary-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-primary-700" />
                <span>Jejak Tindakan (Audit)</span>
              </button>
              <button
                onClick={() => setActiveTab("akses")}
                className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === "akses"
                    ? "border-primary-800 text-primary-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span>Akses Portal</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50/50">
            
            {activeTab === "umum" && (
              <div className="space-y-6">
                
                {/* Section: Status & Kategori */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori IPS</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 uppercase flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                      {formatKategori(institusi.kategori)}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Operasi</span>
                    <div className="mt-1">
                      <StatusBadge
                        label={institusi.statusOperasi === "aktif" ? "Aktif" : institusi.statusOperasi === "tidak aktif" ? "Tidak Aktif" : "Digantung"}
                        tone={institusi.statusOperasi === "aktif" ? "success" : institusi.statusOperasi === "tidak aktif" ? "warning" : "danger"}
                      />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarikh Terbitan</span>
                    <span className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      {institusi.tarikhDaftar || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Section: Lokasi & Hubungan */}
                <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-2xs">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Navigation className="w-3.5 h-3.5 text-primary-600" />
                    Hubungan & Geografi Mukim
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-400">Zon Gua Musang</span>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-450 shrink-0" />
                        {institusi.zon}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-400">Mukim</span>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-slate-450 shrink-0" />
                        {institusi.mukim || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs font-medium text-slate-400">Alamat Penuh Premis</span>
                      <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {institusi.alamat || "Tiada rekod alamat lengkap."}
                      </p>
                    </div>
                    {institusi.pengelola && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-400">Nama Pengelola / Pemilik</span>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-450 shrink-0" />
                          {institusi.pengelola}
                        </p>
                      </div>
                    )}
                    {institusi.telefon && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-400">No. Telefon Hubungan</span>
                        <p className="text-sm font-mono font-bold text-slate-800 flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-slate-450 shrink-0" />
                          {institusi.telefon}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Kapasiti & Kewangan */}
                <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-2xs">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Users className="w-3.5 h-3.5 text-primary-600" />
                    Kapasiti, Kakitangan & Yuran
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Murid</span>
                      <span className="text-lg font-black text-slate-850 block mt-1">{institusi.bil_murid ?? "N/A"}</span>
                    </div>
                    <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Guru</span>
                      <span className="text-lg font-black text-slate-850 block mt-1">{institusi.bil_guru ?? institusi.bilGuru ?? "N/A"}</span>
                    </div>
                    <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yuran Bulanan</span>
                      <span className="text-lg font-black text-slate-850 block mt-1 flex items-center justify-center gap-0.5">
                        <CircleDollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                        RM{institusi.yuran_semasa ?? institusi.yuranSemasa ?? "0"}
                      </span>
                    </div>
                    <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Data</span>
                      <span className="text-lg font-mono font-bold text-slate-650 block mt-1">{institusi.tahun_dikemaskini || "N/A"}</span>
                    </div>
                  </div>

                  {/* Pengurusan Personel / Pentadbir */}
                  {(institusi.nama_gb || institusi.namaGB || institusi.nama_pengetua || institusi.namaPengetua) && (
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {(institusi.nama_gb || institusi.namaGB) && (
                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg">
                          <GraduationCap className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Guru Besar (GB)</span>
                            <span className="font-bold text-slate-800 text-sm">{institusi.nama_gb || institusi.namaGB}</span>
                          </div>
                        </div>
                      )}
                      {(institusi.nama_pengetua || institusi.namaPengetua) && (
                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg">
                          <GraduationCap className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Pengetua Swasta</span>
                            <span className="font-bold text-slate-800 text-sm">{institusi.nama_pengetua || institusi.namaPengetua}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeTab === "sejarah" && (
              <div className="space-y-4">
                
                {loading && (
                  <div className="space-y-3 py-6" id="history-loading">
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
                      <Clock className="w-5 h-5 text-primary-500 animate-spin" />
                      <span>Sedang mendapatkan rekod sejarah borang...</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="h-10 bg-white rounded-lg animate-pulse" />
                      <div className="h-10 bg-white rounded-lg animate-pulse" />
                    </div>
                  </div>
                )}

                {!loading && error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm font-semibold" id="history-error">
                    {error}
                  </div>
                )}

                {!loading && !error && (
                  <div id="sejarah-borang-list">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        Senarai Penyemakan Borang Terkumpul
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {borangHistory.length} Rekod
                      </span>
                    </div>

                    {borangHistory.length === 0 ? (
                      <div className="bg-white border border-slate-150 rounded-2xl p-8 text-center space-y-2">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                        <h5 className="font-bold text-slate-700 text-sm">Tiada Sejarah Pemfailan Borang</h5>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Institusi Pendidikan Swasta ini belum lagi mengemukakan mana-mana borang rasmi (BPS I - V) ke dalam sistem.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                        {/* Table Header for desktop */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 bg-slate-50 py-3.5 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                          <div className="col-span-4">Jenis & Kategori Borang</div>
                          <div className="col-span-2 font-mono">No. Rujukan</div>
                          <div className="col-span-2 text-center">Tarikh Kemuka / Kemas Kini</div>
                          <div className="col-span-2 text-center">Status Kelulusan</div>
                          <div className="col-span-2">Catatan KPM</div>
                        </div>

                        {/* List items */}
                        {borangHistory.map((borang) => (
                          <div key={borang.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-center py-4 px-4 hover:bg-slate-50/40 transition-all text-xs text-slate-600">
                            <div className="col-span-12 sm:col-span-4 space-y-1">
                              <div className="flex items-start gap-1.5 flex-col xs:flex-row xs:items-center">
                                <span className="bg-primary-50 text-primary-700 font-extrabold px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase border border-primary-200 shrink-0 select-none">
                                  {borang.jenisBorang}
                                </span>
                                <span className="font-extrabold text-slate-800 leading-tight">
                                  {getFriendlyBorangLabel(borang.jenisBorang)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="col-span-12 sm:col-span-2 font-mono font-bold text-slate-550 text-[11px] sm:text-xs">
                              <span className="sm:hidden text-slate-400 font-bold select-none mr-1">No. Rujukan:</span>
                              {borang.noRujukan}
                            </div>
                            
                            <div className="col-span-12 sm:col-span-2 sm:text-center text-slate-500 flex flex-col sm:items-center gap-0.5 text-[11px]">
                              <div className="flex items-center sm:justify-center gap-1">
                                <span className="sm:hidden text-slate-400 font-medium">Tarikh Kemuka:</span>
                                <span className="font-bold text-slate-705 font-mono">{borang.tarikhKemuka || "-"}</span>
                              </div>
                              {borang.updatedAt && borang.updatedAt !== borang.tarikhKemuka && (
                                <div className="flex items-center sm:justify-center gap-1 text-[10px] text-slate-450 border-t border-dashed border-slate-100 pt-0.5 mt-0.5">
                                  <span className="sm:hidden">Kemas Kini:</span>
                                  <span className="font-mono">{borang.updatedAt}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="col-span-12 sm:col-span-2 sm:text-center flex items-center sm:justify-center gap-1">
                              <span className="sm:hidden text-slate-400 font-medium select-none mr-1">Status:</span>
                              <StatusBadge
                                label={formatStatusLabel(borang.status)}
                                tone={getBorangStatusTone(borang.status)}
                              />
                            </div>
                            
                            <div className="col-span-12 sm:col-span-2 text-slate-500 font-medium truncate italic" title={borang.catatan}>
                              <span className="sm:hidden text-slate-400 font-medium select-none mr-1">Catatan:</span>
                              {borang.catatan || "-"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {activeTab === "audit" && (
              <div className="space-y-4">
                {loadingAudit ? (
                  <div className="space-y-3 py-6" id="audit-loading">
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
                      <Clock className="w-5 h-5 text-primary-500 animate-spin" />
                      <span>Sedang mendapatkan rekod jejak tindakan (audit logs)...</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="h-10 bg-white rounded-lg animate-pulse" />
                      <div className="h-10 bg-white rounded-lg animate-pulse" />
                    </div>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="bg-white border border-slate-150 rounded-2xl p-8 text-center space-y-2" id="audit-empty-state">
                    <ShieldCheck className="w-10 h-10 text-slate-350 mx-auto" />
                    <h5 className="font-bold text-slate-700 text-sm font-sans">Tiada Jejak Audit Direkodkan</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Belum ada tindakan pentadbir atau pengemukaan data yang direkodkan bagi institusi ini sejak log audit diaktifkan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5" id="audit-timeline">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        Jejak Aktiviti & Kronologi Tindakan
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold font-mono border border-emerald-150 rounded px-2 py-0.5">
                        Secured Firestore Audit Trail
                      </span>
                    </div>
                    
                    <div className="relative border-l-2 border-slate-200 ml-3.5 pl-6 space-y-5">
                      {auditLogs.map((log) => {
                        let badgeColor = "bg-slate-105 text-slate-700 border-slate-200";
                        if (log.actionType === "lulus") {
                          badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-250";
                        } else if (log.actionType === "tolak") {
                          badgeColor = "bg-rose-50 text-rose-700 border-rose-250";
                        } else if (log.actionType === "cipta" || log.actionType === "kemuka") {
                          badgeColor = "bg-primary-50 text-primary-800 border-primary-200";
                        } else if (log.actionType === "kemas_kini" || log.actionType === "tukar_status") {
                          badgeColor = "bg-amber-50 text-amber-800 border-amber-250";
                        }

                        return (
                          <div key={log.id} className="relative group">
                            {/* Timeline bullet dot */}
                            <span className="absolute -left-9.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-primary-650 shadow-2xs group-hover:scale-110 transition-transform">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary-750" />
                            </span>
                            
                            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 border rounded shrink-0 select-none ${badgeColor}`}>
                                    {log.actionType}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-slate-450 bg-slate-50 px-1.5 py-0.5 rounded">
                                    {log.entityType}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold font-mono text-slate-450 whitespace-nowrap">
                                  {log.timestamp}
                                </span>
                              </div>
                              
                              <p className="text-xs font-bold text-slate-800 leading-relaxed">
                                {log.description}
                              </p>
                              
                              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-bold bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400">Pengendali:</span>
                                  <span className="text-slate-700 font-extrabold uppercase shrink-0">{log.performedBy || "Pegawai KPM"}</span>
                                </div>
                                <span className="font-mono text-slate-650 font-semibold">{log.performedEmail}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Akses Portal */}
            {activeTab === "akses" && (
              <div className="space-y-6 animate-fade-in animate-duration-200">
                
                {/* Section: Status Akses */}
                <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-2xs space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5 animate-pulse-once">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Metrik Keselamatan</span>
                      <h4 className="text-base font-black text-slate-850 tracking-wide flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-rose-500" />
                        Akses Portal Institusi
                      </h4>
                    </div>
                    <div>
                      {(() => {
                        const s = institusi.portalAccess?.credentialStatus || "belum-diset";
                        let label = "Belum Diset";
                        let tone: "success" | "warning" | "danger" | "neutral" = "warning";
                        if (s === "aktif") {
                          label = "Akses Portal Aktif";
                          tone = "success";
                        } else if (s === "disekat") {
                          label = "Akses Portal Disekat";
                          tone = "danger";
                        }
                        return <StatusBadge label={label} tone={tone} />;
                      })()}
                    </div>
                  </div>

                  {/* Informational Credentials ID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50/55 p-4 rounded-2xl border border-slate-200/50 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block pl-0.5">ID Pengguna (Username ID)</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-800 bg-slate-200/65 px-2.5 py-1 rounded inline-block">
                          {institusi.id}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(institusi.id);
                            toast.success("ID Pengguna disalin!");
                          }}
                          className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-md transition-colors cursor-pointer"
                          title="Salin ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-1.5 leading-relaxed">
                        ID unik ini digunapakai oleh pihak institusi sebagai kelayakan daftar masuk.
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block pl-0.5">No Rujukan Pengelola (Alternatif ID)</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-800 bg-slate-200/65 px-2.5 py-1 rounded inline-block text-left">
                          {institusi.noRujukan}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(institusi.noRujukan);
                            toast.success("No Rujukan disalin!");
                          }}
                          className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-md transition-colors cursor-pointer"
                          title="Salin No Rujukan"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-1.5 leading-relaxed">
                        No pendaftaran berwajib daripada pihak pengelola bagi institusi swasta.
                      </span>
                    </div>
                  </div>

                  {institusi.portalAccess?.loginIdentifier && (
                    <div className="bg-primary-50/45 p-4 rounded-2xl border border-primary-250/50 space-y-1 relative text-left">
                      <span className="text-[10px] font-black text-primary-700 uppercase block pl-0.5 tracking-wider">
                        E-mel Log Masuk Rasmi (Firebase Auth)
                      </span>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="font-mono text-xs font-extrabold text-primary-900 bg-primary-100/60 px-3 py-1.5 rounded-lg inline-block border border-primary-200/50">
                          {institusi.portalAccess.loginIdentifier}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(institusi.portalAccess?.loginIdentifier || "");
                            toast.success("E-mel Log Masuk disalin!");
                          }}
                          className="p-1.5 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors cursor-pointer border border-primary-200/20 bg-white"
                          title="Salin E-mel"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-primary-800/80 block pt-1.5 leading-relaxed font-semibold">
                        Gunakan e-mel rasmi berstruktur ini untuk log masuk tulen ke dalam Portal Institusi menggunakan sistem pengesahan Firebase Auth.
                      </span>
                    </div>
                  )}

                  {/* HARDENING / MIGRATION STATUS BADGE */}
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Status Migrasi & Keselamatan Portal
                      </span>
                      {/* Badge status */}
                      {(() => {
                        const mState = institusi.portalAccess?.migrationState || "legacy";
                        if (mState === "firebase-auth-only") {
                          return (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100/70 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-250 uppercase">
                              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                              Firebase Auth Aktif
                            </span>
                          );
                        } else if (mState === "hybrid") {
                          return (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-805 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                              Hybrid Migration
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-300 uppercase">
                              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                              Legacy
                            </span>
                          );
                        }
                      })()}
                    </div>

                    <div className="text-xs text-slate-650 leading-relaxed font-semibold space-y-1">
                      {(() => {
                        const mState = institusi.portalAccess?.migrationState || "legacy";
                        if (mState === "firebase-auth-only") {
                          return (
                            <p className="text-emerald-800">
                              🔒 <strong>Keadaan Keselamatan Maksimum:</strong> Institusi ini dikunci ke Firebase Auth sepenuhnya. Pintu belakang password hash dan master key telah dimatikan secara kekal.
                            </p>
                          );
                        } else if (mState === "hybrid") {
                          return (
                            <p className="text-amber-850">
                              ⚠️ <strong>Mod Hybrid:</strong> Firebase Auth diutamakan tetapi fallback password hash masih dibenarkan untuk sokongan transisi lancar. Sila selesaikan migrasi segera.
                            </p>
                          );
                        } else {
                          return (
                            <p className="text-slate-600">
                              ⚙️ <strong>Mod Legacy:</strong> Masih bergantung sepenuhnya pada struktur kredensial hash yang lama. Sila lakukan migrasi penuh ke Firebase Auth.
                            </p>
                          );
                        }
                      })()}
                    </div>

                    {/* Actions: Migrasi / Selesaikan / Matikan Fallback */}
                    {institusi.portalAccess && institusi.portalAccess.credentialStatus !== "belum-diset" && (
                      <div className="pt-1 flex flex-wrap gap-2 text-xs">
                        {(!institusi.portalAccess.migrationState || institusi.portalAccess.migrationState === "legacy") && (
                          <button
                            type="button"
                            disabled={isUpdatingAccess}
                            onClick={() => handleUpdateMigrationState("hybrid")}
                            className="px-2.5 py-1 rounded bg-[#01696f]/10 text-[#01696f] hover:bg-[#01696f]/20 font-black border border-[#01696f]/30 cursor-pointer"
                          >
                            Set Status Sebagai Hybrid
                          </button>
                        )}
                        {institusi.portalAccess.migrationState !== "firebase-auth-only" && (
                          <button
                            type="button"
                            disabled={isUpdatingAccess}
                            onClick={() => handleUpdateMigrationState("firebase-auth-only")}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-black shadow-3xs cursor-pointer"
                          >
                            🚀 Lengkapkan Migrasi (Firebase Auth Sahaja)
                          </button>
                        )}
                        {institusi.portalAccess.migrationState === "firebase-auth-only" && (
                          <button
                            type="button"
                            disabled={isUpdatingAccess}
                            onClick={() => handleUpdateMigrationState("hybrid")}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-black border border-slate-300 cursor-pointer"
                          >
                            Kembalikan ke Hybrid (Benarkan Fallback)
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions toggle status portal */}
                  <div className="pt-2">
                    {(!institusi.portalAccess || institusi.portalAccess.credentialStatus === "belum-diset") ? (
                      <div className="bg-amber-50 text-amber-850 p-4 rounded-2xl border border-amber-200 text-xs flex items-start gap-2.5 leading-relaxed font-semibold">
                        <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <strong>Portal Belum Diaktifkan:</strong> Institusi ini belum lagi disetkan sebarang kredensial masuk. Sila jana kata laluan di bawah untuk pengesahan akses kali pertama.
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/55">
                        <div className="text-xs space-y-0.5">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Kemas Kini Terakhir</span>
                          <span className="font-semibold text-slate-705">
                            Diset oleh: <strong className="text-slate-800 font-extrabold">{institusi.portalAccess.passwordUpdatedBy || "KPM"}</strong>
                          </span>
                          <span className="text-[10.5px] text-slate-450 block font-mono">
                            Pada: {institusi.portalAccess.passwordUpdatedAt || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {institusi.portalAccess.credentialStatus === "aktif" ? (
                            <button
                              type="button"
                              disabled={isUpdatingAccess}
                              onClick={handleBlockPortal}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full transition-all cursor-pointer shadow-3xs"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                              <span>Sekat Akses</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isUpdatingAccess}
                              onClick={handleActivatePortal}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 rounded-full transition-all cursor-pointer shadow-3xs"
                            >
                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Aktifkan Semula</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Newly generated password panel */}
                {newPasswordToShow && (
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl space-y-4 animate-fade-in animate-duration-300 shadow-2xs relative text-left">
                    <div className="flex items-start justify-between gap-4 border-b border-emerald-150 pb-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-850 font-black px-2.5 py-0.5 rounded-full select-none uppercase tracking-wider block">
                          Kata Laluan Baharu Berhasil Ditetapkan
                        </span>
                        <h5 className="text-sm font-black text-emerald-900 pt-1.5 font-sans">
                          Sila Salin Kata Laluan Sekarang!
                        </h5>
                      </div>
                      <button
                        onClick={handleCopyPassword}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100/40 text-emerald-800 rounded-lg text-xs font-black transition-all shadow-2xs border border-emerald-200 cursor-pointer uppercase"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 font-extrabold" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                        <span>{isCopied ? "Disalin!" : "Salin Raw Pas"}</span>
                      </button>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-emerald-150 flex items-center justify-between">
                      <span className="font-mono text-base md:text-lg font-black tracking-widest text-slate-800 bg-slate-50 px-3 py-1 rounded border border-slate-100 select-all select-none">
                        {newPasswordToShow}
                      </span>
                    </div>

                    <div className="text-xs text-emerald-800 leading-relaxed font-semibold space-y-1">
                      <p>💥 <strong>Amaran Keselamatan Penting:</strong></p>
                      <p>Kata laluan raw ini telah disulitkan terus dengan SHA-256 dan <strong>TIDAK BOLEH dipaparkan lagi</strong> selepas ini demi kepatuhan keselamatan data institusi swasta.</p>
                    </div>
                  </div>
                )}

                {/* Setup Panels GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  
                  {/* Left: Auto Create */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-2xs space-y-4 flex flex-col justify-between">
                     <div className="space-y-2">
                       <h5 className="text-sm font-black text-slate-800 flex items-center gap-1.5 font-sans">
                         <Key className="w-4 h-4 text-primary-700" />
                         Saluran Auto-Jana Pantas
                       </h5>
                       <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                         Pembentukan rentetan sulit secara rawak selamat tinggi (min 12 aksara, menggabungkan simbol, angka, huruf besar & kecil) serta mengaktifkan portal IPS terus dengan serta-merta.
                       </p>
                     </div>

                     <div className="pt-4 border-t border-slate-100">
                       <button
                         type="button"
                         disabled={isUpdatingAccess}
                         onClick={handleAutoGenerateAccess}
                         className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-black bg-primary-800 hover:bg-primary-900 hover:border-primary-950/25 text-white rounded-2xl shadow-sm cursor-pointer uppercase transition-all tracking-wider"
                       >
                         {isUpdatingAccess ? "Menjana Kredensial..." : "Auto-Jana & Aktifkan Portal"}
                       </button>
                     </div>
                  </div>

                  {/* Right: Manual setting */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-2xs space-y-4">
                     <h5 className="text-sm font-black text-slate-800 flex items-center gap-1.5 font-sans">
                       <Lock className="w-4 h-4 text-emerald-600" />
                       Tetapan Manual Pas
                     </h5>

                     <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase block pl-0.5">Kata Laluan Baharu</label>
                          <div className="relative font-bold">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={manualPassword}
                              onChange={(e) => setManualPassword(e.target.value)}
                              placeholder="Masukkan kata laluan manual"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-3 pr-10 py-2.5 font-bold focus:border-primary-500 focus:bg-white focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 cursor-pointer"
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase block pl-0.5">Sahkan Kata Laluan</label>
                          <input
                            type="password"
                            value={manualConfirm}
                            onChange={(e) => setManualConfirm(e.target.value)}
                            placeholder="Sahkan kata laluan di atas"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-bold focus:border-primary-500 focus:bg-white focus:outline-hidden"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isUpdatingAccess || !manualPassword}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl border border-emerald-700/15 shadow-sm cursor-pointer uppercase transition-all tracking-wider"
                        >
                          {isUpdatingAccess ? "Merekodkan..." : "Simpan Kredensial Manual"}
                        </button>
                     </form>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* Footer Area */}
          <div className="bg-slate-50 border-t border-slate-150 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-extrabold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-full transition-all cursor-pointer shadow-2xs"
            >
              Tutup Maklumat
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
