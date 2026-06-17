import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  Phone, 
  User, 
  FileText, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckSquare, 
  FileCheck,
  ClipboardList,
  UserCheck,
  Zap,
  Info
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getInstitusiList } from "../../institusi/services/institusiService";
import { InstitusiRecord } from "../../../types/institusi";
import { createPematuhanRecord } from "../services/pematuhanService";
import { auth } from "../../../lib/firebase";

interface BorangPematuhanProps {
  onBack: (shouldRefresh?: boolean) => void;
  preselectedInstId?: string | null;
}

export function BorangPematuhan({ onBack, preselectedInstId }: BorangPematuhanProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Institutions state
  const [institutions, setInstitutions] = useState<InstitusiRecord[]>([]);
  const [loadingInst, setLoadingInst] = useState(true);

  // Field states
  const [selectedInstId, setSelectedInstId] = useState("");
  const [selectedInst, setSelectedInst] = useState<InstitusiRecord | null>(null);

  // 1. Technical Agency - PBT
  const [pbtStatus, setPbtStatus] = useState("Ada Kelulusan");
  const [pbtNoRujukan, setPbtNoRujukan] = useState("");
  const [pbtTarikhMohon, setPbtTarikhMohon] = useState("");
  const [pbtTarikhLulus, setPbtTarikhLulus] = useState("");
  const [pbtTarikhLuput, setPbtTarikhLuput] = useState("");
  const [pbtCatatan, setPbtCatatan] = useState("");

  // 2. Technical Agency - Bomba
  const [bombaStatus, setBombaStatus] = useState("Ada Kelulusan");
  const [bombaNoRujukan, setBombaNoRujukan] = useState("");
  const [bombaTarikhLawatan, setBombaTarikhLawatan] = useState("");
  const [bombaTarikhLulus, setBombaTarikhLulus] = useState("");
  const [bombaTarikhLuput, setBombaTarikhLuput] = useState("");
  const [bombaCatatan, setBombaCatatan] = useState("");

  // 3. Technical Agency - Pejabat Kesihatan (JKN/KKM)
  const [kesihatanStatus, setKesihatanStatus] = useState("Ada Kelulusan");
  const [kesihatanNoRujukan, setKesihatanNoRujukan] = useState("");
  const [kesihatanTarikhPeriksa, setKesihatanTarikhPeriksa] = useState("");
  const [kesihatanTarikhLulus, setKesihatanTarikhLulus] = useState("");
  const [kesihatanTarikhLuput, setKesihatanTarikhLuput] = useState("");
  const [kesihatanCatatan, setKesihatanCatatan] = useState("");

  // 4. Supporting Documents
  const [dokumenDiterima, setDokumenDiterima] = useState<string[]>([]);
  const [catatanDokumenBelumLengkap, setCatatanDokumenBelumLengkap] = useState("");
  const [linkDokumen, setLinkDokumen] = useState("");

  // 5. Non-compliance / Issues
  const [jenisIsu, setJenisIsu] = useState("tiada");
  const [tahapKeutamaan, setTahapKeutamaan] = useState("rendah");
  const [tindakanPembetulan, setTindakanPembetulan] = useState("");
  const [tarikhAkhirTindakan, setTarikhAkhirTindakan] = useState("");
  const [statusTindakan, setStatusTindakan] = useState("Belum Mula");

  // 6. Reviewer details
  const [namaPegawai, setNamaPegawai] = useState("Encik Ahmad Sukri Bin Ramli");
  const [jawatanPegawai, setJawatanPegawai] = useState("Penolong Pegawai Pendidikan (Unit Swasta)");
  const [tarikhSemakan, setTarikhSemakan] = useState(new Date().toISOString().split("T")[0]);
  const [keputusanSemakan, setKeputusanSemakan] = useState("Lulus Sempurna");

  // 7. Final Decision
  const [statusAkhir, setStatusAkhir] = useState("lengkap");
  const [ulasanAkhir, setUlasanAkhir] = useState("");

  const senaraiDokumenSokongan = [
    "Surat Permohonan Pendaftaran Rasmi",
    "Pelan Lantai Bangunan (Telah Disahkan)",
    "Sijil Perakuan Siap & Pematuhan CCC",
    "Salinan Perjanjian Sewaan / Sijil Hak Milik",
    "Pendaftaran ROC / ROB (Syarikat) / ROS (Persatuan)",
    "Silibus Kurikulum Pembelajaran / Jadual Waktu",
    "Sijil Kelayakan Akademik Guru & Personel"
  ];

  // Fetch real institutions from Firestore
  useEffect(() => {
    async function fetchInstitutions() {
      try {
        const list = await getInstitusiList();
        // Fallback static list if collection is empty
        if (list.length === 0) {
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
        console.error("Error loading institutions", err);
        // Ensure graceful fallback UI is completely populated
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

  // Preselection logic when instId query is provided
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

  const handleInstChange = (id: string) => {
    setSelectedInstId(id);
    const match = institutions.find((inst) => inst.id === id) || null;
    setSelectedInst(match);
  };

  const handleDokumenToggle = (item: string) => {
    if (dokumenDiterima.includes(item)) {
      setDokumenDiterima(dokumenDiterima.filter((doc) => doc !== item));
    } else {
      setDokumenDiterima([...dokumenDiterima, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId || !selectedInst) {
      toast.error("Sila pilih institusi rujukan terlebih dahulu!");
      return;
    }

    setLoading(true);

    try {
      // Determine jenisDokumen based on PBT, Bomba and KKM status
      const hasAllClear = pbtStatus === "Ada Kelulusan" && bombaStatus === "Ada Kelulusan" && kesihatanStatus === "Ada Kelulusan";
      const jenisDokumenStr = hasAllClear 
        ? "Kelulusan Bersepadu (PBT, Bomba, KKM)" 
        : `Surat Perakuan Pematuhan Bersyarat (${[
            pbtStatus !== "Ada Kelulusan" ? "PBT" : "",
            bombaStatus !== "Ada Kelulusan" ? "Bomba" : "",
            kesihatanStatus !== "Ada Kelulusan" ? "KKM" : ""
          ].filter(Boolean).join(", ")})`;

      const recordToSave = {
        institusiId: selectedInstId,
        namaInstitusi: selectedInst.namaInstitusi,
        kategori: selectedInst.kategori,
        zon: selectedInst.zon || "Bandar Gua Musang",
        jenisDokumen: jenisDokumenStr,
        statusDokumen: statusAkhir as any, // "lengkap" | "tidak lengkap" | "hampir luput"
        tarikhTamat: pbtTarikhLuput || bombaTarikhLuput || kesihatanTarikhLuput || "",
        tindakanSegera: statusAkhir === "tidak lengkap" || jenisIsu !== "tiada",
        pegawai: namaPegawai || "Encik Ahmad Sukri Bin Ramli",
        createdBy: auth.currentUser?.email || "En. Ahmad Sukri (Pegawai SPS)",
        
        // Save detailed fields for historical audit as requested
        pbtStatus,
        pbtNoRujukan,
        pbtTarikhMohon,
        pbtTarikhLulus,
        pbtTarikhLuput,
        pbtCatatan,
        bombaStatus,
        bombaNoRujukan,
        bombaTarikhLawatan,
        bombaTarikhLulus,
        bombaTarikhLuput,
        bombaCatatan,
        kesihatanStatus,
        kesihatanNoRujukan,
        kesihatanTarikhPeriksa,
        kesihatanTarikhLulus,
        kesihatanTarikhLuput,
        kesihatanCatatan,
        dokumenDiterima,
        catatanDokumenBelumLengkap,
        linkDokumen,
        jenisIsu,
        tahapKeutamaan,
        tindakanPembetulan,
        tarikhAkhirTindakan,
        statusTindakan,
        jawatanPegawai,
        tarikhSemakan,
        keputusanSemakan,
        ulasanAkhir
      };

      await createPematuhanRecord(recordToSave);
      
      setLoading(false);
      setSuccess(true);
      toast.success("Borang semakan pematuhan rasmi institusi berjaya disimpan!");
    } catch (err: any) {
      setLoading(false);
      console.error("Gagal menyimpan borang pematuhan:", err);
      toast.error("Gagal menyimpan rekod pematuhan ke Firestore. Sila cuba lagi.");
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-center max-w-2xl mx-auto space-y-6 animate-fade-in" id="success-receipt-pematuhan">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-xs mx-auto animate-bounce">
          <FileCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs text-secondary-600 font-extrabold tracking-widest uppercase leading-none block">
            LAPORAN KEPUTUSAN PEMATUHAN RASMI
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
            Rekod Semakan Ditabulasikan
          </h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Data penilaian pematuhan menyeluruh untuk institusi <strong className="text-slate-800">{selectedInst?.namaInstitusi}</strong> telah disuratkan buat simpanan pangkalan data Unit Swasta PPD Gua Musang.
          </p>
        </div>

        {/* Detailed Output Summary Receipt for premium user feel */}
        <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-5 text-left text-xs space-y-3.5 font-mono my-4">
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">ID Rumusan Penilaian:</span>
            <span className="text-slate-800 font-bold">COMP-{Math.floor(100000 + Math.random() * 900000)}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">Institusi Dirujuk:</span>
            <span className="text-slate-800 font-bold max-w-[280px] text-right truncate">{selectedInst?.namaInstitusi}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">Tarikh Penilaian:</span>
            <span className="text-slate-800 font-bold">{tarikhSemakan}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">Status Kelulusan Agensi:</span>
            <span className="text-slate-700 font-bold flex flex-col items-end gap-1">
              <span>PBT: <strong className="text-slate-900">{pbtStatus}</strong></span>
              <span>Bomba: <strong className="text-slate-900">{bombaStatus}</strong></span>
              <span>KKM: <strong className="text-slate-900">{kesihatanStatus}</strong></span>
            </span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">Dokumen Dimuat-naik:</span>
            <span className="text-slate-800 font-semibold">{dokumenDiterima.length} daripada {senaraiDokumenSokongan.length} lengkap</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-200 pb-2.5">
            <span className="text-slate-400">Tahap Ketidakpatuhan:</span>
            <span className="text-slate-800 font-bold uppercase">{jenisIsu === "tiada" ? "Tiada Isu" : `${jenisIsu} (${tahapKeutamaan})`}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-400">Keputusan Penilaian:</span>
            <span className={`font-black px-2 py-0.5 rounded text-xs uppercase ${
              statusAkhir === "lengkap" ? "bg-emerald-100 text-emerald-800" :
              statusAkhir === "lulus bersyarat" ? "bg-amber-100 text-amber-800" :
              "bg-rose-100 text-rose-800"
            }`}>{statusAkhir}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => onBack(true)}
            className="px-6 py-2.5 text-sm font-black bg-primary-800 hover:bg-primary-900 text-white rounded-full transition-all duration-200 cursor-pointer shadow-xs border border-primary-900 uppercase tracking-wider"
          >
            Kembali ke Ringkasan
          </button>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2.5 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all duration-200 cursor-pointer uppercase tracking-wider"
          >
            Tambah Borang Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="borang-pematuhan-institusi-terikat">
      {/* Header and Back controller */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <button
          onClick={() => onBack(false)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 font-bold" />
          <span>Kembali ke Panel Status</span>
        </button>
        <span className="text-xs text-secondary-600 font-extrabold tracking-widest uppercase flex items-center gap-1.5 bg-secondary-50/50 px-3 py-1 rounded-full border border-secondary-100">
          <Zap className="w-3.5 h-3.5 text-secondary-500 animate-pulse" />
          SISTEM BERSEPADU PENILAIAN IPS
        </span>
      </div>

      <div className="text-center space-y-1.5 max-w-xl mx-auto py-2">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug tracking-tight">
          Borang Semakan Pematuhan Institusi
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Kriteria pematuhan syarat pengesahan Bomba, Kelulusan Majlis Daerah (PBT), serta Jabatan Kesihatan mengikut Akta Pendidikan 1996.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto" id="pematuhan-validation-form">
        
        {/* SECTION 1: Institusi Dirujuk - SEARCHABLE DROP-DOWN */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-800" />
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-primary-700 font-bold text-sm">
              1
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian A: Pemilihan Institusi Dirujuk
            </h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Pilih Institusi Swasta Berdaftar <span className="text-rose-600">*</span>
              </label>
              {loadingInst ? (
                <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
              ) : (
                <select
                  value={selectedInstId}
                  onChange={(e) => handleInstChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-950 text-xs md:text-sm rounded-xl px-3.5 py-3 font-bold focus:border-primary-500 focus:outline-hidden cursor-pointer shadow-xs"
                >
                  <option value="" disabled>-- Sila Pilih Institusi --</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.namaInstitusi} ({inst.noRujukan || "No. Permit Sedia Ada"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* AUTO-POPULATED DATA VIEW: READ-ONLY */}
            {selectedInst && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in text-xs transition-all">
                <div className="flex items-center gap-1.5 border-b border-slate-200/65 pb-2 text-primary-900 font-black tracking-wide uppercase text-xs">
                  <Info className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                  Maklumat Asas Institusi Berdaftar (Autofill dari pangkalan data)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400 font-bold block uppercase">KATEGORI IPS:</span>
                    <strong className="text-slate-800 font-extrabold capitalize">{selectedInst.kategori}</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400 font-bold block uppercase">ZON OPERASI:</span>
                    <strong className="text-slate-800 font-extrabold">{selectedInst.zon} (Mukim {selectedInst.mukim || "Galas"})</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400 font-bold block uppercase">KOD RUJUKAN PERMIT:</span>
                    <strong className="text-slate-800 font-mono font-bold">{selectedInst.noRujukan || "Belum Berdaftar Sempurna"}</strong>
                  </div>
                  <div className="space-y-0.5 sm:col-span-2">
                    <span className="text-xs text-slate-400 font-bold block uppercase">ALAMAT PREMIS BELAJAR:</span>
                    <strong className="text-slate-700 font-bold line-clamp-1">{selectedInst.alamat || "Tiada Maklumat Alamat Tambahan"}</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400 font-bold block uppercase">PENGELOLA / PENGUSAHA PERALATAN:</span>
                    <strong className="text-slate-800 font-bold leading-none">{selectedInst.pengelola || "Tiada Maklumat Pengelola"}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: Kelulusan Pihak Berkuasa Tempatan (PBT) */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-primary-700 font-bold text-sm">
              2
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian B: Piawaian Kelulusan PBT (Majlis Daerah)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Status Kelulusan Lesen Premis</label>
              <select
                value={pbtStatus}
                onChange={(e) => setPbtStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-bold focus:border-primary-500 cursor-pointer shadow-xs"
              >
                <option value="Ada Kelulusan">Ada Perakuan Kelulusan</option>
                <option value="Tiada Kelulusan">Tiada Kelulusan / Tidak Patuh</option>
                <option value="Sedang Diproses">Dalam Proses Permohonan Baru</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Nombor Rujukan PBT</label>
              <input
                type="text"
                placeholder="No Rujukan Permit PBT"
                value={pbtNoRujukan}
                onChange={(e) => setPbtNoRujukan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Permohonan</label>
              <input
                type="date"
                value={pbtTarikhMohon}
                onChange={(e) => setPbtTarikhMohon(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Kelulusan PBT</label>
              <input
                type="date"
                value={pbtTarikhLulus}
                onChange={(e) => setPbtTarikhLulus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Luput Kelulusan</label>
              <input
                type="date"
                value={pbtTarikhLuput}
                onChange={(e) => setPbtTarikhLuput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Ulasan / Catatan Penilaian PBT</label>
              <textarea
                rows={2}
                placeholder="cth. Kelulusan diberikan secara bersyarat pembersihan longkang disiapkan sebelum pemantauan seterusnya..."
                value={pbtCatatan}
                onChange={(e) => setPbtCatatan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold resize-none focus:border-primary-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: Kelulusan Jabatan Bomba */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-primary-700 font-bold text-sm">
              3
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian C: Sijil Keselamatan Kebakaran (Bomba)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Status Sijil Bomba</label>
              <select
                value={bombaStatus}
                onChange={(e) => setBombaStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-bold focus:border-primary-500 cursor-pointer shadow-xs"
              >
                <option value="Ada Kelulusan">Ada Sijil Perakuan Bomba</option>
                <option value="Tiada Kelulusan">Tiada Sijil / Gagal Pemeriksaan</option>
                <option value="Sedang Diproses">Sedang Menunggu Sesi Lawatan Bomba</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Nombor Rujukan Sijil / Fail</label>
              <input
                type="text"
                placeholder="No Rujukan Sijil Bomba"
                value={bombaNoRujukan}
                onChange={(e) => setBombaNoRujukan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Lawatan Pemeriksaan</label>
              <input
                type="date"
                value={bombaTarikhLawatan}
                onChange={(e) => setBombaTarikhLawatan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Kelulusan Sijil</label>
              <input
                type="date"
                value={bombaTarikhLulus}
                onChange={(e) => setBombaTarikhLulus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Luput Sijil</label>
              <input
                type="date"
                value={bombaTarikhLuput}
                onChange={(e) => setBombaTarikhLuput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Catatan Pemeriksaan Bomba</label>
              <textarea
                rows={2}
                placeholder="cth. Peralatan pemadam api (CO2 / Powder) diservis sepenuhnya dan berada di kedudukan betul..."
                value={bombaCatatan}
                onChange={(e) => setBombaCatatan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold resize-none focus:border-primary-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: Kelulusan Pejabat Kesihatan (JKN/KKM) */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-primary-700 font-bold text-sm">
              4
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian D: Perakuan Kesihatan & Kebersihan Premis
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Status Kelulusan Kesihatan</label>
              <select
                value={kesihatanStatus}
                onChange={(e) => setKesihatanStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 font-bold focus:border-primary-500 cursor-pointer shadow-xs"
              >
                <option value="Ada Kelulusan">Ada Perakuan Kebersihan KKM</option>
                <option value="Tiada Kelulusan">Tiada Kelulusan / Tidak Patuh</option>
                <option value="Sedang Diproses">Pemeriksaan Kesihatan Diaturkan</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Nombor Rujukan KKM</label>
              <input
                type="text"
                placeholder="No Rujukan Sijil Kesihatan"
                value={kesihatanNoRujukan}
                onChange={(e) => setKesihatanNoRujukan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Pemeriksaan Sanitasi</label>
              <input
                type="date"
                value={kesihatanTarikhPeriksa}
                onChange={(e) => setKesihatanTarikhPeriksa(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Kelulusan Kesihatan</label>
              <input
                type="date"
                value={kesihatanTarikhLulus}
                onChange={(e) => setKesihatanTarikhLulus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Luput Perakuan</label>
              <input
                type="date"
                value={kesihatanTarikhLuput}
                onChange={(e) => setKesihatanTarikhLuput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Ulasan Pegawai Kesihatan Daerah</label>
              <textarea
                rows={2}
                placeholder="cth. Kawasan pengurusan sisa pepejal dan salur kumbahan memenuhi standard sanitasi tinggi..."
                value={kesihatanCatatan}
                onChange={(e) => setKesihatanCatatan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold resize-none focus:border-primary-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: Dokumen Sokongan */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-primary-700 font-bold text-sm">
              5
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian E: Fail & Dokumen Sokongan Rasmi
            </h3>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Checklist Penerimaan Dokumen Sokongan</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {senaraiDokumenSokongan.map((doc) => {
                const isChecked = dokumenDiterima.includes(doc);
                return (
                  <button
                    type="button"
                    key={doc}
                    onClick={() => handleDokumenToggle(doc)}
                    className={`flex items-start gap-3 p-3.5 border rounded-xl text-left transition-all cursor-pointer ${
                      isChecked 
                        ? "bg-slate-50 border-primary-300 text-primary-950 font-bold" 
                        : "bg-white border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 shrink-0 ${
                      isChecked ? "bg-primary-800 text-white border-primary-900" : "bg-white border-slate-300"
                    }`}>
                      {isChecked && <Check className="w-3 h-3 font-bold" />}
                    </div>
                    <span className="text-[11px] leading-relaxed">{doc}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Catatan Dokumen yang Belum Lengkap</label>
                <textarea
                  rows={2}
                  placeholder="Nyatakan dengan spesifik jika ada dokumen pemaju atau surat kuasa penyewaan belum dikemukakan..."
                  value={catatanDokumenBelumLengkap}
                  onChange={(e) => setCatatanDokumenBelumLengkap(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold resize-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Link Folder Simpanan Awan (cth: Google Drive / Dropbox)</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={linkDokumen}
                    onChange={(e) => setLinkDokumen(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-10 pr-3.5 py-3 font-semibold focus:border-primary-500"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium">Link luaran rasmi yang mengandungi fail-fail mentah borang imbasan disahkan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: Ketidakpatuhan / Isu Tergantung */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-primary-700 font-bold text-sm">
              6
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian F: Isu Ketidakpatuhan & Tindakan Pembetulan
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Jenis Isu Utama</label>
              <select
                value={jenisIsu}
                onChange={(e) => setJenisIsu(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-950 text-xs rounded-xl px-3 py-2.5 font-bold cursor-pointer"
              >
                <option value="tiada">Kepatuhan Penuh (Sifar Isu)</option>
                <option value="permit_tamat">Kebenaran Temat Tempoh / Luput</option>
                <option value="premis_tidak_selamat">Premis Kurang Selamat / Tiada Sijil Bomba</option>
                <option value="staf_tidak_bertauliah">Kakitangan Gagal Kelayakan Sijil</option>
                <option value="silibus_tidak_sah">Silibus Kurikulum Alternatif Tidak Sah</option>
                <option value="isu_pelesenan">Ralat Lesen Majlis Daerah (PBT)</option>
                <option value="lain_lain">Lain-Lain Komplikasi Khas</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tahap Amaran Risiko</label>
              <select
                value={tahapKeutamaan}
                onChange={(e) => setTahapKeutamaan(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-950 text-xs rounded-xl px-3 py-2.5 font-bold cursor-pointer"
              >
                <option value="rendah">Rendah / Makluman Ringkas</option>
                <option value="sederhana">Sederhana / Beri Tempoh 30 Hari</option>
                <option value="tinggi">Tinggi / Notis Amaran Pertama</option>
                <option value="kritikal">Kritikal / Syor Penangguhan Aktiviti</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Akhir Penyelesaian</label>
              <input
                type="date"
                value={tarikhAkhirTindakan}
                onChange={(e) => setTarikhAkhirTindakan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Status Tindakan Pembetulan</label>
              <select
                value={statusTindakan}
                onChange={(e) => setStatusTindakan(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-950 text-xs rounded-xl px-3 py-2.5 font-bold cursor-pointer"
              >
                <option value="Belum Mula">Masih Belum Mula (Sifar Tindakan)</option>
                <option value="Sedang Diusahakan">Pindaan Sedang Berlangsung</option>
                <option value="Selesai Sempurna">Isu Telah Diselesaikan Sempurna</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2 md:col-span-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Butiran Tindakan Pembetulan Diarahkan</label>
              <textarea
                rows={2}
                placeholder="Nyatakan arahan bertulis yang dihantar kepada pengelola bagi membetulkan ketidakpatuhan di atas..."
                value={tindakanPembetulan}
                onChange={(e) => setTindakanPembetulan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-semibold resize-none focus:border-primary-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION 7: Pegawai Penyemak */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-primary-700 font-bold text-sm">
              7
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase">
              Bahagian G: Deklarasi Pegawai Penyelia Semakan
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Nama Pegawai Pemeriksa / Penilai <span className="text-rose-600">*</span></label>
              <input
                type="text"
                value={namaPegawai}
                onChange={(e) => setNamaPegawai(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-xs rounded-xl px-3 py-2.5 font-bold focus:border-primary-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Jawatan Pegawai <span className="text-rose-600">*</span></label>
              <input
                type="text"
                value={jawatanPegawai}
                onChange={(e) => setJawatanPegawai(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-xl px-3 py-2.5 font-semibold focus:border-primary-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Tarikh Semakan Fizikal <span className="text-rose-600">*</span></label>
              <input
                type="date"
                value={tarikhSemakan}
                onChange={(e) => setTarikhSemakan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-xs rounded-xl px-3 py-2 font-bold focus:border-primary-500"
                required
              />
            </div>
          </div>
        </section>

        {/* SECTION 8: Keputusan Akhir Sesi Pemeriksaan */}
        <section className="bg-white rounded-2xl border border-amber-300 p-6 shadow-md shadow-primary-900/5 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full flex items-center justify-center text-amber-600 font-black text-4xl select-none pointer-events-none pr-3 pb-3">
            🎯
          </div>
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 font-black text-sm">
              8
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-wider uppercase flex items-center gap-1.5">
              Bahagian H: Ketetapan & Keputusan Akhir PPD
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Ketetapan Status Pematuhan Akhir <span className="text-rose-600">*</span></label>
              <div className="space-y-2.5">
                {[
                  { id: "lengkap", label: "Lengkap & Patuh", desc: "Memenuhi semua 3 kelulusan agensi teknikal serta dokumen sokongan bertulis.", color: "border-emerald-500 focus:ring-emerald-100" },
                  { id: "tidak lengkap", label: "Tidak Lengkap / Syarat Gagal", desc: "Mempunyai dokumen luput atau agensi teknikal belum memberi persetujuan.", color: "border-rose-500 focus:ring-rose-100" },
                  { id: "dalam tindakan", label: "Dalam Tindakan Pihak PPD / KPM", desc: "Urusan susbjek kelulusan khas atau pemantauan berulang sedang diurus.", color: "border-blue-500 focus:ring-blue-100" },
                  { id: "lulus bersyarat", label: "Lulus Bersyarat", desc: "Dibenarkan beroperasi dengan akujanji bertulis memperbaiki isu segera.", color: "border-amber-500 focus:ring-amber-100" }
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setStatusAkhir(opt.id)}
                    className={`w-full flex items-start gap-3 p-3 border rounded-xl text-left transition-all ${
                      statusAkhir === opt.id 
                        ? "bg-slate-950 border-slate-950 text-white shadow-xs" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                      statusAkhir === opt.id ? "bg-white border-white text-slate-900" : "bg-white border-slate-400"
                    }`}>
                      {statusAkhir === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-black block">{opt.label}</span>
                      <p className={`text-xs leading-relaxed ${statusAkhir === opt.id ? "text-slate-300" : "text-slate-400"}`}>{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Ulasan / Perakuan Ringkasan Keputusan Akhir <span className="text-rose-600">*</span></label>
              <textarea
                rows={11}
                placeholder="Nyatakan dengan muktamad hasil penemuan dan ulasan rasmi berserta tarikh lawatan lanjutan atau syor penambahbaikan penting..."
                value={ulasanAkhir}
                onChange={(e) => setUlasanAkhir(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-3 font-semibold focus:border-primary-500 focus:bg-white focus:outline-hidden"
                required
              />
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/50 flex gap-2 text-xs text-amber-900 leading-relaxed font-semibold mt-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <span>Pengesahan muktamad ini akan dihantar secara dalaman kepada Sektor Pengurusan Sekolah untuk tindakan / kelulusan sokongan permit tahunan.</span>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM FORM CTA ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200/80 pt-6">
          <button
            type="button"
            onClick={() => onBack(false)}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all duration-200 cursor-pointer text-center uppercase tracking-wider"
          >
            Batal Semakan
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 text-xs font-black bg-primary-800 hover:bg-primary-900 disabled:bg-primary-300 text-white rounded-full transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 uppercase tracking-widest border border-primary-900 shadow-sm"
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
                <span>Hantar Rekod Pematuhan</span>
                <FileCheck className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BorangPematuhan;
