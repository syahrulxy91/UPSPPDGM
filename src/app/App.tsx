import React, { Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppShell from "../shared/components/layout/AppShell";
import LoadingSkeleton from "../shared/components/ui/LoadingSkeleton";
import routes from "./routes";
import { LoginGate, useSessionTimeout } from "../features/auth";
import { RoleProvider, useRole } from "../shared/contexts/RoleContext";
import { InstitusiPortalDashboard } from "../features/institusi-portal/pages/InstitusiPortalDashboard";
import { auth } from "../lib/firebase";
import { isAllowedPpdgmEmail } from "../features/auth/utils/emailValidator";

const TIMEOUT_DURATION_MS = 1800000; // 30 minutes in milliseconds

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("sps_portal_authenticated") === "true";
  });
  const [portalRole, setPortalRole] = useState<"ppdgm" | "institusi">((() => {
    const saved = localStorage.getItem("sps_portal_role");
    return (saved === "institusi" ? "institusi" : "ppdgm") as "ppdgm" | "institusi";
  }));
  const [activeInstitusiId, setActiveInstitusiId] = useState<string>(() => {
    return localStorage.getItem("sps_active_institusi_id") || "";
  });
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Monitor activity and log out automatically on timeout
  useSessionTimeout({
    enabled: authenticated,
    timeoutMs: TIMEOUT_DURATION_MS,
    onTimeout: () => {
      setAuthenticated(false);
      setSessionExpired(true);
      localStorage.removeItem("sps_portal_authenticated");
    },
  });

  // Background sync for Firebase Auth session
  useEffect(() => {
    let active = true;
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!active) return;
      
      try {
        const isLocallyAuthenticated = localStorage.getItem("sps_portal_authenticated") === "true";
        const savedRole = localStorage.getItem("sps_portal_role") as "ppdgm" | "institusi";

        if (user) {
          console.info("Firebase Auth session ready:", user.email);
          if (!isLocallyAuthenticated) {
            const email = user.email || "";
            if (isAllowedPpdgmEmail(email)) {
              setAuthenticated(true);
              setPortalRole("ppdgm");
              localStorage.setItem("sps_portal_authenticated", "true");
              localStorage.setItem("sps_portal_role", "ppdgm");
            } else if (email.startsWith("institusi")) {
              setAuthenticated(true);
              setPortalRole("institusi");
              localStorage.setItem("sps_portal_authenticated", "true");
              localStorage.setItem("sps_portal_role", "institusi");
            }
          } else {
            // Re-verify PPDGM email on every load if locally authenticated
            if (savedRole === "ppdgm" && !isAllowedPpdgmEmail(user.email || "")) {
               console.warn("Akses dilucutkan: Emel tidak mematuhi syarat PPDGM.");
               handleLogout();
            }
          }
        } else {
          // If locally authenticated but Firebase Auth is not loaded, attempt silent auto-sync
          if (isLocallyAuthenticated) {
            if (savedRole === "ppdgm") {
              console.warn("PPDGM Firebase Auth session departed, resetting state.");
              handleLogout();
            } else {
              // For "institusi", clear or prompt login if session is empty
              console.warn("Institusi Firebase Auth session departed, resetting state.");
              handleLogout();
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (role: "ppdgm" | "institusi", selectedInstitusiId?: string) => {
    setAuthenticated(true);
    setPortalRole(role);
    setSessionExpired(false);
    
    localStorage.setItem("sps_portal_authenticated", "true");
    localStorage.setItem("sps_portal_role", role);
    if (selectedInstitusiId) {
      setActiveInstitusiId(selectedInstitusiId);
      localStorage.setItem("sps_active_institusi_id", selectedInstitusiId);
    } else {
      setActiveInstitusiId("");
      localStorage.removeItem("sps_active_institusi_id");
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setSessionExpired(false);
    localStorage.removeItem("sps_portal_authenticated");
    localStorage.removeItem("sps_portal_role");
    localStorage.removeItem("sps_active_institusi_id");
    localStorage.removeItem("sps_uat_active_role");
    localStorage.removeItem("sps_uat_active_email");
    auth.signOut().catch((err) => console.error("Gagal menamatkan sesi Firebase Auth:", err));
  };

  // Render beautiful full page loading spinner while stabilizing Firebase Auth session
  if (initializing && authenticated) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center p-8 font-sans">
        <div className="w-full max-w-md text-center space-y-6">
          <img src="/icons/android-chrome-512x512.png" alt="SPS" referrerPolicy="no-referrer" className="w-16 h-16 mx-auto animate-pulse rounded-xl" />
          <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Memulakan Sesi Keselamatan</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Sila tunggu seketika sementara pangkalan data SPS menghubungkan kelayakan anda...</p>
          </div>
          <div className="max-w-xs mx-auto">
            <LoadingSkeleton rows={3} />
          </div>
        </div>
      </div>
    );
  }

  // Render LoginGate if not authenticated
  if (!authenticated) {
    return (
      <>
        <LoginGate
          sessionExpired={sessionExpired}
          onSuccess={handleLoginSuccess}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  // Render Portals based on the role
  if (portalRole === "institusi") {
    return (
      <>
        <InstitusiPortalDashboard 
          institusiId={activeInstitusiId} 
          onLogout={handleLogout} 
        />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <RoleProvider>
      <AppRoutes handleLogout={handleLogout} />
    </RoleProvider>
  );
}

function AppRoutes({ handleLogout }: { handleLogout: () => void }) {
  const { userEmail } = useRole();

  return (
    <BrowserRouter>
      <AppShell
        title="Dashboard Unit Swasta"
        userEmail={userEmail}
        onLogout={handleLogout}
      >
        <Suspense fallback={
          <div className="max-w-4xl mx-auto py-8">
            <LoadingSkeleton rows={5} />
          </div>
        }>
          <Routes>
            {routes.map((route) => {
              const DynamicRoute = Route as any;
              return (
                <DynamicRoute key={route.path} path={route.path} element={route.element} />
              );
            })}
            {/* Catch-all navigation fallback: redirects any invalid route back to "/" */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
