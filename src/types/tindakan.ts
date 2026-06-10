export type StatusKes = "baru" | "dalam tindakan" | "overdue" | "selesai";
export type KeutamaanKes = "tinggi" | "sederhana" | "rendah";

export interface TindakanRecord {
  id: string;
  namaInstitusi: string;
  jenisKes: string;
  pegawai: string;
  statusKes: StatusKes;
  keutamaan?: KeutamaanKes;
  tarikhTindakan?: string;
  jenisAktiviti?: string;
  catatan?: string;
}
