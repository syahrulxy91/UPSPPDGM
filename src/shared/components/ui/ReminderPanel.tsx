import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  FileText, 
  Eye, 
  Flag,
  Sparkles,
  Inbox
} from "lucide-react";
import { ReminderItem } from "../../../features/laporan/services/reportService";

interface ReminderPanelProps {
  reminders: ReminderItem[];
  onOpenInstitusi?: (id: string) => void;
  onOpenBorangDetails?: (borangNoRujukan: string) => void;
}

export function ReminderPanel({ 
  reminders, 
  onOpenInstitusi,
  onOpenBorangDetails 
}: ReminderPanelProps) {
  // Store dismissed reminder IDs in localStorage to make dismiss action interactive and persistent
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [kategoriFilter, setKategoriFilter] = useState<string>("semua");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sps_dismissed_reminders");
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Gagal mendapatkan status semak peringatan:", e);
    }
  }, []);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem("sps_dismissed_reminders", JSON.stringify(updated));
  };

  const handleResetDismissed = () => {
    setDismissedIds([]);
    localStorage.removeItem("sps_dismissed_reminders");
  };

  // Filter out dismissed items
  const activeReminders = reminders.filter(r => !dismissedIds.includes(r.id));

  // Apply category filters
  const filteredActiveReminders = activeReminders.filter(r => {
    if (kategoriFilter === "semua") return true;
    return r.kategoriIsu === kategoriFilter;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4" id="reminder-panel-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">
              Tindakan Segera & Peringatan Pematuhan
            </h3>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
              {filteredActiveReminders.length} isu tindakan memerlukan semakan pegawai
            </p>
          </div>
        </div>
        
        {dismissedIds.length > 0 && (
          <button
            onClick={handleResetDismissed}
            className="text-[10px] font-black text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
          >
            Papar Semula ({dismissedIds.length}) Item Disemak
          </button>
        )}
      </div>

      {/* Category Pills inside Reminder list */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {[
          { key: "semua", label: "Semua Cabangan" },
          { key: "draf_terbengkalai", label: "Draf Terbengkalai (>7H)" },
          { key: "belum_proses", label: "Belum Diproses (>14H)" },
          { key: "belum_hantar_tahunan", label: "Belum Hantar Data Tahunan" },
          { key: "pencerobohan_aktif", label: "Pencerobohan Tidak Aktif" }
        ].map((p) => {
          const count = activeReminders.filter(r => p.key === "semua" || r.kategoriIsu === p.key).length;
          return (
            <button
              key={p.key}
              onClick={() => setKategoriFilter(p.key)}
              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all border shrink-0 ${
                kategoriFilter === p.key
                  ? "bg-primary-950 text-white border-primary-950 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
              }`}
            >
              {p.label} <span className="font-mono ml-0.5 opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Main Reminders Stream List */}
      {filteredActiveReminders.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50/55 border border-dashed border-slate-150 rounded-xl max-w-md mx-auto space-y-2">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">Urusan Sedia Bersih & Selesai!</h4>
            <p className="text-[11px] text-slate-450 font-bold leading-relaxed px-4 max-w-xs mt-1">
              Tiada lagi peringatan atau tunggakan pematuhan tertunggak dikesan bagi parameter sandaran sistem masa-nyata.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1 space-y-3">
          {filteredActiveReminders.map((rem) => {
            const isHigh = rem.keutamaan === "tinggi";
            return (
              <div 
                key={rem.id} 
                className={`pt-3.5 first:pt-0 pb-1.5 flex flex-col md:flex-row md:items-start justify-between gap-3 group first-of-type:pt-0`}
              >
                <div className="flex gap-3 items-start">
                  {/* Bullet Alert Circle with tone */}
                  <span className="relative flex h-2.5 w-2.5 mt-1 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isHigh ? "bg-rose-400" : "bg-amber-400"
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isHigh ? "bg-rose-600" : "bg-amber-500"
                    }`}></span>
                  </span>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-primary-850 transition-colors">
                        {rem.namaInstitusi}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                        isHigh 
                          ? "bg-rose-50 border-rose-150 text-rose-700 font-extrabold" 
                          : "bg-amber-50 border-amber-150 text-amber-700 font-extrabold"
                      }`}>
                        <Flag className="w-2.5 h-2.5" />
                        {isHigh ? "Keutamaan Tinggi" : "Sederhana"}
                      </span>
                      {rem.bilanganHari > 0 && (
                        <span className="text-[10px] font-mono font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                          {rem.bilanganHari} HARI TERTUNGGAK
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs font-bold text-slate-550 leading-relaxed max-w-2xl">
                      <span className="text-slate-800 font-extrabold block text-xs underline decoration-amber-500/40 decoration-2 pb-0.5">
                        {rem.isu} {rem.jenisBorang ? `— ${rem.jenisBorang}` : ""}
                      </span>
                      {rem.penerangan}
                    </p>
                  </div>
                </div>

                {/* Interactive Action Suite */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                  {/* View Institution profile modal */}
                  <button
                    onClick={() => onOpenInstitusi && onOpenInstitusi(rem.institusiId)}
                    title="Lihat Profil IPS"
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-black bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <Eye className="w-3 h-3 text-slate-400" />
                    Profil
                  </button>

                  {/* Open associated Borang Detail */}
                  {rem.borangId && (
                    <button
                      onClick={() => onOpenBorangDetails && onOpenBorangDetails(rem.namaInstitusi)}
                      title="Saring fail borang / data khusus"
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-black bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                    >
                      <FileText className="w-3 h-3 text-slate-400" />
                      Urus Borang
                    </button>
                  )}

                  {/* Dismiss / Mark Reviewed */}
                  <button
                    onClick={() => handleDismiss(rem.id)}
                    title="Tanda telah disemak oleh pegawai"
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    Selesai Semak
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReminderPanel;
