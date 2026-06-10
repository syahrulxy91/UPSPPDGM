import React, { useEffect } from "react";
import { InstitusiRecord } from "../../../types/institusi";
import { BORANG_METADATA_REGISTRY } from "../constants/borangMetadata";

export const BORANG_TYPES_MAP: Record<string, { label: string; kumpulan: string }> = {};
Object.entries(BORANG_METADATA_REGISTRY).forEach(([key, val]) => {
  BORANG_TYPES_MAP[key] = {
    label: val.label,
    kumpulan: val.kategori,
  };
});

interface BorangFormFieldsProps {
  jenisBorangCode: string;
  values: Record<string, any>;
  onChange: (fields: Record<string, any>) => void;
  institutions: InstitusiRecord[];
  selectedInstitutionId: string;
}

export const BorangFormFields: React.FC<BorangFormFieldsProps> = ({
  jenisBorangCode,
  values,
  onChange,
  institutions,
  selectedInstitutionId,
}) => {
  // Find current active institution info
  const currentInst = institutions.find((i) => i.id === (values.ipsId || selectedInstitutionId));

  // Sync state values when institution changes or on mount
  useEffect(() => {
    if (currentInst) {
      const updates: Record<string, any> = {};
      let needsUpdate = false;

      // Auto-fill values across forms that reference active institution state
      if (values.ipsId !== currentInst.id) {
        updates.ipsId = currentInst.id;
        needsUpdate = true;
      }

      if (jenisBorangCode === "BPS_VI" && values.alamat_lama !== currentInst.alamat) {
        updates.alamat_lama = currentInst.alamat;
        needsUpdate = true;
      }

      if (jenisBorangCode === "BPS_VII" && values.nama_lama !== currentInst.namaInstitusi) {
        updates.nama_lama = currentInst.namaInstitusi;
        needsUpdate = true;
      }

      if (jenisBorangCode === "BPS_XII" && currentInst.pengelola && values.nama_lama !== currentInst.pengelola) {
        updates.nama_lama = currentInst.pengelola;
        needsUpdate = true;
      }

      if (needsUpdate) {
        onChange({ ...values, ...updates });
      }
    }
  }, [currentInst, jenisBorangCode]);

  const updateField = (key: string, value: any) => {
    const updated = { ...values, [key]: value };

    // Auto-calculations logic:
    // 1. Kenaikan Yuran (BPS_IV) -> Auto peratus_kenaikan calculation
    if (jenisBorangCode === "BPS_IV") {
      if (key === "yuran_semasa" || key === "yuran_cadangan") {
        const semasa = parseFloat(key === "yuran_semasa" ? value : updated.yuran_semasa) || 0;
        const cadangan = parseFloat(key === "yuran_cadangan" ? value : updated.yuran_cadangan) || 0;
        if (semasa > 0) {
          updated.peratus_kenaikan = (((cadangan - semasa) / semasa) * 100).toFixed(1);
        } else {
          updated.peratus_kenaikan = "0.0";
        }
      }
    }

    // 2. Data Tahunan (BPS_DATA_01) -> Auto total murid count
    if (jenisBorangCode === "BPS_DATA_01") {
      if (key === "bil_murid_lelaki" || key === "bil_murid_perempuan") {
        const l = parseInt(key === "bil_murid_lelaki" ? value : updated.bil_murid_lelaki) || 0;
        const p = parseInt(key === "bil_murid_perempuan" ? value : updated.bil_murid_perempuan) || 0;
        updated.bil_murid_jumlah = l + p;
      }
    }

    // 3. Resit Pembayaran (BAYAR_01) -> Auto set amount based on fee type
    if (jenisBorangCode === "BAYAR_01" && key === "jenis_bayaran") {
      if (value.includes("Sekolah")) {
        updated.jumlah_bayaran = 300;
      } else if (value.includes("Pusat Bahasa") || value.includes("Pusat Tuisyen") || value.includes("RM150")) {
        updated.jumlah_bayaran = 150;
      } else if (value.includes("Pembaharuan")) {
        updated.jumlah_bayaran = 100;
      } else {
        updated.jumlah_bayaran = updated.jumlah_bayaran || "";
      }
    }

    onChange(updated);
  };

  const handleCheckboxGroup = (key: string, item: string, checked: boolean) => {
    const list: string[] = values[key] || [];
    let newList: string[];
    if (checked) {
      newList = [...list, item];
    } else {
      newList = list.filter((i) => i !== item);
    }
    updateField(key, newList);
  };

  const inputClass = "w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg px-3 py-2 focus:border-primary-500 focus:bg-white focus:outline-hidden transition-all";
  const labelClass = "text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1";

  // Filter institutions for International only where BPS II A / II B is active
  const filteredInsts = React.useMemo(() => {
    if (jenisBorangCode === "BPS_II_A" || jenisBorangCode === "BPS_II_B") {
      return institutions.filter(
        (i) => i.statusOperasi === "aktif" && i.kategori.toLowerCase().includes("antarabangsa")
      );
    }
    return institutions;
  }, [institutions, jenisBorangCode]);

  switch (jenisBorangCode) {
    case "BPS_I":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bps-1">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 1: BPS I - Permohonan Penubuhan IPS
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nama Cadangan IPS *</label>
              <input
                type="text"
                placeholder="cth: Tadika ABS Gua Musang"
                className={inputClass}
                value={values.nama_ips_cadangan || ""}
                onChange={(e) => updateField("nama_ips_cadangan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Kategori IPS Cadangan *</label>
              <select
                className={inputClass}
                value={values.jenis_ips || ""}
                onChange={(e) => updateField("jenis_ips", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                <option value="Tadika">Tadika Swasta</option>
                <option value="Sekolah Swasta">Sekolah Swasta</option>
                <option value="Pusat Tuisyen">Pusat Tuisyen</option>
                <option value="Sekolah Antarabangsa">Sekolah Antarabangsa</option>
                <option value="Pusat Bahasa">Pusat Bahasa</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nama Pengelola Utama *</label>
              <input
                type="text"
                placeholder="Nama Pengelola"
                className={inputClass}
                value={values.nama_pengelola || ""}
                onChange={(e) => updateField("nama_pengelola", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Kad Pengenalan Pengelola *</label>
              <input
                type="text"
                placeholder="cth: 750102-03-5123"
                className={inputClass}
                value={values.no_kp_pengelola || ""}
                onChange={(e) => updateField("no_kp_pengelola", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Nama Syarikat / Organisasi *</label>
              <input
                type="text"
                placeholder="cth: Intelek Sdn Bhd"
                className={inputClass}
                value={values.nama_syarikat || ""}
                onChange={(e) => updateField("nama_syarikat", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Pendaftaran Syarikat (SSM) *</label>
              <input
                type="text"
                placeholder="cth: 1234567-U"
                className={inputClass}
                value={values.no_ssm || ""}
                onChange={(e) => updateField("no_ssm", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <span className="text-[10px] font-black text-slate-400 block tracking-widest">LOKASI & PREMIS UTAMA</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelClass}>Alamat Premis Cadangan *</label>
                <input
                  type="text"
                  placeholder="Alamat penuh"
                  className={inputClass}
                  value={values.alamat_premis || ""}
                  onChange={(e) => updateField("alamat_premis", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>No. Lot Bangunan *</label>
                <input
                  type="text"
                  placeholder="cth: Lot 341, Aras 2"
                  className={inputClass}
                  value={values.no_lot || ""}
                  onChange={(e) => updateField("no_lot", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Mukim Kedudukan *</label>
                <input
                  type="text"
                  placeholder="cth: Mukim Galas"
                  className={inputClass}
                  value={values.mukim || ""}
                  onChange={(e) => updateField("mukim", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Daerah Pentadbiran (Auto-set)</label>
                <input type="text" className={inputClass} value="Gua Musang" disabled />
              </div>
              <div>
                <label className={labelClass}>Negeri (Auto-set)</label>
                <input type="text" className={inputClass} value="Kelantan" disabled />
              </div>
              <div>
                <label className={labelClass}>Luas Premis (Meter Persegi) *</label>
                <input
                  type="number"
                  placeholder="Luas premis"
                  className={inputClass}
                  value={values.luas_premis_meter_persegi || ""}
                  onChange={(e) => updateField("luas_premis_meter_persegi", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Bilangan Bilik Darjah *</label>
                <input
                  type="number"
                  placeholder="cth: 4"
                  className={inputClass}
                  value={values.bil_bilik_darjah || ""}
                  onChange={(e) => updateField("bil_bilik_darjah", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tarikh Mula Operasi Cadangan *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_mula_operasi_cadangan || ""}
                onChange={(e) => updateField("tarikh_mula_operasi_cadangan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Cadangan Guru Besar / Pengetua *</label>
              <input
                type="text"
                placeholder="Nama Guru Besar / Pengetua"
                className={inputClass}
                value={values.nama_guru_besar || ""}
                onChange={(e) => updateField("nama_guru_besar", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Kad Pengenalan Guru Besar *</label>
              <input
                type="text"
                placeholder="KP Guru Besar"
                className={inputClass}
                value={values.no_kp_guru_besar || ""}
                onChange={(e) => updateField("no_kp_guru_besar", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Kapasiti Murid Cadangan *</label>
              <input
                type="number"
                placeholder="Bilangan anggaran murid"
                className={inputClass}
                value={values.bil_murid_cadangan || ""}
                onChange={(e) => updateField("bil_murid_cadangan", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Jenis Kurikulum Digunakan *</label>
              <input
                type="text"
                placeholder="cth: KSPK (Kebangsaan) / Montessori / Cambridge"
                className={inputClass}
                value={values.jenis_kurikulum || ""}
                onChange={(e) => updateField("jenis_kurikulum", e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      );

    case "BORANG_A":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-borang-a">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 1: BORANG A - Permohonan Pendaftaran IPS
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Rujukan Institusi Terpilih *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih IPS Sedia Ada --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>No. Surat Kelulusan Penubuhan *</label>
              <input
                type="text"
                placeholder="KPMS.900-2/3/4"
                className={inputClass}
                value={values.no_kelulusan_penubuhan || ""}
                onChange={(e) => updateField("no_kelulusan_penubuhan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Kelulusan Penubuhan *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_kelulusan_penubuhan || ""}
                onChange={(e) => updateField("tarikh_kelulusan_penubuhan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Nama Guru Besar / Pengetua Aktif *</label>
              <input
                type="text"
                placeholder="Nama GB / Pengetua semasa"
                className={inputClass}
                value={values.nama_gb_pengetua || ""}
                onChange={(e) => updateField("nama_gb_pengetua", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Kad Pengenalan GB / Pengetua *</label>
              <input
                type="text"
                placeholder="No KP Guru Besar"
                className={inputClass}
                value={values.no_kp_gb || ""}
                onChange={(e) => updateField("no_kp_gb", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Mula Sah Lesen Mandat *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_mula_sah || ""}
                onChange={(e) => updateField("tarikh_mula_sah", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Struktur Yuran Setahun (RM) *</label>
              <input
                type="number"
                placeholder="cth: 2400"
                className={inputClass}
                value={values.yuran_tahunan || ""}
                onChange={(e) => updateField("yuran_tahunan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Bilangan Murid Semasa *</label>
              <input
                type="number"
                placeholder="cth: 80"
                className={inputClass}
                value={values.bil_murid_semasa || ""}
                onChange={(e) => updateField("bil_murid_semasa", e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Kemudahan Sedia Ada di Premis (Tandakan semua berkaitan)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {["Dewan Perhimpunan", "Tandas Lelaki/Perempuan", "Padang Permainan", "Perpustakaan Mini", "Bilik Komputer", "Makmal Sains", "Bilik Rehat Rawatan"].map(
                  (item) => {
                    const checked = (values.kemudahan_sedia_ada || []).includes(item);
                    return (
                      <label key={item} className="flex items-center gap-1.5 text-slate-800 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          checked={checked}
                          onChange={(e) => handleCheckboxGroup("kemudahan_sedia_ada", item, e.target.checked)}
                        />
                        <span>{item}</span>
                      </label>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case "BORANG_B_SEK03":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-borang-b">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 1: BORANG B SEK03 - Pendaftaran Pengelola/Pekerja IPS
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Hubungan Premis IPS *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih IPS --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nama Penuh Pekerja/Pengelola *</label>
              <input
                type="text"
                placeholder="Tulis nama penuh mengikut MyKad"
                className={inputClass}
                value={values.nama_pekerja || ""}
                onChange={(e) => updateField("nama_pekerja", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Kad Pengenalan *</label>
              <input
                type="text"
                placeholder="Format: YYMMDD-SS-XXXX"
                className={inputClass}
                value={values.no_kp || ""}
                onChange={(e) => updateField("no_kp", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Kategori Jawatan *</label>
              <select
                className={inputClass}
                value={values.jawatan || ""}
                onChange={(e) => updateField("jawatan", e.target.value)}
                required
              >
                <option value="">-- Pilih Jawatan --</option>
                <option value="Pengelola">Pengelola Utama</option>
                <option value="Guru Besar">Guru Besar</option>
                <option value="Pengetua">Pengetua</option>
                <option value="Guru">Guru / Pendidik</option>
                <option value="Pekerja Am">Pekerja Am / Kerani</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tarikh Mula Bertugas *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_mula_bertugas || ""}
                onChange={(e) => updateField("tarikh_mula_bertugas", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Kelayakan Akademik Tertinggi *</label>
              <input
                type="text"
                placeholder="SPM/Diploma/Ijazah Sarjana Muda/PhD"
                className={inputClass}
                value={values.kelayakan_akademik || ""}
                onChange={(e) => updateField("kelayakan_akademik", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>No. Fail Pendaftaran Guru KPM (Jika ada)</label>
              <input
                type="text"
                placeholder="cth: KPM.500-1/2/3/G/102-GM"
                className={inputClass}
                value={values.no_pendaftaran_guru || ""}
                onChange={(e) => updateField("no_pendaftaran_guru", e.target.value)}
              />
            </div>
          </div>
        </div>
      );

    case "BPS_II_A":
    case "BPS_II_B":
      const isLanjutan = jenisBorangCode === "BPS_II_B";
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bps2">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 2: {isLanjutan ? "BPS II B - Surat Sokongan Pas Pengajian (Lanjutan)" : "BPS II A - Surat Sokongan Pas Pengajian (Baharu)"}
          </h4>

          {filteredInsts.length === 0 && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded-lg font-bold">
              Tip Penting: Tiada IPS berstatus &ldquo;Aktif&rdquo; bertipe &ldquo;Sekolah Swasta/Antarabangsa&rdquo; dijumpai. Anda boleh memilih mana-mana institusi rujukan luar tetapi pastikan data disinkronisasikan kelak. Sebarang akaun masih dipaparkan untuk modifikasi ini.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Pilih IPS Rujukan Antarabangsa *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih IPS Aktif --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nama Penuh Pelajar (Murid) *</label>
              <input
                type="text"
                placeholder="Sila masukkan nama pasport"
                className={inputClass}
                value={values.nama_murid || ""}
                onChange={(e) => updateField("nama_murid", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Pasport Pelajar *</label>
              <input
                type="text"
                placeholder="cth: A98223910"
                className={inputClass}
                value={values.no_passport || ""}
                onChange={(e) => updateField("no_passport", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Warganegara Asal *</label>
              <input
                type="text"
                placeholder="cth: Singapura / China / Arab Saudi"
                className={inputClass}
                value={values.warganegara || ""}
                onChange={(e) => updateField("warganegara", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Lahir Pelajar *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_lahir || ""}
                onChange={(e) => updateField("tarikh_lahir", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Nama Penuh Ibu Bapa / Penjaga *</label>
              <input
                type="text"
                placeholder="Nama Bapa / Ibu"
                className={inputClass}
                value={values.nama_ibu_bapa || ""}
                onChange={(e) => updateField("nama_ibu_bapa", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Pasport Ibu Bapa / Penjaga *</label>
              <input
                type="text"
                placeholder="No Pasport Ibu Bapa"
                className={inputClass}
                value={values.no_passport_ibu_bapa || ""}
                onChange={(e) => updateField("no_passport_ibu_bapa", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tahap Pengajian *</label>
              <input
                type="text"
                placeholder="cth: Primary 1 / Secondary 3"
                className={inputClass}
                value={values.tahap_pengajian || ""}
                onChange={(e) => updateField("tahap_pengajian", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Mula Pengajian *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_mula_pengajian || ""}
                onChange={(e) => updateField("tarikh_mula_pengajian", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Tamat Jangkaan Pengajian *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_tamat_pengajian || ""}
                onChange={(e) => updateField("tarikh_tamat_pengajian", e.target.value)}
                required
              />
            </div>

            {isLanjutan && (
              <>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg sm:col-span-2 space-y-3">
                  <span className="text-[10px] font-black text-indigo-700 block tracking-wider">MAKLUMAT LANJUTAN</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>No. Pas Sedia Ada *</label>
                      <input
                        type="text"
                        placeholder="cth: PAS-8821-MY"
                        className={inputClass}
                        value={values.no_pas_sedia_ada || ""}
                        onChange={(e) => updateField("no_pas_sedia_ada", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tarikh Tamat Pas Lama *</label>
                      <input
                        type="date"
                        className={inputClass}
                        value={values.tarikh_tamat_pas_lama || ""}
                        onChange={(e) => updateField("tarikh_tamat_pas_lama", e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Alasan Terperinci Permohonan Lanjutan *</label>
                      <input
                        type="text"
                        placeholder="cth: Melanjutkan tempoh pengajian tahap Sijil Menengah Tinggi"
                        className={inputClass}
                        value={values.sebab_lanjutan || ""}
                        onChange={(e) => updateField("sebab_lanjutan", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );

    case "BPS_III":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bps3">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 2: BPS III - Permohonan Pas Pelajar (Baharu/Lanjutan)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>IPS Terlibat *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nama Penuh Murid *</label>
              <input
                type="text"
                placeholder="Murid antarabangsa"
                className={inputClass}
                value={values.nama_murid || ""}
                onChange={(e) => updateField("nama_murid", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Pasport *</label>
              <input
                type="text"
                placeholder="No Pasport"
                className={inputClass}
                value={values.no_passport || ""}
                onChange={(e) => updateField("no_passport", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Jenis Permohonan *</label>
              <select
                className={inputClass}
                value={values.jenis_permohonan || "Baharu"}
                onChange={(e) => updateField("jenis_permohonan", e.target.value)}
                required
              >
                <option value="Baharu">Baharu (Pendaftaran Pertama)</option>
                <option value="Lanjutan">Lanjutan (Penyambungan Pengajian)</option>
              </select>
            </div>

            {values.jenis_permohonan === "Lanjutan" && (
              <div>
                <label className={labelClass}>No. Pas Lama (Mandatori jika Lanjutan) *</label>
                <input
                  type="text"
                  placeholder="Kenyataan Pas Lama"
                  className={inputClass}
                  value={values.no_pas_lama || ""}
                  onChange={(e) => updateField("no_pas_lama", e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Tarikh Permohonan *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_mohon || ""}
                onChange={(e) => updateField("tarikh_mohon", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Senarai Dokumen Sokongan Disertakan (cth: Sijil Akademik, Surat Tawaran, Resit Yuran...)</label>
              <textarea
                rows={2}
                placeholder="Tulis senarai dokumen sokongan..."
                className={inputClass}
                value={values.dokumen_sokongan_senarai || ""}
                onChange={(e) => updateField("dokumen_sokongan_senarai", e.target.value)}
              />
            </div>
          </div>
        </div>
      );

    case "BPS_IV":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bps4">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 3: BPS IV - Permohonan Kenaikan Yuran
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>IPS Terlibat *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Yuran Semasa (RM/Setahun) *</label>
              <input
                type="number"
                placeholder="cth: 1500"
                className={inputClass}
                value={values.yuran_semasa || ""}
                onChange={(e) => updateField("yuran_semasa", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Yuran Cadangan Baharu (RM/Setahun) *</label>
              <input
                type="number"
                placeholder="cth: 1800"
                className={inputClass}
                value={values.yuran_cadangan || ""}
                onChange={(e) => updateField("yuran_cadangan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Peratusan Kenaikan (Auto-kira %)</label>
              <input
                type="text"
                className={`${inputClass} bg-amber-50 font-black text-amber-700`}
                value={values.peratus_kenaikan ? `${values.peratus_kenaikan}%` : "0.0%"}
                disabled
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Berkuat Kuasa Cadangan *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_kuat_kuasa_cadangan || ""}
                onChange={(e) => updateField("tarikh_kuat_kuasa_cadangan", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Sebab-sebab Utama Kenaikan *</label>
              <textarea
                rows={2}
                placeholder="cth: Menampung kos penyewaan premis baharu, menggaji guru penutur jati asing..."
                className={inputClass}
                value={values.sebab_kenaikan || ""}
                onChange={(e) => updateField("sebab_kenaikan", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Dokumen Sokongan Disertakan (cth: Laporan Kewangan Beraudit, Minit Mesyuarat)</label>
              <input
                type="text"
                placeholder="cth: Kertas Kewangan Laporan 2025.pdf"
                className={inputClass}
                value={values.dokumen_sokongan || ""}
                onChange={(e) => updateField("dokumen_sokongan", e.target.value)}
              />
            </div>
          </div>
        </div>
      );

    case "BPS_V":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bps5">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 3: BPS V - Permohonan Tambah Struktur Kursus
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>IPS Terlibat *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Kursus Sedia Ada (Status Semasa) *</label>
              <input
                type="text"
                placeholder="cth: Bahasa Inggeris Komunikasi"
                className={inputClass}
                value={values.senarai_kursus_sedia_ada || ""}
                onChange={(e) => updateField("senarai_kursus_sedia_ada", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Kursus Baharu Dicadangkan *</label>
              <input
                type="text"
                placeholder="cth: Pengaturcaraan Python Kanak-kanak"
                className={inputClass}
                value={values.kursus_baharu_dicadangkan || ""}
                onChange={(e) => updateField("kursus_baharu_dicadangkan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Peringkat Pendidikan / Sasaran *</label>
              <input
                type="text"
                placeholder="cth: Sijil Menengah Rendah / Kanak-kanak"
                className={inputClass}
                value={values.peringkat_pendidikan || ""}
                onChange={(e) => updateField("peringkat_pendidikan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tempoh Kursus (cth: 6 Bulan) *</label>
              <input
                type="text"
                placeholder="cth: 3 bulan / 36 jam"
                className={inputClass}
                value={values.tempoh_kursus || ""}
                onChange={(e) => updateField("tempoh_kursus", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Kelayakan Kemasukan Peserta *</label>
              <input
                type="text"
                placeholder="cth: Boleh membaca dan menulis / PMR"
                className={inputClass}
                value={values.kelayakan_kemasukan || ""}
                onChange={(e) => updateField("kelayakan_kemasukan", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Nama Guru Bertanggungjawab Memimpin *</label>
              <input
                type="text"
                placeholder="Nama Tenaga Pengajar Utama"
                className={inputClass}
                value={values.nama_guru_bertanggungjawab || ""}
                onChange={(e) => updateField("nama_guru_bertanggungjawab", e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      );

    case "BPS_VI":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bps6">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 3: BPS VI - Permohonan Pengubahsuaian / Penambahan / Pemindahan Premis
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>IPS Terlibat *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Jenis Permohonan *</label>
              <select
                className={inputClass}
                value={values.jenis_permohonan || "Pengubahsuaian"}
                onChange={(e) => updateField("jenis_permohonan", e.target.value)}
                required
              >
                <option value="Pengubahsuaian">Pengubahsuaian Bangunan Sedia Ada</option>
                <option value="Penambahan">Penambahan Aras / Bilik</option>
                <option value="Pemindahan">Pemindahan Cawangan Alamat Baharu</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Alamat Semasa (Auto-isi dari data Firestore)</label>
              <input
                type="text"
                className={`${inputClass} bg-slate-100`}
                value={values.alamat_lama || currentInst?.alamat || "Sila pilih institusi rujukan"}
                disabled
              />
            </div>

            {values.jenis_permohonan === "Pemindahan" && (
              <div className="sm:col-span-2">
                <label className={labelClass}>Alamat Premis Baharu Cadangan *</label>
                <input
                  type="text"
                  placeholder="Sila masukkan alamat premis baharu bertulis"
                  className={inputClass}
                  value={values.alamat_baharu || ""}
                  onChange={(e) => updateField("alamat_baharu", e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Dokumen Pelan Rekabentuk (Status Mock Upload)</label>
              <input
                type="text"
                placeholder="cth: Pelan_Struktur_2026.dwg / .pdf"
                className={inputClass}
                value={values.pelan_premis_baharu || ""}
                onChange={(e) => updateField("pelan_premis_baharu", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Dijangka Siap Kerja *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_dijangka_siap || ""}
                onChange={(e) => updateField("tarikh_dijangka_siap", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Sebab-sebab Tindakan Permohonan Premis *</label>
              <textarea
                rows={2}
                placeholder="Masukkan sebab pemindahan atau ubahsuai struktur premis secara komprehensif..."
                className={inputClass}
                value={values.sebab_permohonan || ""}
                onChange={(e) => updateField("sebab_permohonan", e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      );

    case "BPS_VII":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bps7">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 3: BPS VII - Permohonan Pertukaran Nama Sekolah
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>IPS Terlibat *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nama Lama IPS Semasa (Auto-isi)</label>
              <input
                type="text"
                className={`${inputClass} bg-slate-100`}
                value={values.nama_lama || currentInst?.namaInstitusi || "Pilih institusi rujukan"}
                disabled
              />
            </div>
            <div>
              <label className={labelClass}>Cadangan Nama Baharu Yang Membina *</label>
              <input
                type="text"
                placeholder="cth: Sekolah Rendah Al-Azhar (Cawangan Gua Musang)"
                className={inputClass}
                value={values.nama_baharu_dicadangkan || ""}
                onChange={(e) => updateField("nama_baharu_dicadangkan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Berkuat Kuasa Cadangan *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_berkuat_kuasa_cadangan || ""}
                onChange={(e) => updateField("tarikh_berkuat_kuasa_cadangan", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Sebab-sebab Pertukaran Nama Utama *</label>
              <textarea
                rows={2}
                placeholder="cth: Penyertaan di bawah syarikat pemilikan baharu untuk menjenamakan semula kualiti sekolah..."
                className={inputClass}
                value={values.sebab_pertukaran || ""}
                onChange={(e) => updateField("sebab_pertukaran", e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      );

    case "BPS_VIII":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bps8">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 3: BPS VIII - Permohonan Menjual / Melupus / Membangun Semula IPS
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>IPS Terlibat *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Jenis Permohonan Pemilikan Premis *</label>
              <select
                className={inputClass}
                value={values.jenis_permohonan || "Jual"}
                onChange={(e) => updateField("jenis_permohonan", e.target.value)}
                required
              >
                <option value="Jual">Menjual Kepada Pemilik / Syarikat Baharu</option>
                <option value="Lupus">Melupuskan Operasi (Tutup Sepenuhnya)</option>
                <option value="Membangun Semula">Membangun Semula Struktur Prasarana</option>
              </select>
            </div>

            {values.jenis_permohonan === "Jual" && (
              <>
                <div>
                  <label className={labelClass}>Nama Pembeli / Pemilik Baharu *</label>
                  <input
                    type="text"
                    placeholder="Nama bapa pembeli atau Kumpulan Utama"
                    className={inputClass}
                    value={values.nama_pembeli_baharu || ""}
                    onChange={(e) => updateField("nama_pembeli_baharu", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>No. Pendaftaran Organisasi Pembeli (SSM) *</label>
                  <input
                    type="text"
                    placeholder="Syarikat Pembeli SSM cth: 99812-H"
                    className={inputClass}
                    value={values.no_ssm_pembeli || ""}
                    onChange={(e) => updateField("no_ssm_pembeli", e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Sebab-sebab Permohonan Jual / Tamat *</label>
              <input
                type="text"
                placeholder="cth: Kekurangan dana pusingan / Masalah kesihatan pengasas"
                className={inputClass}
                value={values.sebab_permohonan || ""}
                onChange={(e) => updateField("sebab_permohonan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Tukar Milik / Tamat Operasi *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_jual_atau_tamat_operasi || ""}
                onChange={(e) => updateField("tarikh_jual_atau_tamat_operasi", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Nasib Pelajar & Pendidik Sedia Ada (Penerangan kebajikan) *</label>
              <textarea
                rows={2}
                placeholder="Sila nyatakan kaedah pemindahan baki murid aktif ke institusi lain bagi menjamin baki pengajian mereka..."
                className={inputClass}
                value={values.nasib_murid_sedia_ada || ""}
                onChange={(e) => updateField("nasib_murid_sedia_ada", e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      );

    case "BPS_XII":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bps12">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 3: BPS XII - Permohonan Pertukaran Guru Besar / Pengetua / ALP
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>IPS Terlibat *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Jawatan Utama Terlibat *</label>
              <select
                className={inputClass}
                value={values.jawatan_terlibat || "GB"}
                onChange={(e) => updateField("jawatan_terlibat", e.target.value)}
                required
              >
                <option value="GB">Guru Besar / Guru Penyelia</option>
                <option value="Pengetua">Pengetua Swasta</option>
                <option value="ALP">Ahli Lembaga Pengelola (ALP)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nama Pegawai Terdahulu (Lama) *</label>
              <input
                type="text"
                placeholder="Nama pegawai asal"
                className={inputClass}
                value={values.nama_lama || currentInst?.pengelola || ""}
                onChange={(e) => updateField("nama_lama", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Kad Pengenalan Pegawai Lama *</label>
              <input
                type="text"
                placeholder="No KP Pegawai Lama"
                className={inputClass}
                value={values.no_kp_lama || ""}
                onChange={(e) => updateField("no_kp_lama", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Sebab-sebab Utama Pertukaran *</label>
              <select
                className={inputClass}
                value={values.sebab_pertukaran || "Bersara"}
                onChange={(e) => updateField("sebab_pertukaran", e.target.value)}
                required
              >
                <option value="Bersara">Bersara Wajib / Berumur</option>
                <option value="Letak Jawatan">Meletakkan Jawatan Sukarela</option>
                <option value="Pemberhentian">Penamatan Kontrak Tugasan</option>
                <option value="Lain-lain">Lain-Lain Urusan Kebajikan</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nama Pegawai Baharu Pengganti *</label>
              <input
                type="text"
                placeholder="Tulis nama pengganti penuh"
                className={inputClass}
                value={values.nama_baharu || ""}
                onChange={(e) => updateField("nama_baharu", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Kad Pengenalan Pengganti *</label>
              <input
                type="text"
                placeholder="No KP Pegawai Baharu"
                className={inputClass}
                value={values.no_kp_baharu || ""}
                onChange={(e) => updateField("no_kp_baharu", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Mulat Berkuat Kuasa Jawatan *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_berkuat_kuasa || ""}
                onChange={(e) => updateField("tarikh_berkuat_kuasa", e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      );

    case "BPS_XIII":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bps13">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 3: BPS XIII - Permohonan Tabung Pembinaan IPS
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>IPS Terlibat *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status Permohonan Tabung *</label>
              <select
                className={inputClass}
                value={values.jenis_tabung || "Baharu"}
                onChange={(e) => updateField("jenis_tabung", e.target.value)}
                required
              >
                <option value="Baharu">Dana Pembangunan Baharu</option>
                <option value="Penambahan">Dana Tambahan Memperbesarkan Premis</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Jumlah Peruntukan Dipohon (RM) *</label>
              <input
                type="number"
                placeholder="cth: 50000"
                className={inputClass}
                value={values.jumlah_dipohon || ""}
                onChange={(e) => updateField("jumlah_dipohon", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tujuan Pembinaan Spesifik *</label>
              <input
                type="text"
                placeholder="cth: Membina 2 blok bilik darjah tambahan"
                className={inputClass}
                value={values.tujuan_pembinaan || ""}
                onChange={(e) => updateField("tujuan_pembinaan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Pelan Tapak diluluskan (Tajuk Fail)</label>
              <input
                type="text"
                placeholder="cth: Pelan_Tapak_2026.pdf"
                className={inputClass}
                value={values.pelan_tapa || ""} // mapping name error protection
                onChange={(e) => updateField("pelan_tapa", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Laporan Sijil Anggaran Kos (Tajuk Fail)</label>
              <input
                type="text"
                placeholder="cth: Sijil_QS_Kos.pdf"
                className={inputClass}
                value={values.anggaran_kos || ""}
                onChange={(e) => updateField("anggaran_kos", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Syarikat Kontraktor Projek Utama *</label>
              <input
                type="text"
                placeholder="cth: Bina Jaya Enterprise"
                className={inputClass}
                value={values.nama_kontraktor || ""}
                onChange={(e) => updateField("nama_kontraktor", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tempoh Siap Projek Pembinaan *</label>
              <input
                type="text"
                placeholder="cth: 8 Bulan"
                className={inputClass}
                value={values.tempoh_siap_projek || ""}
                onChange={(e) => updateField("tempoh_siap_projek", e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      );

    case "BPS_DATA_01":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bpsdata">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 4: BPS DATA 01 - Borang Data Tahunan IPS (Pindaan 2016)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Pilih IPS Rujukan *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tahun Kutipan Data *</label>
              <input
                type="text"
                className={inputClass}
                value={values.tahun_data || "2026"}
                onChange={(e) => updateField("tahun_data", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <span className="text-[10px] font-black text-slate-405 block tracking-widest">TABULASI STATISTIK GURU & GAMPIL</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Kehadiran Murid Lelaki *</label>
                <input
                  type="number"
                  placeholder="cth: 40"
                  className={inputClass}
                  value={values.bil_murid_lelaki || ""}
                  onChange={(e) => {
                    updateField("bil_murid_lelaki", e.target.value);
                  }}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Kehadiran Murid Perempuan *</label>
                <input
                  type="number"
                  placeholder="cth: 45"
                  className={inputClass}
                  value={values.bil_murid_perempuan || ""}
                  onChange={(e) => {
                    updateField("bil_murid_perempuan", e.target.value);
                  }}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Jumlah Anggota Murid (Auto-Kira)</label>
                <input
                  type="text"
                  className={`${inputClass} bg-green-50 font-black text-green-700`}
                  value={values.bil_murid_jumlah || "0"}
                  disabled
                />
              </div>
              <div>
                <label className={labelClass}>Guru Berkelayakan Ikhtisas *</label>
                <input
                  type="number"
                  className={inputClass}
                  value={values.bil_guru_berkelayakan || ""}
                  onChange={(e) => updateField("bil_guru_berkelayakan", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Guru Tanpa Kelayakan Ikhtisas *</label>
                <input
                  type="number"
                  className={inputClass}
                  value={values.bil_guru_tidak_berkelayakan || ""}
                  onChange={(e) => updateField("bil_guru_tidak_berkelayakan", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Kakikitangan Sokongan / Am *</label>
                <input
                  type="number"
                  className={inputClass}
                  value={values.bil_kakitangan_am || ""}
                  onChange={(e) => updateField("bil_kakitangan_am", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Struktur Yuran Semasa Setahun (RM) *</label>
              <input
                type="number"
                className={inputClass}
                value={values.yuran_semasa || ""}
                onChange={(e) => updateField("yuran_semasa", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Pendapatan Setahun Anggaran (RM) *</label>
              <input
                type="number"
                placeholder="Anggaran pendapatan"
                className={inputClass}
                value={values.pendapatan_tahunan_anggaran || ""}
                onChange={(e) => updateField("pendapatan_tahunan_anggaran", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Status Pemilikan Premis Bangunan *</label>
              <select
                className={inputClass}
                value={values.status_bangunan || ""}
                onChange={(e) => updateField("status_bangunan", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                <option value="Sewa">Disewa Melalui Kontrak Luar</option>
                <option value="Milik Sendiri">Bangunan Kuasa Milik Sendiri</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Luas Tanah IPS (Meter Persegi) *</label>
              <input
                type="text"
                placeholder="cth: 15,000 m2"
                className={inputClass}
                value={values.luas_tanah || ""}
                onChange={(e) => updateField("luas_tanah", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Cabaran Utama Pengendalian IPS Gua Musang *</label>
              <textarea
                rows={2}
                placeholder="cth: Cabaran utama ialah pengekalan guru bertauliah dan kos utiliti yang membebankan..."
                className={inputClass}
                value={values.cabaran_utama || ""}
                onChange={(e) => updateField("cabaran_utama", e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      );

    case "BORANG_PENYELIDIKAN":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-penyelidikan">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 4: BORANG PENYELIDIKAN - Permohonan Menjalankan Penyelidikan di IPS
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>IPS Terlibat Kajian (Rujukan) *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nama Penuh Penyelidik *</label>
              <input
                type="text"
                placeholder="cth: Dr. Khairul Azhar"
                className={inputClass}
                value={values.nama_penyelidik || ""}
                onChange={(e) => updateField("nama_penyelidik", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Kad Pengenalan Penyelidik *</label>
              <input
                type="text"
                placeholder="No KP Penyelidik"
                className={inputClass}
                value={values.no_kp_penyelidik || ""}
                onChange={(e) => updateField("no_kp_penyelidik", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Siti / Institusi Penyelidik Bernaung *</label>
              <input
                type="text"
                placeholder="cth: Universiti Malaya (UM)"
                className={inputClass}
                value={values.institusi_penyelidik || ""}
                onChange={(e) => updateField("institusi_penyelidik", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Tajuk Penyelidikan Komprehensif *</label>
              <input
                type="text"
                placeholder="cth: Analisis Keberkesanan Kurikulum Montessori Terhadap Anak Kelantan"
                className={inputClass}
                value={values.tajuk_penyelidikan || ""}
                onChange={(e) => updateField("tajuk_penyelidikan", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Mula Penyelidikan *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tempoh_penyelidikan_mula || ""}
                onChange={(e) => updateField("tempoh_penyelidikan_mula", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Tamat Penyelidikan *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tempoh_penyelidikan_tamat || ""}
                onChange={(e) => updateField("tempoh_penyelidikan_tamat", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Kaedah Penyelidikan Utama *</label>
              <select
                className={inputClass}
                value={values.kaedah_penyelidikan || ""}
                onChange={(e) => updateField("kaedah_penyelidikan", e.target.value)}
                required
              >
                <option value="">-- Pilih Kaedah --</option>
                <option value="Kualitatif">Kualitatif (Temubual & Pemerhatian)</option>
                <option value="Kuantitatif">Kuantitatif (Soal Selidik & Data)</option>
                <option value="Campuran">Campuran (Kualitatif & Kuantitatif)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nama Surat Sokongan KPM (Upload Status)</label>
              <input
                type="text"
                placeholder="cth: Surat_Sokongan_BPS_KPM.pdf"
                className={inputClass}
                value={values.surat_sokongan || ""}
                onChange={(e) => updateField("surat_sokongan", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Format dan Tujuan Sebenar Penyelidikan *</label>
              <textarea
                rows={2}
                placeholder="Nyatakan dengan terperinci matlamat penyelidikan ini dijalankan..."
                className={inputClass}
                value={values.tujuan_penyelidikan || ""}
                onChange={(e) => updateField("tujuan_penyelidikan", e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      );

    case "BAYAR_01":
      return (
        <div className="space-y-3.5 border-t border-slate-100 pt-3.5" id="form-bayar">
          <h4 className="text-xs font-black text-primary-950 uppercase tracking-wider bg-slate-100/60 p-2 rounded">
            Dokumen Kumpulan 5: BAYAR 01 - Permohonan Resit Pembayaran
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Sumber IPS Pembayar *</label>
              <select
                className={inputClass}
                value={values.ipsId || ""}
                onChange={(e) => updateField("ipsId", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.namaInstitusi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Jenis Bayaran Rasmi *</label>
              <select
                className={inputClass}
                value={values.jenis_bayaran || ""}
                onChange={(e) => updateField("jenis_bayaran", e.target.value)}
                required
              >
                <option value="">-- Pilih --</option>
                <option value="Pendaftaran RM300 Sekolah">Permohonan Pendaftaran Sekolah (RM300)</option>
                <option value="Pendaftaran RM150 Pusat Bahasa & Tuisyen">Permohonan Pendaftaran Pusat Bahasa/Tuisyen (RM150)</option>
                <option value="Pembaharuan Lesen Premis">Pembaharuan Sijil Lesen Premis (RM100)</option>
                <option value="Lain-lain">Lain-lain Urusan Kewangan</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Jumlah Bayaran Ditetapkan (RM)</label>
              <input
                type="number"
                placeholder="Harga Bayaran"
                className={`${inputClass} bg-green-50 font-black text-green-700`}
                value={values.jumlah_bayaran || ""}
                onChange={(e) => updateField("jumlah_bayaran", Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tarikh Transaksi Bayaran *</label>
              <input
                type="date"
                className={inputClass}
                value={values.tarikh_bayaran || ""}
                onChange={(e) => updateField("tarikh_bayaran", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>No. Rujukan Resit / Kod Transaksi *</label>
              <input
                type="text"
                placeholder="cth: RESIT-KPM-9123-GM"
                className={inputClass}
                value={values.no_resit || ""}
                onChange={(e) => updateField("no_resit", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Kaedah Bayaran Utama *</label>
              <select
                className={inputClass}
                value={values.kaedah_bayaran || "Online"}
                onChange={(e) => updateField("kaedah_bayaran", e.target.value)}
                required
              >
                <option value="Online">Online Banking Transfer / EFT</option>
                <option value="Tunai">Tunai Bersemuka di Pejabat</option>
                <option value="Cek">Cek Bank Penyerahan</option>
              </select>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-3 text-xs text-slate-500 text-center font-semibold italic border border-dashed border-slate-300 rounded bg-slate-50/50">
          Urusan borang ini menggunakan catatan penerangan deskripsi biasa. Isikan maklumat tambahan dalam bahagian nota lampiran bawah.
        </div>
      );
  }
};
