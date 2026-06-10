import React, { useState } from "react";
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  Phone, 
  User, 
  FileText, 
  Check, 
  ShieldAlert, 
  Sparkles,
  Layers,
  Home,
  CheckSquare
} from "lucide-react";
import { toast } from "react-hot-toast";
import { FieldError } from "../../../shared/components/ui/FieldError";
import { createInstitusiRecord } from "../services/institusiService";
import { useRole } from "../../../shared/contexts/RoleContext";

interface BorangPendaftaranProps {
  onBack: () => void;
}

// Timeout helper to prevent infinite loading state when Firestore is blocked or network is frozen
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function BorangPendaftaran({ onBack }: BorangPendaftaranProps) {
  const { userEmail, role } = useRole();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [namaInstitusi, setNamaInstitusi] = useState("");

  // Inline errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!namaInstitusi || namaInstitusi.trim().length < 5) {
      newErrors.namaInstitusi = "Nama institusi wajib diisi (minimum 5 aksara)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setNamaInstitusi("");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Sila perbetulkan ralat dalam borang!");
      return;
    }

    console.log("submit started");
    setLoading(true);
    try {
      const generatedNoRujukan = `KPM/SPS/GM-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Call creation service and wrap in withTimeout
      const creationPromise = createInstitusiRecord({
        namaInstitusi,
        kategori: "tadika swasta", // always default to tadika swasta for base record
        zon: "Gua Musang",
        mukim: "",
        alamat: "",
        telefon: "",
        poskod: "",
        emel: "",
        // Default seed setup
        statusOperasi: "aktif",
        statusPendaftaran: "didaftarkan-awal",
        source: "ppdgm-name-only-registration",
        statusProfil: "belum-mula", // 'belum-mula', 'sedang-dikemaskini', 'lengkap'
        completionPercentage: 0,
        noRujukan: generatedNoRujukan,
        tarikhDaftar: new Date().toISOString().split("T")[0],
      }, { email: userEmail, role });

      const response = await withTimeout(
        creationPromise,
        15000,
        "TIMEOUT: Sambungan ke pangkalan data terputus atau disekat oleh pelayar (ad-blocker / privacy extensions)."
      );
      
      setSuccess(true);
      toast.success(`Institusi "${response.namaInstitusi}" (ID: ${response.id}) berjaya didaftarkan!`);
    } catch (err: any) {
      console.log("createInstitusiRecord fail");
      console.error(err);

      const errMsg = err?.message || String(err || "");
      const isBlocked = 
        errMsg.includes("blocked") || 
        errMsg.includes("ERR_BLOCKED_BY_CLIENT") || 
        errMsg.includes("TIMEOUT") ||
        errMsg.includes("shield") ||
        errMsg.includes("extension") || 
        errMsg.includes("adblock") || 
        errMsg.includes("failed to fetch") || 
        errMsg.includes("unavailable") || 
        errMsg.includes("timeout") || 
        errMsg.includes("deadline") || 
        errMsg.includes("disconnected") || 
        errMsg.includes("offline") || 
        errMsg.includes("network");

      if (isBlocked) {
        toast.error(
          "Pendaftaran tidak dapat dihantar kerana sambungan ke pangkalan data disekat atau terganggu. Sila semak sambungan internet, cuba semula, atau matikan extension pelayar yang menyekat request.",
          { duration: 15000 }
        );
      } else {
        toast.error(`Pendaftaran gagal disimpan ke pangkalan data. ${errMsg || "Sila cuba semula."}`);
      }
    } finally {
      setLoading(false);
      console.log("submit finally reset");
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-center max-w-2xl mx-auto space-y-6" id="success-receipt-pendaftaran">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-xs mx-auto animate-bounce">
          <Check className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs text-secondary-600 font-extrabold tracking-widest uppercase leading-none block">
            PENDAFTARAN ASAS BERJAYA
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
            Institusi Didafarkan ke Senarai Awal
          </h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Rekod asas bagi <strong className="text-slate-800">{namaInstitusi || "Institusi IPS"}</strong> telah didaftarkan dengan jayanya. Pihak institusi kini boleh log masuk ke portal mereka untuk melengkapkan maklumat profil Bahagian A–H.
          </p>
        </div>

        <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-4.5 text-left text-xs space-y-3 font-mono my-4">
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
            <span className="text-slate-400">ID Sesi Permohonan:</span>
            <span className="text-slate-800 font-bold">IPS-{Math.floor(100000 + Math.random() * 900000)}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
            <span className="text-slate-400">Masa Penghantaran:</span>
            <span className="text-slate-800 font-semibold">{new Date().toLocaleString("ms-MY")}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => {
              resetForm();
              onBack();
            }}
            className="px-6 py-2.5 text-sm font-black bg-primary-800 hover:bg-primary-900 text-white rounded-full transition-all duration-200 cursor-pointer shadow-xs border border-primary-900 uppercase tracking-wider"
          >
            Kembali ke Senarai IPS
          </button>
          <button
            onClick={() => {
              resetForm();
              setSuccess(false);
            }}
            className="px-6 py-2.5 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all duration-200 cursor-pointer uppercase tracking-wider"
          >
            Daftar Institusi Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="borang-pendaftaran-institusi">
      {/* Page Header Actions / Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <button
          onClick={() => {
            resetForm();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 font-bold" />
          <span>Kembali ke Senarai</span>
        </button>
        <span className="text-xs text-secondary-600 font-extrabold tracking-widest uppercase">
          KEMENTERIAN PENDIDIKAN MALAYSIA
        </span>
      </div>

      <div className="text-center space-y-1.5 max-w-xl mx-auto py-2">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug tracking-tight">
          Borang Pendaftaran Institusi Pendidikan Swasta
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Penyediaan data permohonan pendaftaran serta kawal seliaan di bawah Akta Pendidikan 1996 (Akta 550) Unit Pendidikan Swasta PPD Gua Musang.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
        {/* SECTION 1: Maklumat Am */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-primary-700 font-bold text-sm">
              1
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian A: Maklumat Am Institusi
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Nama Penuh Institusi <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="cth. Tadika Islam Bestari Gua Musang"
                value={namaInstitusi}
                onChange={(e) => {
                  setNamaInstitusi(e.target.value);
                  setErrors((prev) => ({ ...prev, namaInstitusi: "" }));
                }}
                className={`w-full bg-slate-50 border text-slate-900 text-sm rounded-xl px-3 py-2.5 font-semibold focus:bg-white focus:outline-hidden ${
                  errors.namaInstitusi ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-primary-500"
                }`}
                required
              />
              <FieldError error={errors.namaInstitusi} />
            </div>
          </div>
        </section>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200/80 pt-6">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onBack();
            }}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all duration-200 cursor-pointer text-center uppercase tracking-wider"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 text-xs font-black bg-primary-800 hover:bg-primary-900 disabled:bg-primary-300 text-white rounded-full transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 uppercase tracking-widest border border-primary-900"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Hantar Borang...</span>
              </>
            ) : (
              <>
                <span>Hantar Borang Pendaftaran</span>
                <Check className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BorangPendaftaran;
