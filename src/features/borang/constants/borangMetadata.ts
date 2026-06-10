export interface BorangMetadataItem {
  code: string;
  label: string;
  shortLabel: string;
  kategori: string;
  warnaBadge: string;
  supportsInstitusiLink: boolean;
  susunanPaparan: number;
}

export const BORANG_METADATA_REGISTRY: Record<string, BorangMetadataItem> = {
  BPS_I: {
    code: "BPS_I",
    label: "BPS I - Permohonan Penubuhan IPS",
    shortLabel: "Penubuhan IPS (BPS I)",
    kategori: "KUMPULAN 1 - PENUBUHAN & PENDAFTARAN",
    warnaBadge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    supportsInstitusiLink: false,
    susunanPaparan: 1,
  },
  BORANG_A: {
    code: "BORANG_A",
    label: "BORANG A - Permohonan Pendaftaran IPS",
    shortLabel: "Pendaftaran IPS (Borang A)",
    kategori: "KUMPULAN 1 - PENUBUHAN & PENDAFTARAN",
    warnaBadge: "bg-indigo-100 text-indigo-800 border-indigo-300",
    supportsInstitusiLink: true,
    susunanPaparan: 2,
  },
  BORANG_B_SEK03: {
    code: "BORANG_B_SEK03",
    label: "BORANG B SEK03 - Pendaftaran Pengelola/Pekerja IPS",
    shortLabel: "Pengelola/Pekerja (Sek03)",
    kategori: "KUMPULAN 1 - PENUBUHAN & PENDAFTARAN",
    warnaBadge: "bg-blue-50 text-blue-700 border-blue-200",
    supportsInstitusiLink: true,
    susunanPaparan: 3,
  },
  BPS_II_A: {
    code: "BPS_II_A",
    label: "BPS II A - Permohonan Surat Sokongan Pas Pengajian (Baharu)",
    shortLabel: "Pas Pengajian (Baharu II A)",
    kategori: "KUMPULAN 2 - PAS PELAJAR ANTARABANGSA",
    warnaBadge: "bg-sky-50 text-sky-700 border-sky-200",
    supportsInstitusiLink: true,
    susunanPaparan: 4,
  },
  BPS_II_B: {
    code: "BPS_II_B",
    label: "BPS II B - Permohonan Surat Sokongan Pas Pengajian (Lanjutan)",
    shortLabel: "Pas Pengajian (Lanjutan II B)",
    kategori: "KUMPULAN 2 - PAS PELAJAR ANTARABANGSA",
    warnaBadge: "bg-sky-100 text-sky-800 border-sky-300",
    supportsInstitusiLink: true,
    susunanPaparan: 5,
  },
  BPS_III: {
    code: "BPS_III",
    label: "BPS III - Permohonan Pas Pelajar (Baharu/Lanjutan)",
    shortLabel: "Pas Pelajar (BPS III)",
    kategori: "KUMPULAN 2 - PAS PELAJAR ANTARABANGSA",
    warnaBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    supportsInstitusiLink: true,
    susunanPaparan: 6,
  },
  BPS_IV: {
    code: "BPS_IV",
    label: "BPS IV - Permohonan Kenaikan Yuran",
    shortLabel: "Kenaikan Yuran (BPS IV)",
    kategori: "KUMPULAN 3 - PENGURUSAN OPERASI IPS",
    warnaBadge: "bg-amber-50 text-amber-700 border-amber-200",
    supportsInstitusiLink: true,
    susunanPaparan: 7,
  },
  BPS_V: {
    code: "BPS_V",
    label: "BPS V - Permohonan Tambah Struktur Kursus",
    shortLabel: "Struktur Kursus (BPS V)",
    kategori: "KUMPULAN 3 - PENGURUSAN OPERASI IPS",
    warnaBadge: "bg-amber-100 text-amber-800 border-amber-300",
    supportsInstitusiLink: true,
    susunanPaparan: 8,
  },
  BPS_VI: {
    code: "BPS_VI",
    label: "BPS VI - Permohonan Ubahsuai / Tambah / Pindah Premis",
    shortLabel: "Pindah Premis (BPS VI)",
    kategori: "KUMPULAN 3 - PENGURUSAN OPERASI IPS",
    warnaBadge: "bg-orange-50 text-orange-700 border-orange-200",
    supportsInstitusiLink: true,
    susunanPaparan: 9,
  },
  BPS_VII: {
    code: "BPS_VII",
    label: "BPS VII - Permohonan Pertukaran Nama Sekolah",
    shortLabel: "Tukar Nama IPS (BPS VII)",
    kategori: "KUMPULAN 3 - PENGURUSAN OPERASI IPS",
    warnaBadge: "bg-teal-50 text-teal-700 border-teal-200",
    supportsInstitusiLink: true,
    susunanPaparan: 10,
  },
  BPS_VIII: {
    code: "BPS_VIII",
    label: "BPS VIII - Permohonan Jual / Lupus / Bina Semula IPS",
    shortLabel: "Jual/Lupus IPS (BPS VIII)",
    kategori: "KUMPULAN 3 - PENGURUSAN OPERASI IPS",
    warnaBadge: "bg-rose-50 text-rose-700 border-rose-200",
    supportsInstitusiLink: true,
    susunanPaparan: 11,
  },
  BPS_XII: {
    code: "BPS_XII",
    label: "BPS XII - Permohonan Pertukaran GB / Pengetua / ALP",
    shortLabel: "Tukar Pengetua (BPS XII)",
    kategori: "KUMPULAN 3 - PENGURUSAN OPERASI IPS",
    warnaBadge: "bg-yellow-50 text-yellow-700 border-yellow-200",
    supportsInstitusiLink: true,
    susunanPaparan: 12,
  },
  BPS_XIII: {
    code: "BPS_XIII",
    label: "BPS XIII - Permohonan Tabung Pembinaan IPS",
    shortLabel: "Tabung Pembinaan (BPS XIII)",
    kategori: "KUMPULAN 3 - PENGURUSAN OPERASI IPS",
    warnaBadge: "bg-emerald-105 text-emerald-800 border-emerald-300",
    supportsInstitusiLink: true,
    susunanPaparan: 13,
  },
  BPS_DATA_01: {
    code: "BPS_DATA_01",
    label: "BPS DATA 01 - Borang Data Tahunan IPS (Pindaan 2016)",
    shortLabel: "Borang Data Tahunan (DATA 01)",
    kategori: "KUMPULAN 4 - DATA & PENYELIDIKAN",
    warnaBadge: "bg-purple-50 text-purple-700 border-purple-200",
    supportsInstitusiLink: true,
    susunanPaparan: 14,
  },
  BORANG_PENYELIDIKAN: {
    code: "BORANG_PENYELIDIKAN",
    label: "BORANG PENYELIDIKAN - Kebenaran Penyelidikan IPS",
    shortLabel: "Sijil Penyelidikan (PENYELIDIKAN)",
    kategori: "KUMPULAN 4 - DATA & PENYELIDIKAN",
    warnaBadge: "bg-purple-100 text-purple-800 border-purple-300",
    supportsInstitusiLink: true,
    susunanPaparan: 15,
  },
  BAYAR_01: {
    code: "BAYAR_01",
    label: "BAYAR 01 - Permohonan Resit Pembayaran",
    shortLabel: "Resit Pembayaran (BAYAR 01)",
    kategori: "KUMPULAN 5 - RESIT & PEMBAYARAN",
    warnaBadge: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
    supportsInstitusiLink: true,
    susunanPaparan: 16,
  },
};

export const BORANG_METADATA_LIST = Object.values(BORANG_METADATA_REGISTRY).sort(
  (a, b) => a.susunanPaparan - b.susunanPaparan
);

/**
 * Returns descriptive item from the registry. Fallbacks to a safe placeholder.
 */
export function getBorangMetadata(code: string): BorangMetadataItem {
  if (code && BORANG_METADATA_REGISTRY[code]) {
    return BORANG_METADATA_REGISTRY[code];
  }
  return {
    code: code || "LAIN",
    label: code ? `${code} - Borang Kebenaran Am Swasta` : "Borang Swasta Tidak Rasmi",
    shortLabel: code || "Borang Am",
    kategori: "KUMPULAN KHAS",
    warnaBadge: "bg-slate-100 text-slate-700 border-slate-250",
    supportsInstitusiLink: true,
    susunanPaparan: 99,
  };
}
