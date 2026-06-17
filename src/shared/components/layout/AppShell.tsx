import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { 
  Building2, 
  ShieldAlert, 
  ClipboardCheck, 
  Home, 
  UserCheck,
  FileText,
  TrendingUp,
  LogOut,
  ChevronDown,
  Settings
} from "lucide-react";
import { UatAdminPanel } from "../ui/UatAdminPanel";
import { useRole } from "../../contexts/RoleContext";

export interface AppShellProps {
  title: string;
  children: React.ReactNode;
  userEmail?: string;
  onLogout?: () => void;
}

export function AppShell({ 
  title, 
  children, 
  userEmail, 
  onLogout 
}: AppShellProps) {
  const { role } = useRole();
  const [hasRedBadge, setHasRedBadge] = useState<boolean>(false);
  const [hasOrangeBadge, setHasOrangeBadge] = useState<boolean>(false);

  useEffect(() => {
    // Dynamically calculate status-based stale warnings from Firestore
    const unsub = onSnapshot(collection(db, "borang"), (snapshot) => {
      let red = false;
      let orange = false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const status = data.status;
        const tarikhStr = data.tarikhKemuka || data.tarikh_kemuka;

        if (tarikhStr) {
          const parts = tarikhStr.split("-");
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const tarikh = new Date(year, month, day);
            tarikh.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - tarikh.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // RED badge: draf older than 7 days
            if (status === "draf" && diffDays > 7) {
              red = true;
            }
            // ORANGE badge: dikemukakan (submitted but unprocessed) older than 14 days
            if (status === "dikemukakan" && diffDays > 14) {
              orange = true;
            }
          }
        }
      });

      setHasRedBadge(red);
      setHasOrangeBadge(orange);
    }, (error) => {
      console.warn("Snapshot subscription failed for layout badges, falling back...", error);
    });

    return () => unsub();
  }, []);

  const menuItems = [
    { to: "/", id: "dashboard", label: "Dashboard", icon: Home },
    { to: "/institusi", id: "institusi", label: "Senarai IPS", icon: Building2 },
    { to: "/pematuhan", id: "pematuhan", label: "Status Pematuhan", icon: ClipboardCheck },
    { to: "/tindakan", id: "tindakan", label: "Tindakan Susulan", icon: ShieldAlert },
    { to: "/borang", id: "borang", label: "Urus Borang", icon: FileText },
    { to: "/laporan", id: "laporan", label: "Laporan & Analitik", icon: TrendingUp },
    ...((role === "superadmin" || role === "pegawai_ppd") ? [
      { to: "/tetapan", id: "tetapan", label: "Tetapan", icon: Settings }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex flex-col text-slate-900 antialiased font-sans selection:bg-[#01696f] selection:text-white" id="portal-root-layout">
      
      {/* Decorative Gold & Blue Accent Top Edge for Malaysia Official Identity - Exact colors */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#01696f] via-[#006494] to-[#e4a834] shrink-0" />

      {/* Premium Top Header with Academic Portal Brand Identity */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 shrink-0">
          
          {/* Official styled Shield / Badge Emblem from public/icons folder */}
          <img 
            src="/icons/apple-touch-icon.png" 
            alt="SPS" 
            className="w-10 h-10 object-contain rounded-xl shadow-md border border-slate-200/80 shrink-0 hover:scale-105 transition-all" 
            id="us-app-logo" 
            referrerPolicy="no-referrer"
          />

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-450 font-black tracking-widest uppercase leading-none mb-1">
              Kementerian Pendidikan Malaysia
            </span>
            <span className="text-sm md:text-[15px] font-black tracking-tight text-slate-900 leading-tight">
              SPS PPD Gua Musang • <span className="text-[#01696f] font-extrabold text-xs tracking-wide uppercase">Unit Swasta</span>
            </span>
          </div>
        </div>

        {/* Premium Horizontal Navigation (Desktop Only) with beautiful spacing */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#171614]/5 border border-slate-200/80 p-1.5 rounded-2xl mx-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4.5 py-2 rounded-xl text-xs font-black tracking-wide transition-all duration-200 focus:outline-none ${
                    isActive
                      ? "bg-[#01696f] text-white shadow-sm border border-[#01696f]/20"
                      : "text-slate-600 hover:bg-white hover:text-[#01696f] cursor-pointer"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? "text-[#4bf3fc]" : "text-slate-400 group-hover:text-[#01696f]"}`} />
                    <span className="flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {item.id === "borang" && hasRedBadge && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white animate-pulse" title="Ada draf borang terbengkalai (>7 hari)" />
                      )}
                      {item.id === "borang" && !hasRedBadge && hasOrangeBadge && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" title="Ada borang belum diproses (>14 hari)" />
                      )}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile, Active Role with simulation display */}
        <div className="flex items-center gap-3 shrink-0">
          {userEmail && (
            <div className="flex items-center gap-3">
              
              {/* Profile card metadata block */}
              <div className="hidden md:flex flex-col text-right">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-0.5">
                  Pegawai Aktif
                </span>
                <span className="text-xs font-black text-slate-800 max-w-[140px] truncate leading-tight">
                  {userEmail}
                </span>
                <div className="flex justify-end mt-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider leading-none select-none ${
                    role === "superadmin"
                      ? "bg-purple-50 text-purple-700 border border-purple-200/50"
                      : role === "pegawai_ppd"
                      ? "bg-teal-50 text-emerald-800 border border-teal-200/50"
                      : role === "penyemak"
                      ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {role === "superadmin" ? "S. Admin" : role === "pegawai_ppd" ? "Pegawai" : role === "penyemak" ? "Penyemak" : "Pemerhati"}
                  </span>
                </div>
              </div>

              <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-[#01696f]" />
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Log keluar sistem keselamatan"
                  className="inline-flex items-center justify-center p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Body Layout with responsive structure and centered limit width */}
      <div className="flex flex-1 relative" id="main-content-layout">
        {/* Sidebar Left Space is left out to focus on the luxury Horizontal Top Navigation */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-5 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Fully Responsive Mobile Bottom Navigation Menu with luxury look */}
      <nav className="lg:hidden fixed bottom-1.5 left-1.5 right-1.5 z-40 bg-white/95 backdrop-blur-md border border-slate-200/80 px-2 py-2.5 rounded-2xl flex items-center justify-around shadow-xl shadow-slate-900/5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-2 rounded-xl gap-1 min-w-[58px] transition-all focus:outline-none ${
                  isActive ? "text-[#01696f] font-black bg-[#01696f]/10" : "text-slate-400 hover:text-slate-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? "text-[#01696f]" : "text-slate-450"}`} />
                    {item.id === "borang" && hasRedBadge && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white animate-pulse" />
                    )}
                    {item.id === "borang" && !hasRedBadge && hasOrangeBadge && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold tracking-tight leading-normal">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Administrative Quality Panel */}
      <UatAdminPanel />
    </div>
  );
}

export default AppShell;
