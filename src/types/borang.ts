import { InstitusiKategori } from "./institusi";

export type BorangStatus = "draf" | "dikemukakan" | "diproses" | "lulus" | "tolak";

export interface BorangRecord {
  id: string;
  noRujukan: string;
  institusiId: string;
  namaInstitusi: string;
  jenisBorang: string; // e.g. "BPS I" | "BPS II" | "BPS III" | "BPS IV" | "BPS V"
  tarikhKemuka: string; // YYYY-MM-DD
  status: BorangStatus;
  pegawai: string;
  jenisInstitusi: string;
  catatan?: string;
  updatedAt?: string;
  detailFields?: Record<string, any>;
}
