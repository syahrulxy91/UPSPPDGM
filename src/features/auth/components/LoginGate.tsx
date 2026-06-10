import React, { useState, useEffect } from "react";
import { KeyRound, ShieldAlert, AlertTriangle, Eye, EyeOff, Building2, UserCheck, ArrowLeft, ShieldCheck, Mail, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getInstitusiList } from "../../institusi/services/institusiService";
import { InstitusiRecord } from "../../../types/institusi";
import { hashPassword } from "../../institusi/utils/passwordUtils";
import { auth } from "../../../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { isAllowedPpdgmEmail } from "../utils/emailValidator";

interface LoginGateProps {
  title?: string;
  sessionExpired?: boolean;
  onSuccess: (role: "ppdgm" | "institusi", selectedInstitusiId?: string) => void;
}

export function LoginGate({
  title = "Dashboard Unit Swasta SPS PPD Gua Musang",
  sessionExpired = false,
  onSuccess,
}: LoginGateProps) {
  const [selectedRole, setSelectedRole] = useState<"ppdgm" | "institusi" | null>(null);
  const [inputPassword, setInputPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedInstitusiId, setSelectedInstitusiId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<InstitusiRecord[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load institutions gracefully only if role is 'institusi', to avoid unauthorized list errors
    if (selectedRole === "institusi" && institutions === null) {
      setLoading(true);
      getInstitusiList()
        .then((data) => {
          setInstitutions(data);
          setSelectedInstitusiId("");
          setLoading(false);
        })
        .catch((err) => {
          console.error("Gagal mendapatkan senarai institusi:", err);
          setInstitutions([]);
          setLoading(false);
        });
    }
  }, [selectedRole, institutions]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    // Enforce prompt to allow user to choose account explicitly
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email || "";

      if (!isAllowedPpdgmEmail(userEmail)) {
        await auth.signOut();
        setError("Akses PPDGM hanya dibenarkan untuk emel rasmi KPM/PPD yang sah.");
        setLoading(false);
        return;
      }
      
      onSuccess("ppdgm");
    } catch (authError: any) {
      console.warn("PPDGM Google Auth failed:", authError);
      
      if (authError.code === "auth/unauthorized-domain") {
        setError("Domain semasa belum dibenarkan untuk Google Sign-In Firebase. Tambah domain preview ini dalam Firebase Authentication > Authorized Domains atau uji pada domain deploy rasmi.");
      } else {
        setError("Log masuk Google dibatalkan atau ralat semasa pengesahan. Sila cuba lagi.");
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (selectedRole === "institusi") {
        let chosen: InstitusiRecord | undefined;

        if (!selectedInstitusiId) {
          setError("Sila pilih institusi terlebih dahulu.");
          setLoading(false);
          return;
        }
        chosen = institutions?.find((i) => i.id === selectedInstitusiId);

        if (!chosen) {
          setError("Institusi swasta tidak ditemui. Sila pastikan pilihan institusi anda sah.");
          setLoading(false);
          return;
        }

        // Check portalAccess configuration
        const pAcc = chosen.portalAccess;
        
        // 1. Check if portalAccess object exists
        if (!pAcc) {
          setError("Akses portal institusi ini belum diaktifkan oleh pegawai PPDGM.");
          setLoading(false);
          return;
        }

        // 2. Check enabled field
        if (pAcc.enabled !== true) {
          setError("Akses portal institusi ini belum diaktifkan oleh pegawai PPDGM.");
          setLoading(false);
          return;
        }

        // 3. Check for blocked status
        if (pAcc.credentialStatus === "disekat" || pAcc.authStatus === "disekat") {
          setError("Akses portal bagi institusi ini telah disekat. Sila hubungi pegawai PPDGM.");
          setLoading(false);
          return;
        }

        // 4. Check if credentials are set and active
        const hasAccessSet = pAcc.credentialStatus === "aktif" && 
                             pAcc.loginReady !== false && 
                             (pAcc.authStatus === undefined || pAcc.authStatus === "aktif");

        if (!hasAccessSet) {
          setError("Akses portal institusi ini belum diaktifkan oleh pegawai PPDGM.");
          setLoading(false);
          return;
        }

        // Simulate premium verification delay
        await new Promise((resolve) => setTimeout(resolve, 350));

        // Use custom or system-derived login email
        const emailIdentifier = pAcc.loginIdentifier || `institusi.${chosen.id.toLowerCase()}@upsppdgm.local`;

        try {
          // 1. Try Firebase Authentication client-side sign-in
          await signInWithEmailAndPassword(auth, emailIdentifier, inputPassword);

          onSuccess("institusi", chosen.id);
        } catch (authError: any) {
          console.warn("Firebase Auth login failed. Trying compatible fallback of password:", authError.message || authError);

          let loginSuccess = false;

          // Check direct fallbackPassword in schema (used during manual updates / local offline testing)
          if (pAcc.fallbackPassword && pAcc.fallbackPassword === inputPassword) {
            loginSuccess = true;
          }

          // Check legacy salt/hash fallback if allowed
          if (!loginSuccess) {
            const mState = pAcc.migrationState || "legacy";
            const fallbackAllowed = pAcc.legacyFallbackAllowed ?? (mState !== "firebase-auth-only");

            if (fallbackAllowed && mState !== "firebase-auth-only" && pAcc.passwordHash) {
              const salt = pAcc.passwordSalt || "";
              const hashToCompare = pAcc.passwordHash;
              const userHash = await hashPassword(inputPassword, salt);

              if (userHash === hashToCompare) {
                console.info("Legasi salt/hash login dicapai sebagai fallback serasi.");
                loginSuccess = true;
              }
            }
          }

          // Check emergency master-key (if allowed)
          if (!loginSuccess) {
            const mState = pAcc.migrationState || "legacy";
            const allowEmergencyMasterKey = (import.meta as any).env?.VITE_ENABLE_EMERGENCY_MASTER_KEY === "true";
            if (allowEmergencyMasterKey && mState === "legacy") {
              if (inputPassword === "INSTITUSI2026") {
                console.info("Emergency master-key login dicapai.");
                loginSuccess = true;
              }
            }
          }

          if (loginSuccess) {
            onSuccess("institusi", chosen.id);
          } else {
            setError("Kata laluan tidak sah. Sila gunakan kata laluan yang diberikan oleh pegawai PPDGM.");
            setLoading(false);
          }
        }
      }
    } catch (err: any) {
      console.error("Verification error", err);
      setError("Ralat sistem ketika menentusahkan kelayakan keselamatan.");
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setInputPassword("");
    setError(null);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-[#f7f6f2] font-sans selection:bg-[#01696f] selection:text-white" id="login-gate-container">
      
      {/* 1. BRANDING & TRUST PANEL (Left Panel - 5 Cols on large, 12 on mobile) */}
      <div className="col-span-1 md:col-span-5 lg:col-span-4 bg-gradient-to-b from-[#0a2729] to-[#051719] text-white flex flex-col justify-between p-8 md:p-12 relative overflow-hidden shadow-2xl z-10" id="login-branding-panel">
        
        {/* Subtle, modern vector background pattern for executive official authority and structure */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#01696f_1px,transparent_1px)] [background-size:20px_20px]" />
        
        {/* Header containing Logo & Identity Context with premium alignment */}
        <div className="flex flex-col items-center md:items-start gap-8 relative z-10">
          
          {/* Logo container utilizing /icon-512.png with custom micro shadow */}
          <div className="relative group shrink-0" id="brand-logo-container">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#01696f] to-[#006494] rounded-2xl blur opacity-30 group-hover:opacity-40 transition duration-300" />
            <img
              src="/icon-512.png"
              alt="Logo Unit Swasta SPS Gua Musang"
              referrerPolicy="no-referrer"
              className="relative w-[72px] h-[72px] md:w-[96px] md:h-[96px] object-contain rounded-2xl bg-white/10 p-2.5 border border-white/20 shadow-xl"
              id="brand-logo"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200"; // Elegant visual fallback if not found
              }}
            />
          </div>

          <div className="space-y-4 text-center md:text-left">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#01696f]/40 text-[#4bf3fc] border border-[#01696f]/50">
              Kementerian Pendidikan Malaysia
            </span>
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Dashboard Unit Swasta <br className="hidden md:inline" />SPS PPD Gua Musang
              </h1>
              <p className="text-xs md:text-sm text-[#abe3e5] font-semibold tracking-wider uppercase">
                Sektor Pengurusan Sekolah • Unit Swasta
              </p>
            </div>
            
            <div className="h-[2px] w-14 bg-gradient-to-r from-[#01696f] to-transparent my-4 mx-auto md:mx-0" />
            
            <p className="text-xs text-slate-300 leading-relaxed font-light max-w-xs md:max-w-none">
              Portal Rasmi Pengurusan dan Pemantauan Institusi Pendidikan Swasta di bawah naungan Jabatan Pendidikan.
            </p>
          </div>
        </div>

        {/* Footer info in left panel (Desktop-only to prevent clutter on mobile) */}
        <div className="hidden md:flex flex-col gap-6 mt-12 relative z-10" id="branding-footer-desktop">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2 max-w-sm">
            <p className="font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#01696f] animate-pulse" />
              Notis Keselamatan Sistem
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Sesi kemasukan dan aktiviti portal direkodkan di bawah sistem keselamatan bersepadu SPS PPD Gua Musang. Sebarang cubaan menceroboh dilarang sama sekali.
            </p>
          </div>

          <div className="space-y-1 text-slate-400 text-[10px] uppercase tracking-widest">
            <p className="font-bold text-slate-300">SPS PPD Gua Musang</p>
            <p className="normal-case">© 2026. Hak Cipta Terpelihara.</p>
          </div>
        </div>
      </div>

      {/* 2. INTERACTION AREA (Right Panel - 7 Cols on large, 12 on mobile) */}
      <div className="col-span-1 md:col-span-7 lg:col-span-8 flex flex-col justify-between p-6 sm:p-10 md:p-16 lg:p-24 relative" id="login-interaction-panel">
        
        {/* Subtle top bar styling for mobile viewports */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#01696f] to-[#006494] md:hidden" />

        {/* Outer stage center component */}
        <div className="my-auto w-full max-w-md mx-auto space-y-8" id="login-interaction-stage">
          
          {/* Header Info */}
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900" id="interaction-heading">
              {selectedRole === null ? "Log Masuk Portal" : "Sila Masukkan Kata Laluan"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sila pilih jenis peranan anda untuk terus mengakses data bersepadu unit swasta.
            </p>
          </div>

          {/* Session Expiry Warning in high tier design style */}
          {sessionExpired && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-xs leading-relaxed shadow-sm" id="expired-notice">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-rose-900">Sesi Akses Anda Telah Tamat</p>
                <p className="text-[11px] text-rose-700/90 font-medium text-left">
                  Untuk terus menggunakan sistem, sila sahkan semula kata laluan keselamatan peranan anda.
                </p>
              </div>
            </div>
          )}

          {/* ANIMATABLE LOGIN SELECTION OR CONTEXTUAL FORM */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-100/50 p-6 sm:p-8" id="login-interactive-card">
            <AnimatePresence mode="wait">
              {selectedRole === null ? (
                /* SECTION 1: ROLE CHOOSING MODE */
                <motion.div
                  key="role-selector"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <p className="text-[11px] text-slate-400 font-extrabold tracking-widest uppercase text-center md:text-left">
                    Sila Pilih Akses Log Masuk
                  </p>

                  <div className="space-y-4">
                    {/* BUTTON 1: PPDGM (PEGASAI UNIT SWASTA) */}
                    <button
                      type="button"
                      onClick={() => setSelectedRole("ppdgm")}
                      className="w-full text-left bg-[#01696f] hover:bg-[#0c4e54] text-white p-5 rounded-xl transition-all duration-200 cursor-pointer flex items-start gap-4 shadow-md shadow-[#01696f]/10 border border-[#01696f]/30 group relative active:scale-[0.99]"
                      id="btn-login-ppdgm"
                    >
                      <div className="p-3 bg-white/10 rounded-lg shrink-0 text-white group-hover:scale-105 transition-transform">
                        <UserCheck className="w-5 h-5 text-[#bcfffc]" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black tracking-wide uppercase">Log Masuk PPDGM</span>
                        </div>
                        <p className="text-xs text-slate-100 font-medium mt-1 leading-normal">
                          Pegawai / Pentadbir Unit Swasta PPD Gua Musang
                        </p>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-200 text-white/95">
                        <ArrowLeft className="w-4.5 h-4.5 rotate-180" />
                      </div>
                    </button>

                    {/* BUTTON 2: INSTITUSI SWASTA */}
                    <button
                      type="button"
                      onClick={() => setSelectedRole("institusi")}
                      className="w-full text-left bg-white hover:bg-slate-50 text-slate-800 p-5 rounded-xl transition-all duration-200 cursor-pointer flex items-start gap-4 shadow-sm hover:shadow-md border border-slate-200 group relative active:scale-[0.99]"
                      id="btn-login-institusi"
                    >
                      <div className="p-3 bg-[#006494]/10 rounded-lg shrink-0 text-[#006494] group-hover:scale-105 transition-transform">
                        <Building2 className="w-5 h-5 text-[#006494]" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black tracking-wide uppercase text-slate-900">Log Masuk Institusi</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1 leading-normal">
                          Pihak Pengurusan Sekolah / Pusat Bimbingan Swasta
                        </p>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-200 text-[#006494]">
                        <ArrowLeft className="w-4.5 h-4.5 rotate-180" />
                      </div>
                    </button>
                  </div>
                </motion.div>
              ) : selectedRole === "ppdgm" ? (
                /* SECTION 2A: ACCESS FOR PPDGM (GOOGLE AUTH ONLY) */
                <motion.div
                  key="login-ppdgm-google"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-lg shrink-0 bg-[#01696f]/10 text-[#01696f]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mod Kebenaran Akses</h3>
                      <p className="text-xs font-black text-slate-800">PEGAWAI UNIT SWASTA PPDGM</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleGoogleSignIn}
                      className={`w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] ${
                        loading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading ? (
                        <span>Mengesahkan...</span>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          <span>Log Masuk dengan Google</span>
                        </>
                      )}
                    </button>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-700 font-semibold" id="error-message">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center justify-center gap-1.5 cursor-pointer py-2 transition-colors border border-transparent hover:border-slate-200 rounded-lg"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Peranan Utama</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* SECTION 2B: ACCESS FOR INSTITUSI */
                <motion.form
                  key="login-form-entry"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  id="login-form"
                >
                  {/* Contextual mini header with elegant layout */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-lg shrink-0 bg-[#006494]/10 text-[#006494]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mod Kebenaran Akses</h3>
                      <p className="text-xs font-black text-slate-800">PORTAL INSTITUSI SWASTA</p>
                    </div>
                  </div>

                  {/* Institution Selection Dropdown */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block">
                      Pilih Institusi Swasta
                    </label>

                    <div className="relative">
                      <select
                        value={selectedInstitusiId}
                        onChange={(e) => setSelectedInstitusiId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-4 pr-10 py-3.5 font-semibold transition-all focus:border-[#006494] focus:bg-white focus:outline-none appearance-none cursor-pointer"
                        required
                      >
                        {institutions === null ? (
                          <option value="">Sedang memuat senarai institusi...</option>
                        ) : institutions.length === 0 ? (
                          <option value="">Tiada institusi berdaftar ditemui. Sila hubungi pegawai PPDGM.</option>
                        ) : (
                          <>
                            <option value="" disabled>Sila pilih tadika / institusi</option>
                            {institutions.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.namaInstitusi} ({i.noRujukan})
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {selectedInstitusiId && (() => {
                    const chosen = institutions?.find((i) => i.id === selectedInstitusiId);
                    if (!chosen) return null;
                    const pAcc = chosen.portalAccess;
                    if (!pAcc || pAcc.enabled !== true || pAcc.credentialStatus !== "aktif") {
                      return (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800 font-semibold">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                          <span>
                            Akses portal bagi institusi ini <strong>belum diaktifkan</strong> oleh pegawai PPDGM. Sila hubungi pejabat PPD Gua Musang untuk mendapatkan kata laluan portal anda.
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>Portal institusi ini aktif. Sila masukkan kata laluan anda.</span>
                      </div>
                    );
                  })()}

                  {(() => {
                    const chosen = institutions?.find((i) => i.id === selectedInstitusiId);
                    const pAcc = chosen?.portalAccess;
                    const isActive = selectedInstitusiId && pAcc?.enabled === true && pAcc?.credentialStatus === "aktif";
                    if (!isActive) return null;
                    return (
                      <>
                        {/* Password Entry Field */}
                        <div className="space-y-1.5 font-sans">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block">
                            Kunci Laluan Keselamatan
                          </label>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                              <KeyRound className="w-4.5 h-4.5" />
                            </div>
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder={selectedRole === "ppdgm" ? "Kata laluan Pegawai" : "Kata laluan Portal Institusi"}
                              value={inputPassword}
                              onChange={(e) => setInputPassword(e.target.value)}
                              className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-11 pr-10 py-3.5 font-semibold transition-all focus:bg-white focus:outline-none placeholder-slate-400 focus:ring-4 ${
                                selectedRole === "ppdgm" ? "focus:border-[#01696f] focus:ring-[#01696f]/10" : "focus:border-[#006494] focus:ring-[#006494]/10"
                              }`}
                              required
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                              title={showPassword ? "Sembunyikan kata laluan" : "Papar kata laluan"}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Error Notification */}
                        {error && (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-700 font-semibold" id="error-message">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-[#ef4444]" />
                            <span>{error}</span>
                          </div>
                        )}

                        {/* Submission action */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white text-xs font-black tracking-widest py-3.5 px-4 rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 uppercase active:scale-[0.98] ${
                              loading ? "opacity-60 cursor-not-allowed" : ""
                            } ${
                              selectedRole === "ppdgm"
                                ? "bg-[#01696f] hover:bg-[#0c4e54] shadow-[#01696f]/15"
                                : "bg-[#006494] hover:bg-[#005178] shadow-[#006494]/15"
                            }`}
                          >
                            {loading ? (
                              <span>Mengesahkan...</span>
                            ) : (
                              <>
                                <span>Masuk Portal Rasmi</span>
                                <KeyRound className="w-4 h-4 text-white/80" />
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    );
                  })()}

                  {/* Submission and back actions container */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center justify-center gap-1.5 cursor-pointer py-2 transition-colors border border-transparent hover:border-slate-200 rounded-lg"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Peranan Utama</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Secure Monitoring Footnote under login block */}
          <div className="flex items-start gap-2.5 text-xs text-slate-500 leading-normal px-1" id="readonly-notice">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="font-normal text-slate-500">
              <span className="font-semibold text-slate-700">Notis Pentadbiran:</span> Segala aktiviti dalam log masuk ini tertakluk kepada Akta Perlindungan Data Peribadi dan pematuhan peraturan Kementerian Pendidikan Malaysia.
            </p>
          </div>

        </div>

        {/* Footer info (Mobile visible only) */}
        <div className="md:hidden pt-8 text-center" id="branding-footer-mobile">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            SPS PPD GUA MUSANG • UNIT SWASTA
          </p>
          <p className="text-[9px] text-[#8c8b87] max-w-sm mx-auto mt-1 leading-normal">
            Portal Rasmi Pengurusan & Pemantauan Swasta Sektor Pengurusan Sekolah. © 2026. Hak Cipta Terpelihara.
          </p>
        </div>

      </div>
    </div>
  );
}

export default LoginGate;
