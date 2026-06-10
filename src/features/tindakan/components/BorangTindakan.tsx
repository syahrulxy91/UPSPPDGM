import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  User, 
  Calendar, 
  FileText, 
  Check, 
  AlertTriangle, 
  Zap, 
  Clock, 
  CheckCircle, 
  Briefcase,
  Layers,
  Settings,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getInstitusiList } from "../../institusi/services/institusiService";
import { InstitusiRecord } from "../../../types/institusi";
import { StatusKes, KeutamaanKes } from "../../../types/tindakan";

interface BorangTindakanProps {
  onBack: () => void;
  preselectedInstId?: string | null;
  preselectedIsu?: string | null;
  preselectedKeutamaan?: string | null;
}

export function BorangTindakan({ 
  onBack, 
  preselectedInstId,
  preselectedIsu,
  preselectedKeutamaan
}: BorangTindakanProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Institutions from service
  const [institutions, setInstitutions] = useState<InstitusiRecord[]>([]);
  const [loadingInst, setLoadingInst] = useState(true);

  // Selected values
  const [selectedInstId, setSelectedInstId] = useState("");
  const [selectedInst, setSelectedInst] = useState<InstitusiRecord | null>(null);

  // Form Field States
  const [jenisKes, setJenisKes] = useState("Siasatan Fail Pematuhan");
  const [customIsu, setCustomIsu] = useState("");
  const [keutamaan, setKeutamaan] = useState<KeutamaanKes>("sederhana");
  const [pegawai, setPegawai] = useState("Encik Ahmad Sukri Bin Ramli");
  const [tarikhTindakan, setTarikhTindakan] = useState(new Date().toISOString().split("T")[0]);
  const [jenisAktiviti, setJenisAktiviti] = useState("Lawatan Verifikasi");
  const [statusKes, setStatusKes] = useState<StatusKes>("baru");
  const [catatan, setCatatan] = useState("");
  const [arahanBertulis, setArahanBertulis] = useState("");

  const senaraiAktiviti = [
    "Lawatan Verifikasi",
    "Panggilan Sesi Kaunseling",
    "Mesyuarat Panel Khas",
    "Audit Dokumen Susulan",
    "Penyerahan Surat Amaran"
  ];

  // Fetch real institutions
  useEffect(() => {
    async function fetchInstitutions() {
      try {
        const list = await getInstitusiList();
        if (list.length === 0) {
          // Fallback static list
          const fallbackData: InstitusiRecord[] = [
            {
              id: "inst01",
              namaInstitusi: "Tadika Islam Bestari Gua Musang",
              kategori: "tadika swasta",
              zon: "Bandar Gua Musang",
              mukim: "Galas",
              statusOperasi: "aktif",
              tarikhDaftar: "2024-03-12",
              noRujukan: "SPSGM/IPS/TADIKA-2024-01",
              alamat: "Persiaran Raya, Bandar Baru, 18300 Gua Musang, Kelantan",
              pengelola: "Persatuan Kebajikan Islam Gua Musang",
              telefon: "09-9121234"
            },
            {
              id: "inst02",
              namaInstitusi: "Pusat Tuisyen Intelek Gemilang",
              kategori: "pusat tuisyen",
              zon: "Zon Paloh",
              mukim: "Paloh",
              statusOperasi: "aktif",
              tarikhDaftar: "2023-08-19",
              noRujukan: "SPSGM/IPS/TUISYEN-2023-04",
              alamat: "PT 1224, Tingkat 1, Jalan Besar Paloh, 18300 Gua Musang, Kelantan",
              pengelola: "Intelek Gemilang Sdn. Bhd.",
              telefon: "013-9876543"
            },
            {
              id: "inst03",
              namaInstitusi: "Sekolah Rendah Integrasi Tahfiz Al-Hikmah",
              kategori: "sekolah swasta",
              zon: "Zon Lojing",
              mukim: "Lojing",
              statusOperasi: "aktif",
              tarikhDaftar: "2025-01-05",
              noRujukan: "SPSGM/IPS/SEK-2025-02",
              alamat: "KM 45, Jalan Simpang Pulai-Gua Musang, Lojing, Kelantan",
              pengelola: "Yayasan Pendidikan Al-Hikmah",
              telefon: "011-2345678"
            }
          ];
          setInstitutions(fallbackData);
        } else {
          setInstitutions(list);
        }
      } catch (err) {
        console.error("Error loading institutions in Tindakan", err);
        setInstitutions([
          {
            id: "inst01",
            namaInstitusi: "Tadika Islam Bestari Gua Musang",
            kategori: "tadika swasta",
            zon: "Bandar Gua Musang",
            mukim: "Galas",
            statusOperasi: "aktif",
            tarikhDaftar: "2024-03-12",
            noRujukan: "SPSGM/IPS/TADIKA-2024-01",
            alamat: "Persiaran Raya, Bandar Baru, 18300 Gua Musang, Kelantan",
            pengelola: "Persatuan Kebajikan Islam Gua Musang",
            telefon: "09-9121234"
          }
        ]);
      } finally {
        setLoadingInst(false);
      }
    }

    fetchInstitutions();
  }, []);

  // Pre-fill fields if parameters are passed from parent / state
  useEffect(() => {
    if (institutions.length > 0) {
      const targetId = preselectedInstId || institutions[0]?.id;
      if (targetId) {
        setSelectedInstId(targetId);
        const match = institutions.find((inst) => inst.id === targetId) || institutions[0];
        setSelectedInst(match);
      }
    }
  }, [institutions, preselectedInstId]);

  useEffect(() => {
    if (preselectedIsu) {
      setJenisKes(preselectedIsu);
    }
    if (preselectedKeutamaan) {
      const level = preselectedKeutamaan.toLowerCase();
      if (level === "tinggi" || level === "sederhana" || level === "rendah") {
        setKeutamaan(level as KeutamaanKes);
      }
    }
  }, [preselectedIsu, preselectedKeutamaan]);

  const handleInstChange = (id: string) => {
    setSelectedInstId(id);
    const match = institutions.find((inst) => inst.id === id) || null;
    setSelectedInst(match);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId) {
      toast.error("Sila pilih institusi rujukan tindakan terlebih dahulu!");
      return;
    }

    setLoading(true);

    // Simulate saving Action to Firestore
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      toast.success("Eksplorasi arahan susul tindakan kes berjaya disuratkan!");
    }, 1200);
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-center max-w-2xl mx-auto space-y-6 animate-fade-in" id="success-receipt-tindakan">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-100 shadow-xs mx-auto animate-bounce">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs text-secondary-600 font-extrabold tracking-widest uppercase leading-none block">
            ARAHAN LAWATAN / TINDAKAN BERSEPADU
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
            Rekod Kes Berjaya Didokumentasikan
          </h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Tindakan susulan kes bagi subjek <strong className="text-slate-800">{selectedInst?.namaInstitusi}</strong> telah disuratkan secara rasmi bagi tujuan penguatkuasaan bersepadu.
          </p>
        </div>

        {/* Detailed Output Summary Receipt */}
        <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-5 text-left text-xs space-y-3.5 font-mono my-4">
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">ID Tindakan Susulan:</span>
            <span className="text-slate-800 font-bold">CASE-{Math.floor(100000 + Math.random() * 900000)}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">Institusi Sasaran:</span>
            <span className="text-slate-800 font-bold max-w-[280px] text-right truncate">{selectedInst?.namaInstitusi}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">Isu / Ketaatan Tergantung:</span>
            <span className="text-slate-800 font-bold text-right">{jenisKes}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">Bentuk Aktiviti Diatur:</span>
            <span className="text-slate-800 font-bold">{jenisAktiviti}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">Pegawai PPD Gua Musang:</span>
            <span className="text-slate-800 font-bold">{pegawai}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">Aras Keutamaan Kes:</span>
            <span className={`font-black px-2 py-0.5 rounded text-xs uppercase ${
              keutamaan === "tinggi" ? "text-rose-700 bg-rose-50" :
              keutamaan === "sederhana" ? "text-amber-700 bg-amber-50" :
              "text-emerald-700 bg-emerald-50"
            }`}>{keutamaan}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-400">Status Tindakan Semasa:</span>
            <span className="text-slate-900 font-black uppercase text-right">{statusKes}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={onBack}
            className="px-6 py-2.5 text-sm font-black bg-primary-800 hover:bg-primary-900 text-white rounded-full transition-all duration-200 cursor-pointer shadow-xs border border-primary-900 uppercase tracking-wider"
          >
            Selesai & Tutup
          </button>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2.5 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all duration-200 cursor-pointer uppercase tracking-wider"
          >
            Daftar Tindakan Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="borang-tindakan-institusi-terikat">
      {/* Header and controller */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 font-bold" />
          <span>Kembali ke Senarai Kes</span>
        </button>
        <span className="text-xs text-amber-800 font-extrabold tracking-widest uppercase flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/50">
          <Zap className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          ARAHAN TINDAKAN PPD (IPS)
        </span>
      </div>

      <div className="text-center space-y-1.5 max-w-xl mx-auto py-2">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug tracking-tight">
          Pendaftaran & Arahan Tindakan Susulan
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Kaitkan isu ketidakpatuhan dikesan semula jadi kepada institusi induk bagi memastikan koordinasi pemantauan PPD Gua Musang menyeluruh.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto" id="tindakan-submission-form">
        
        {/* SECTION 1: Institusi Dirujuk */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center text-amber-700 font-bold text-sm">
              1
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian A: Rujukan Institusi Induk & Isu Pematuhan
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Pilih Institusi Pendidikan Swasta <span className="text-rose-600">*</span>
              </label>
              {loadingInst ? (
                <div className="h-11 bg-slate-100 animate-pulse rounded-xl" />
              ) : (
                <select
                  value={selectedInstId}
                  onChange={(e) => handleInstChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-950 text-xs md:text-sm rounded-xl px-3.5 py-3 font-bold focus:border-amber-500 focus:outline-hidden cursor-pointer shadow-xs"
                >
                  <option value="" disabled>-- Sila Pilih Institusi --</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.namaInstitusi} ({inst.noRujukan || "No. Permit"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* AUTO-POPULATED DATA VIEW: READ-ONLY */}
            {selectedInst && (
              <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in text-xs">
                <div className="flex items-center gap-1.5 border-b border-slate-200/65 pb-2 text-primary-900 font-black tracking-wide uppercase text-xs">
                  <Building className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                  Profil Asas Institusi Dirujuk (Pre-Filled)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400 font-bold block uppercase">KATEGORI:</span>
                    <strong className="text-slate-800 font-extrabold capitalize">{selectedInst.kategori}</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400 font-bold block uppercase">ZON / MUKIM:</span>
                    <strong className="text-slate-800 font-extrabold">{selectedInst.zon} ({selectedInst.mukim || "Galas"})</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400 font-bold block uppercase">ALAMAT PREMIS:</span>
                    <strong className="text-slate-700 font-bold truncate block">{selectedInst.alamat || "N/A"}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: Butiran Isu Ketidakpatuhan & Kepentingan */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center text-amber-700 font-bold text-sm">
              2
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian B: Klasifikasi Kes & Aras Amaran Risiko
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Isu / Ketidakpatuhan Tergantung <span className="text-rose-600">*</span></label>
              <select
                value={jenisKes}
                onChange={(e) => setJenisKes(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-bold focus:border-amber-500 cursor-pointer shadow-xs"
              >
                <option value="Siasatan Fail Pematuhan">Siasatan Fail Pematuhan</option>
                <option value="Lesen Majlis Daerah Luput">Lesen Majlis Daerah (PBT) Luput</option>
                <option value="Sijil Bomba Luput / Gagal">Sijil Bomba Luput / Gagal Sijil</option>
                <option value="Sijil Kesihatan KKM Ditolak">Sijil Kesihatan / Sanitasi KKM Ditolak</option>
                <option value="Gagal Mengemuka CCC / Pelan">Gagal Mengemuka CCC / Pelan Lantai Sah</option>
                <option value="Kakitangan Tiada Kelayakan">Guru / Pengusaha Tiada Permit KPM</option>
                <option value="Aktiviti Luar Kebenaran">Aktiviti Luar Kebenaran (Silibus Tidak Sah)</option>
                <option value="Lain-Lain Aduan">Lain-Lain Komplikasi Khas</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Kategori Pemeringkatan Risiko <span className="text-rose-600">*</span></label>
              <select
                value={keutamaan}
                onChange={(e) => setKeutamaan(e.target.value as KeutamaanKes)}
                className="w-full bg-white border border-slate-200 text-slate-950 text-xs rounded-xl px-3 py-2.5 font-bold cursor-pointer"
              >
                <option value="rendah">Rendah (Makluman / Pembersihan Bilik)</option>
                <option value="sederhana">Sederhana (Peringatan Tempatan 30 Hari)</option>
                <option value="tinggi">Tinggi (Notis Amaran Khas / Tahan Permit)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Sasaran Tarikh Akhir Selesai <span className="text-rose-600">*</span></label>
              <input
                type="date"
                value={tarikhTindakan}
                onChange={(e) => setTarikhTindakan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-xs rounded-xl px-3 py-2 font-bold focus:border-amber-500"
                required
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: Aktiviti Diatur & Arahan Pegawai */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center text-amber-700 font-bold text-sm">
              3
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian C: Kerangka Kerja Penyelidikan & Arahan Pegawai PPD
            </h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Bentuk Aktiviti Semakan Utama</label>
              <div className="flex flex-wrap gap-2.5">
                {senaraiAktiviti.map((akt) => (
                  <button
                    type="button"
                    key={akt}
                    onClick={() => setJenisAktiviti(akt)}
                    className={`px-4 py-2 border rounded-full text-xs font-bold transition-all cursor-pointer ${
                      jenisAktiviti === akt 
                        ? "bg-slate-905 border-slate-905 bg-slate-900 text-white shadow-xs" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {akt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Pegawai Bertanggungjawab <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={pegawai}
                  onChange={(e) => setPegawai(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-bold focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Ketetapan Status Awal</label>
                <select
                  value={statusKes}
                  onChange={(e) => setStatusKes(e.target.value as StatusKes)}
                  className="w-full bg-white border border-slate-200 text-slate-950 text-xs rounded-xl px-3 py-2.5 font-bold cursor-pointer"
                >
                  <option value="baru">Baru (Aduan Diterima)</option>
                  <option value="dalam tindakan">Dalam Tindakan (Penyiasatan Lapangan)</option>
                  <option value="overdue">Tertunggak (Melewati Tarikh Had)</option>
                  <option value="selesai">Selesai (Ditutup Sempurna)</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Uraian Butiran Arahan Pembaikan (Bertulis)</label>
                <textarea
                  rows={3}
                  placeholder="Butiran terperinci arahan rujukan pembaikan bertulis dihantar ke alamat e-mel pengelola..."
                  value={arahanBertulis}
                  onChange={(e) => setArahanBertulis(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-990 text-xs rounded-xl px-3 py-2 font-semibold resize-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Catatan Log Aktiviti & Justifikasi Tapak</label>
                <textarea
                  rows={3}
                  placeholder="Tambahkan sebarang nota pemerhatian lawatan terkini secara telus mengikut kronologi peristiwa..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-990 text-xs rounded-xl px-3 py-2 font-semibold resize-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200/80 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all duration-200 cursor-pointer text-center uppercase tracking-wider"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 text-xs font-black bg-slate-950 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-full transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 uppercase tracking-widest border border-slate-950 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Mendaftar Rekod...</span>
              </>
            ) : (
              <>
                <span>Daftar Tindakan Susulan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
