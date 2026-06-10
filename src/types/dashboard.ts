export interface AlertItem {
  id: string;
  nama: string;
  keterangan: string;
  tahap: "warning" | "danger" | "info";
}

export interface AktivitiItem {
  id: string;
  tajuk: string;
  masa: string;
  pegawai?: string;
}

export interface KesOverdueItem {
  id: string;
  namaInstitusi: string;
  jenisKes: string;
  pegawai: string;
  statusKes: string;
}

export interface DashboardOverview {
  jumlahInstitusiAktif: number;
  kesAktif: number;
  tindakanSegera: number;
  dokumenHampirLuput: number;
  selesaiBulanIni: number;
  alertItems: AlertItem[];
  aktivitiTerkini: AktivitiItem[];
  kesOverdue: KesOverdueItem[];
}
