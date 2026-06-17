import React, { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, Building2, UserCheck, ArrowLeft, ShieldCheck, Mail, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { fetchPublicInstitusiList, bindInstitutionAccessClient } from "../../institusi/services/institusiService";
import { InstitusiRecord } from "../../../types/institusi";
import { auth, functions } from "../../../lib/firebase";
import { signInWithPopup, GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
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
  const [selectedInstitusiId, setSelectedInstitusiId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<InstitusiRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ email: string; uid: string; displayName?: string | null } | null>(null);

  useEffect(() => {
    // Load institutions gracefully only after successful Google login
    if (selectedRole === "institusi" && googleUser !== null && institutions === null) {
      setLoading(true);
      fetchPublicInstitusiList()
        .then((data) => {
          if (data.length === 0) {
            console.warn("DEBUG: fetchPublicInstitusiList() pulangkan senarai kosong. Tiada institusi berdaftar ditemui dalam sistem.");
          }
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
  }, [selectedRole, googleUser, institutions]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email || "";

      if (!isAllowedPpdgmEmail(userEmail)) {
        await auth.signOut();
        setError("Akses PPDGM hanya dibenarkan untuk emel rasmi KPM/PPD yang sah.");
        setLoading(false);
        return;
      }
      
      setLoading(false);
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

  const handleInstitusiGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email || "";

      if (!userEmail) {
        await auth.signOut();
        setError("Akaun Google anda tidak mempunyai alamat emel yang sah.");
        setLoading(false);
        return;
      }

      // Exact backend lookup to determine binding status without using local cache
      try {
        const lookupFn = httpsCallable<any, any>(
          functions,
          "lookupBoundInstitutionForGoogleUser"
        );
        const lookupRes = await lookupFn({ email: userEmail, uid: result.user.uid });
        const { status, institusiId, isBlocked, message } = lookupRes.data || {};

        if (status === "BOUND_SINGLE" && institusiId) {
          if (isBlocked) {
            await auth.signOut();
            setError(message || "Akses disekat untuk akaun ini. Sila hubungi pegawai PPDGM.");
            setGoogleUser(null);
            setLoading(false);
            return;
          }
          // BOUND_SINGLE: Login directly, skip selection dropdown
          setLoading(false);
          onSuccess("institusi", institusiId);
          return;
        } else if (status === "CONFLICT_MULTIPLE") {
          // CONFLICT_MULTIPLE: Block login and show clean Malay warning
          await auth.signOut();
          setError(message || "Ralat data pautan dikesan. Akaun Google ini dipautkan kepada lebih daripada satu institusi. Sila hubungi pegawai PPDGM untuk semakan dan tetapan semula pautan.");
          setGoogleUser(null);
          setLoading(false);
          return;
        } else {
          // UNBOUND: first-time binding shows dropdown selection
          setGoogleUser({
            email: userEmail,
            uid: result.user.uid,
            displayName: result.user.displayName
          });
          setLoading(false);
        }
      } catch (lookupErr: any) {
        console.warn("Ralat lookupBoundInstitutionForGoogleUser, menjalankan lookup fallback berasaskan Firestore: ", lookupErr);
        try {
          // Robust client-side binding state parser using institusiPublic
          const publicInsts = await fetchPublicInstitusiList();
          const normalizedEmail = userEmail.toLowerCase().trim();
          
          // Match by google bound email, other bound email, or uid
          const matchedDocs = publicInsts.filter(inst => {
            const pAcc = inst.portalAccess || {};
            const boundGoogleEmail = (pAcc.boundGoogleEmail || "").toLowerCase().trim();
            const boundEmail = (pAcc.boundEmail || "").toLowerCase().trim();
            const boundGoogleUid = pAcc.boundGoogleUid || "";
            const authUid = pAcc.authUid || "";
            const boundUid = pAcc.boundUid || "";
            const instId = inst.id || "";
            
            return boundGoogleEmail === normalizedEmail || 
                   boundEmail === normalizedEmail || 
                   (result.user.uid && (boundGoogleUid === result.user.uid || authUid === result.user.uid || boundUid === result.user.uid || instId === result.user.uid));
          });

          if (matchedDocs.length === 0) {
            // UNBOUND: first-time binding shows dropdown selection
            setGoogleUser({
              email: userEmail,
              uid: result.user.uid,
              displayName: result.user.displayName
            });
            setInstitutions(publicInsts); // cache list immediately
            setLoading(false);
          } else if (matchedDocs.length > 1) {
            // CONFLICT_MULTIPLE: Account is bound to more than one institution/IPS. Block login entirely.
            await auth.signOut();
            setError("Ralat data pautan dikesan. Akaun Google ini dipautkan kepada lebih daripada satu institusi. Sila hubungi pegawai PPDGM untuk semakan dan tetapan semula pautan.");
            setGoogleUser(null);
            setLoading(false);
          } else {
            // BOUND_SINGLE: Active single binding
            const matchedDoc = matchedDocs[0];
            const pAcc = matchedDoc.portalAccess || {};
            const isBlocked = pAcc.credentialStatus === "disekat" || 
                              pAcc.authStatus === "disekat" || 
                              (pAcc.enabled === false && pAcc.credentialStatus !== "belum-diset" && pAcc.credentialStatus !== undefined);
            
            const namaInstitusi = matchedDoc.namaInstitusi || matchedDoc.nama || "Institusi Swasta";
            
            if (isBlocked) {
              await auth.signOut();
              setError(`Akses ditolak: Portal bagi institusi '${namaInstitusi}' telah disekat. Sila hubungi Pegawai Swasta PPD Gua Musang.`);
              setGoogleUser(null);
              setLoading(false);
              return;
            }

            // BOUND_SINGLE: Login directly
            setLoading(false);
            onSuccess("institusi", matchedDoc.id);
          }
        } catch (fallbackErr: any) {
          console.error("Client-side fallback lookup failed: ", fallbackErr);
          await auth.signOut();
          setError("Ralat menyemak status pautan akaun. Sila cuba lagi atau hubungi pegawai PPDGM jika ralat berterusan.");
          setGoogleUser(null);
          setLoading(false);
        }
      }
    } catch (authError: any) {
      console.warn("Institusi Google Auth failed:", authError);
      setError("Log masuk Google dibatalkan atau ralat semasa pengesahan. Sila cuba lagi.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUser) {
      setError("Sila log masuk dengan Google terlebih dahulu.");
      return;
    }

    if (!selectedInstitusiId) {
      setError("Sila pilih institusi terlebih dahulu.");
      return;
    }

    setError(null);
    setLoading(true);

    const chosen = institutions?.find((i) => i.id === selectedInstitusiId);
    if (!chosen) {
      setError("Institusi swasta tidak ditemui. Sila pastikan pilihan institusi anda sah.");
      setLoading(false);
      return;
    }

    // Call Cloud Function to perform transactional bind or validate
    try {
      const bindOrValidateFn = httpsCallable<any, any>(
        functions,
        "bindOrValidateInstitutionAccess"
      );
      
      const response = await bindOrValidateFn({
        institusiId: chosen.id,
        email: googleUser.email,
        uid: googleUser.uid,
        displayName: googleUser.displayName || null
      });

      if (response.data && response.data.success) {
        // Successfully bound or validated access
        setLoading(false);
        onSuccess("institusi", chosen.id);
      } else {
        throw new Error("Pautan dari server gagal. Teruskan dengan fallback.");
      }
    } catch (bindErr: any) {
      console.warn("Cloud Function binding failure, attempting client-side fallback:", bindErr);
      try {
        await bindInstitutionAccessClient(chosen.id, googleUser, chosen.portalAccess);
        setLoading(false);
        onSuccess("institusi", chosen.id);
      } catch (fallbackErr: any) {
        console.error("Fallback binding failure:", fallbackErr);
        setError(fallbackErr.message || "Pautan akaun gagal dijalankan. Sila hubungi pegawai PPDGM.");
        setLoading(false);
      }
    }
  };

  const handleBack = async () => {
    if (selectedRole === "institusi" && googleUser) {
      try {
        await auth.signOut();
      } catch (err) {
        console.warn("Sign out during back action failed:", err);
      }
    }
    setSelectedRole(null);
    setGoogleUser(null);
    setError(null);
    setInstitutions(null);
    setSelectedInstitusiId("");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-[#f7f6f2] font-sans selection:bg-[#01696f] selection:text-white" id="login-gate-container">
      
      {/* 1. BRANDING & TRUST PANEL (Left Panel - 5 Cols on large, 12 on mobile) */}
      <div className="col-span-1 md:col-span-5 lg:col-span-4 bg-gradient-to-b from-[#0a2729] to-[#051719] text-white flex flex-col justify-between items-center p-8 md:p-12 relative overflow-hidden shadow-2xl z-10" id="login-branding-panel">
        
        {/* Subtle background matrix decoration */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#01696f_1px,transparent_1px)] [background-size:20px_20px]" />
        
        {/* Header containing Logo & Identity Context with premium centered alignment */}
        <div className="flex flex-col items-center justify-center gap-6 my-auto relative z-10 w-full text-center">
          
          {/* Standalone Logo without wrappers - Exactly 2x Larger for Clean Branding */}
          <img
            src="/icons/android-chrome-512x512.png"
            alt="Logo Unit Swasta SPS Gua Musang"
            referrerPolicy="no-referrer"
            className="w-[160px] h-[160px] md:w-[208px] md:h-[208px] object-contain shrink-0 mx-auto"
            id="brand-logo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/icons/apple-touch-icon.png"; // Elegant local visual fallback
            }}
          />

          <div className="space-y-4 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#01696f]/40 text-[#4bf3fc] border border-[#01696f]/50 mx-auto">
              Kementerian Pendidikan Malaysia
            </span>
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Dashboard Unit Swasta <br className="hidden sm:inline" />SPS PPD Gua Musang
              </h1>
              <p className="text-xs md:text-sm text-[#abe3e5] font-semibold tracking-wider uppercase">
                Sektor Pengurusan Sekolah • Unit Swasta
              </p>
            </div>
            
            <div className="h-[2px] w-14 bg-gradient-to-r from-[#01696f] to-transparent my-4 mx-auto" />
            
            <p className="text-xs text-slate-300 leading-relaxed font-light max-w-xs md:max-w-md mx-auto">
              Portal Rasmi Pengurusan dan Pemantauan Institusi Pendidikan Swasta di bawah naungan Jabatan Pendidikan.
            </p>
          </div>
        </div>

        {/* Footer info in left panel (Desktop-only to prevent clutter on mobile) */}
        <div className="hidden md:flex flex-col items-center mt-auto relative z-10 w-full text-center" id="branding-footer-desktop">
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
              {selectedRole === null 
                ? "Log Masuk Portal" 
                : selectedRole === "ppdgm" 
                  ? "Sahkan Identiti Pegawai" 
                  : googleUser 
                    ? "Pilih Institusi Anda" 
                    : "Log Masuk Google / Gmail"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {selectedRole === null 
                ? "Sila pilih jenis peranan anda untuk terus mengakses data bersepadu unit swasta."
                : "Sila ikuti langkah kelayakan keselamatan untuk memasuki portal rasmi."}
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
                    {/* BUTTON 1: PPDGM (PEGAWAI UNIT SWASTA) */}
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
                          Pihak Pengurusan Sekolah / Pusat Bimbingan Swasta (Self-Service Google Binding)
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
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-bold">Mod Kebenaran Akses</h3>
                      <p className="text-xs font-black text-slate-800">PEGAWAI UNIT SWASTA PPDGM</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleGoogleSignIn}
                      className={`w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer ${
                        loading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading ? (
                        <span>Mengesahkan...</span>
                      ) : (
                        <>
                          <svg className="w-5 h-5 animate-scale-up" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-700 font-semibold text-left animate-fade-in" id="error-message">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
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
              ) : googleUser === null ? (
                /* SECTION 2B-1: ACCESS FOR INSTITUSI (GOOGLE AUTH INIT) */
                <motion.div
                  key="login-institusi-google-init"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5 text-left"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-lg shrink-0 bg-[#006494]/10 text-[#006494]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-bold">Mod Kebenaran Akses</h3>
                      <p className="text-xs font-black text-slate-800 font-black">PORTAL INSTITUSI SWASTA</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs text-slate-650 font-medium leading-relaxed" id="info-google-first-pembaca">
                    <p>
                      <strong>Sistem Hubungan Pengesahan Google</strong>
                    </p>
                    <p className="text-slate-500 leading-normal text-[11px]">
                      Sistem kami kini bersandarkan pengesahan Google/Gmail yang pantas dan selamat. Sila log masuk ke akaun Google anda terlebih dahulu untuk mendaftar dan memautkan IPS yang sah.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleInstitusiGoogleSignIn}
                      className={`w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer ${
                        loading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading ? (
                        <span>Mendesah...</span>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          <span>Log Masuk Google/Gmail</span>
                        </>
                      )}
                    </button>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-700 font-semibold animate-fade-in" id="error-message">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center justify-center gap-1.5 cursor-pointer py-2 transition-colors border border-transparent hover:border-slate-200 rounded-lg"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* SECTION 2B-2: CHOOSE INSTITUSI AND VALIDATE BINDING (SELF-BIND FLOW) */
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
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-lg shrink-0 bg-[#006494]/10 text-[#006494]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-bold">Mod Kebenaran Akses</h3>
                      <p className="text-xs font-black text-slate-800">PORTAL PAPAN INSTITUSI</p>
                    </div>
                  </div>

                  {/* Active Google User Identity Card with explicit switch capability */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Mail className="w-4.5 h-4.5 text-slate-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none pb-1">Akaun Google Aktif</span>
                        <span className="font-semibold text-slate-800 block truncate">{googleUser?.displayName || "Pemilik/Wakil IPS"}</span>
                        <span className="font-bold text-[#006494] block truncate font-mono text-[11px] select-all">{googleUser?.email}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-2.5 py-1 text-[10px] font-black bg-white hover:bg-slate-100 text-[#006494] border border-slate-250 rounded-lg cursor-pointer transition-all shrink-0 shadow-3xs"
                    >
                      Tukar Akaun
                    </button>
                  </div>

                  {/* Institution Selection Dropdown */}
                  <div className="space-y-1.5 text-left font-sans">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block">
                      PILIH TADIKA / SEKOLAH SWASTA (IPS)
                    </label>

                    <div className="relative">
                      <select
                        value={selectedInstitusiId}
                        onChange={(e) => {
                          setSelectedInstitusiId(e.target.value);
                          setError(null);
                        }}
                        className={`w-full bg-slate-50 border border-slate-250 text-slate-900 text-xs rounded-xl pl-4 pr-10 py-3.5 font-semibold transition-all focus:border-[#006494] focus:bg-white focus:outline-none appearance-none cursor-pointer ${
                          loading ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                        required
                        disabled={loading}
                      >
                        {institutions === null ? (
                          <option value="">Sedang memuat senarai institusi...</option>
                        ) : institutions.length === 0 ? (
                          <option value="">Tiada institusi berdaftar ditemui. Hubungi pegawai PPDGM.</option>
                        ) : (
                          <>
                            <option value="">Sila pilih tadika / institusi</option>
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

                  {/* Contextual dynamic binding evaluation feedback */}
                  {selectedInstitusiId && (() => {
                    if (institutions === null) {
                      return (
                        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-xs text-slate-600 font-semibold text-left">
                          <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5 animate-pulse" />
                          <span>Sedang memproses rekod institusi...</span>
                        </div>
                      );
                    }
                    const chosen = institutions.find((i) => i.id === selectedInstitusiId);
                    if (!chosen) return null;
                    const pAcc = chosen.portalAccess;

                    // 1. Check explicitly suspended status by Admin
                    const isExplicitlyBlocked = pAcc && (pAcc.credentialStatus === "disekat" || pAcc.authStatus === "disekat" || (pAcc.enabled === false && pAcc.credentialStatus !== "belum-diset" && pAcc.credentialStatus !== undefined));
                    
                    if (isExplicitlyBlocked) {
                      return (
                        <div className="mt-2 p-3.5 bg-rose-50 border border-rose-150 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-semibold text-left leading-relaxed">
                          <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-500 mt-0.5" />
                          <div>
                            <strong>Akses Dinonaktifkan atau Disekat:</strong> Akses portal bagi institusi ini telah disekat atau belum diaktifkan oleh pegawai PPDGM. Sila hubungi pejabat PPD Gua Musang untuk sebarang pertolongan.
                          </div>
                        </div>
                      );
                    }

                    // 2. Identify binding status
                    const boundEmail = pAcc?.boundGoogleEmail || pAcc?.boundEmail;
                    const normalizedEmail = googleUser.email.toLowerCase().trim();

                    if (!boundEmail) {
                      // CASE A: Portal IPS belum dipautkan (Self Service Binding)
                      return (
                        <div className="space-y-4 animate-fade-in animate-duration-300">
                          <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-850 font-semibold text-left leading-relaxed shadow-3xs" id="first-time-binding-warning">
                            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 animate-bounce-slow" />
                            <div className="space-y-1">
                              <p className="font-extrabold text-amber-900 uppercase tracking-wide text-[10px]">Pautan Pentadbiran Kali Pertama</p>
                              <p className="normal-case leading-normal text-slate-700">
                                <strong>Penting:</strong> Kali pertama anda berjaya log masuk ke IPS ini, akaun Google semasa akan dipautkan secara automatik kepada institusi ini. Selepas itu, akaun Google lain tidak boleh menggunakan IPS yang sama kecuali pegawai PPDGM membuat tetapan semula.
                              </p>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className={`w-full text-white text-xs font-black tracking-widest py-3.5 px-4 rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 uppercase active:scale-[0.98] bg-amber-600 hover:bg-amber-700 shadow-amber-600/15 ${
                                loading ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                            >
                              {loading ? (
                                <span>Mengunci & Memaut...</span>
                              ) : (
                                <>
                                  <span>Sahkan & Pautkan Akaun</span>
                                  <ShieldCheck className="w-4 h-4 text-white/50" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    } else if (boundEmail.toLowerCase().trim() === normalizedEmail) {
                      // CASE B: Portal IPS dipautkan ke emel aktif pengguna
                      return (
                        <div className="space-y-4 animate-fade-in animate-duration-300">
                          <div className="mt-2 p-4 bg-emerald-50 border border-emerald-250 rounded-xl flex items-start gap-3 text-xs text-emerald-850 font-semibold text-left leading-relaxed shadow-3xs">
                            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-extrabold text-emerald-950 uppercase tracking-wide text-[10px]">Pautan Berdaftar Sah</p>
                              <p className="normal-case leading-normal text-emerald-800">
                                Akaun Google anda sah dan telah dipautkan secara mutlak kepada institusi ini. Anda bebas masuk ke portal sekarang.
                              </p>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className={`w-full text-white text-xs font-black tracking-widest py-3.5 px-4 rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 uppercase active:scale-[0.98] bg-[#006494] hover:bg-[#005178] shadow-[#006494]/15 ${
                                loading ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                            >
                              {loading ? (
                                <span>Menyambung...</span>
                              ) : (
                                <>
                                  <span>Teruskan ke Dashboard Institusi</span>
                                  <ArrowLeft className="w-4 h-4 rotate-180 text-white/50" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      // CASE C: Portal IPS dipautkan ke emel orang lain
                      return (
                        <div className="mt-2 p-4 bg-rose-50 border border-rose-150 rounded-xl flex items-start gap-3 text-xs text-rose-800 font-semibold text-left leading-relaxed shadow-3xs">
                          <AlertTriangle className="w-5 h-5 shrink-0 text-[#ef4444] mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-extrabold text-[#be123c] uppercase tracking-wide text-[10px]">Ralat Pautan Kekal</p>
                            <p className="normal-case leading-normal text-rose-700">
                              Institusi ini telah dipautkan secara kekal kepada emel Google yang lain (<span className="font-extrabold text-rose-950 select-all font-mono">{boundEmail}</span>). Sila gunakan akaun berdaftar yang betul atau hubungi pegawai PPDGM kementerian untuk menetapkan semula pautan.
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })()}

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-700 font-semibold text-left animate-fade-in" id="error-message">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-[#ef4444]" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submission and back actions container */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
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
