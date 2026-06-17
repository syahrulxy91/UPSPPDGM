import React, { lazy } from "react";

export interface RouteConfig {
  path: string;
  label: string;
  description: string;
  element: React.ReactNode;
}

const DashboardUtamaPage = lazy(() => import("../features/dashboard/pages/DashboardUtamaPage"));
const InstitusiPage = lazy(() => import("../features/institusi/pages/InstitusiPage"));
const PematuhanPage = lazy(() => import("../features/pematuhan/pages/PematuhanPage"));
const TindakanPage = lazy(() => import("../features/tindakan/pages/TindakanPage"));
const BorangPage = lazy(() => import("../features/borang/pages/BorangPage"));
const LaporanPage = lazy(() => import("../features/laporan/pages/LaporanPage"));
const TetapanPage = lazy(() => import("../features/dashboard/pages/TetapanPage"));

export const routes: RouteConfig[] = [
  {
    path: "/",
    label: "Dashboard",
    description: "Halaman Utama Pemantauan",
    element: <DashboardUtamaPage />,
  },
  {
    path: "/institusi",
    label: "Senarai Institusi",
    description: "Senarai Institusi Pendidikan Swasta",
    element: <InstitusiPage />,
  },
  {
    path: "/pematuhan",
    label: "Status Pematuhan",
    description: "Rekod pemeriksaan & piawaian pematuhan",
    element: <PematuhanPage />,
  },
  {
    path: "/tindakan",
    label: "Tindakan Susulan",
    description: "Tindakan penambahbaikan & tatatertib",
    element: <TindakanPage />,
  },
  {
    path: "/borang",
    label: "Pengurusan Borang",
    description: "Modul pemfailan borang rasmi BPS KPM",
    element: <BorangPage />,
  },
  {
    path: "/laporan",
    label: "Laporan & Analitik",
    description: "Statistik, KPI, dan graf pematuhan bersepadu",
    element: <LaporanPage />,
  },
  {
    path: "/tetapan",
    label: "Tetapan",
    description: "Katalis integrasi dan konfigurasi sistem",
    element: <TetapanPage />,
  },
];

export default routes;
