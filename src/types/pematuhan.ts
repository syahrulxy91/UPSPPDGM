import { InstitusiKategori } from "./institusi";

export type StatusDokumen = "lengkap" | "tidak lengkap" | "hampir luput";

export interface PematuhanRecord {
  id: string;
  namaInstitusi: string;
  kategori: InstitusiKategori;
  zon: string;
  jenisDokumen: string;
  statusDokumen: StatusDokumen;
  tarikhTamat?: string;
  tindakanSegera: boolean;
  pegawai?: string;
}
