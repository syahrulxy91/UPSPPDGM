export * from "./institusi";
export * from "./pematuhan";
export * from "./tindakan";
export * from "./dashboard";
export * from "./borang";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "admin" | "pegawai" | "pendaftar";
  createdAt: string;
}
