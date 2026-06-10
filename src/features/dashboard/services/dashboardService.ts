import { getInstitusiList } from "../../institusi/services/institusiService";
import { getPematuhanList } from "../../pematuhan/services/pematuhanService";
import { getTindakanList } from "../../tindakan/services/kesService";
import { DashboardOverview, AlertItem, AktivitiItem, KesOverdueItem } from "../../../types/dashboard";

export async function getDashboardOverview(): Promise<DashboardOverview> {
  try {
    const [institusi, pematuhan, tindakan] = await Promise.all([
      getInstitusiList().catch(() => []),
      getPematuhanList().catch(() => []),
      getTindakanList().catch(() => []),
    ]);

    // 1. Jumlah Institusi Aktif
    const jumlahInstitusiAktif = institusi.filter(
      (ins) => ins.statusOperasi === "aktif"
    ).length;

    // 2. Kes Aktif: status "baru" atau "dalam tindakan"
    const kesAktif = tindakan.filter(
      (t) => t.statusKes === "baru" || t.statusKes === "dalam tindakan"
    ).length;

    // 3. Tindakan Segera (dari pematuhan tindakanSegera === true)
    const tindakanSegera = pematuhan.filter((p) => p.tindakanSegera).length;

    // 4. Dokumen Hampir Luput (pematuhan statusDokumen === "hampir luput")
    const dokumenHampirLuput = pematuhan.filter(
      (p) => p.statusDokumen === "hampir luput"
    ).length;

    // 5. Selesai Bulan Ini: tindakan status "selesai" & tarikhTindakan bermula dengan target bulan (contoh Mei 2026 -> "2026-05")
    const targetBulan = "2026-05"; // Sesuai dengan senario waktu Jun/Mei 2026
    const selesaiBulanIni = tindakan.filter(
      (t) => t.statusKes === "selesai" && String(t.tarikhTindakan ?? "").startsWith(targetBulan)
    ).length;

    // 6. Jalankan Penjanaan Alert Items secara dinamik
    const alertItems: AlertItem[] = [];
    
    pematuhan.forEach((p) => {
      if (p.tindakanSegera) {
        alertItems.push({
          id: `p-seg-${p.id}`,
          nama: p.namaInstitusi,
          keterangan: `Tindakan segera diperlukan bagi dokumen: ${p.jenisDokumen}`,
          tahap: "danger",
        });
      } else if (p.statusDokumen === "hampir luput") {
        alertItems.push({
          id: `p-lup-${p.id}`,
          nama: p.namaInstitusi,
          keterangan: `Dokumen "${p.jenisDokumen}" akan tamat tempoh tidak lama lagi (${p.tarikhTamat ?? "N/A"}).`,
          tahap: "warning",
        });
      }
    });

    tindakan.forEach((t) => {
      if (t.statusKes === "overdue") {
        alertItems.push({
          id: `t-ovd-${t.id}`,
          nama: t.namaInstitusi,
          keterangan: `Kes tertunggak (Overdue): ${t.jenisKes} dipantau oleh ${t.pegawai}`,
          tahap: "danger",
        });
      }
    });

    // Limit to maximum 10 crucial alerts
    const sortedAlerts = alertItems.slice(0, 10);

    // 7. Aktiviti Terkini (recent activities gabung tarikh terbaru)
    const aktivitiList: AktivitiItem[] = [];

    institusi.slice(0, 3).forEach((ins) => {
      if (ins.tarikhDaftar) {
        aktivitiList.push({
          id: `act-ins-${ins.id}`,
          tajuk: `Institusi baru berdaftar: ${ins.namaInstitusi}`,
          masa: ins.tarikhDaftar,
          pegawai: ins.pengelola || "Pengelola Sistem",
        });
      }
    });

    pematuhan.slice(0, 3).forEach((p) => {
      if (p.tarikhTamat) {
        aktivitiList.push({
          id: `act-pem-${p.id}`,
          tajuk: `Status dokumen ${p.jenisDokumen} dikemaskini: ${p.namaInstitusi}`,
          masa: p.tarikhTamat,
          pegawai: p.pegawai || "Sektor Swasta",
        });
      }
    });

    tindakan.slice(0, 4).forEach((t) => {
      if (t.tarikhTindakan) {
        aktivitiList.push({
          id: `act-tind-${t.id}`,
          tajuk: `Tindakan difailkan [${t.jenisKes}]: ${t.namaInstitusi}`,
          masa: t.tarikhTindakan,
          pegawai: t.pegawai,
        });
      }
    });

    // Urus aktiviti dengan susunan tarikh menurun (terkini dahulu)
    const aktivitiTerkini = aktivitiList
      .sort((a, b) => b.masa.localeCompare(a.masa))
      .slice(0, 5);

    // 8. Kes Overdue List
    const kesOverdue: KesOverdueItem[] = tindakan
      .filter((t) => t.statusKes === "overdue")
      .map((t) => ({
        id: t.id,
        namaInstitusi: t.namaInstitusi,
        jenisKes: t.jenisKes,
        pegawai: t.pegawai,
        statusKes: "overdue",
      }));

    return {
      jumlahInstitusiAktif,
      kesAktif,
      tindakanSegera,
      dokumenHampirLuput,
      selesaiBulanIni,
      alertItems: sortedAlerts,
      aktivitiTerkini,
      kesOverdue,
    };
  } catch (error) {
    console.error("Dashboard calculation error:", error);
    return {
      jumlahInstitusiAktif: 0,
      kesAktif: 0,
      tindakanSegera: 0,
      dokumenHampirLuput: 0,
      selesaiBulanIni: 0,
      alertItems: [],
      aktivitiTerkini: [],
      kesOverdue: [],
    };
  }
}

export default getDashboardOverview;
