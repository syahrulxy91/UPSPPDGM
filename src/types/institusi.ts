/**
 * TypeScript definitions for Institusi domain in Dashboard Unit Swasta PPD Gua Musang.
 */

export type InstitusiKategori = "tadika swasta" | "sekolah swasta" | "pusat tuisyen";
export type InstitusiStatus = "aktif" | "tidak aktif" | "digantung";

export interface PortalAccess {
  enabled?: boolean;
  credentialStatus?: "aktif" | "belum-diset" | "disekat";
  loginReady?: boolean;
  
  // Firebase Auth Production Parameters
  authUid?: string;
  authStatus?: "aktif" | "disekat" | "belum-diset";
  activatedBy?: string;
  activatedAt?: string;

  // Google binding parameters
  boundEmail?: string;
  boundUid?: string;
  boundGoogleEmail?: string | null;
  boundGoogleUid?: string | null;
  boundGoogleDisplayName?: string | null;
  boundAt?: string | null;
  boundBy?: "self-first-login" | "ppdgm-admin" | null;
  bindingLocked?: boolean;
  authMode?: "google-first-bind";
}

export interface PemilikPengurusan {
  // A. Maklumat Pemilik Utama (Wajib)
  namaPemilik: string;
  noIC: string;
  jantina: "Lelaki" | "Perempuan" | string;
  tarikhLahir: string;
  negara: "Malaysia" | "Bukan Malaysia" | string;
  statusPemilik: "Pemilik Tunggal" | "Pemilik Bersama" | "Pengarah Syarikat" | string;

  // B. Alamat & Kontak Pemilik (Wajib)
  alamatPenuh: string;
  poskod: string;
  bandar: string;
  negeri: string;
  noTelefon: string;
  noTelefonRumah?: string;
  emel: string;

  // C. Maklumat Syarikat (Pilihan / Bersyarat)
  namaSyarikat?: string;
  noPendaftaranSyarikat?: string;
  bentukSyarikat?: "Sdn Bhd" | "Berhad" | "Enterprise" | string;
  tarikhPendaftaranSyarikat?: string;
  statusSyarikat?: "Aktif" | "Tidak Aktif" | "Dissolved" | string;
  alamatSyarikat?: string;

  // D. Pengurusan Utama (Wajib)
  namaPengarah: string;
  noICPengarah: string;
  jawatanPengurusan: "Pengarah" | "Pengurus" | "Ketua Sekolah" | "Admin" | string;
  noTelefonPengurusan: string;
  emelPengurusan: string;
  tarikhMulaMengurus?: string;

  // E. Penyelaras Institusi (Wajib)
  namaPenyelaras: string;
  noICPenyelaras: string;
  noTelefonPenyelaras: string;
  emelPenyelaras: string;
  jawatanPenyelaras: string;
}

export interface InstitusiRecord {
  id: string;
  namaInstitusi: string;
  kategori: InstitusiKategori;
  zon: string;
  mukim: string;
  statusOperasi: InstitusiStatus;
  tarikhDaftar: string;
  noRujukan: string;
  alamat: string;
  pengelola?: string;
  telefon?: string;
  yuran_semasa?: number;
  yuranSemasa?: number;
  nama_gb?: string;
  namaGB?: string;
  nama_pengetua?: string;
  namaPengetua?: string;
  alamat_premis?: string;
  bil_murid?: number;
  bilGuru?: number;
  bil_guru?: number;
  tahun_dikemaskini?: string;
  portalAccess?: PortalAccess;
  statusProfil?: "belum-mula" | "sedang-dikemaskini" | "lengkap";
  statusPendaftaran?: "didaftarkan-awal" | "sebahagian" | "lengkap";
  completionPercentage?: number;
  source?: string;
  pemilikPengurusan?: PemilikPengurusan;
}
