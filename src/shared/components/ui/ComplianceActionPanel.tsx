import React, { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  FileText, 
  Flag, 
  Inbox, 
  RefreshCw, 
  Clock, 
  ChevronRight, 
  ShieldAlert,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { useComplianceActionQueue, ActionItem } from "../../../features/pematuhan/hooks/useComplianceActionQueue";
import { toast } from "react-hot-toast";

interface ComplianceActionPanelProps {
  onOpenInstitusi?: (id: string) => void;
  onOpenBorangDetails?: (borangNoRujukan: string) => void;
  onOpenTindakanPortal?: () => void;
}

export function ComplianceActionPanel({
  onOpenInstitusi,
  onOpenBorangDetails,
  onOpenTindakanPortal,
}: ComplianceActionPanelProps) {
  // UI UX Pro Max Methodology is active - managing layout, contrast, scannability & status filters
  const { actionQueue, loading, error } = useComplianceActionQueue();
  const [activeCategory, setActiveCategory] = useState<string>("semua");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Apply quick category filters
  const filteredActions = actionQueue.filter((action) => {
    // Exclude locally dismissed notifications for interactive feedback
    if (dismissedIds.includes(action.id)) return false;

    if (activeCategory === "semua") return true;
    if (activeCategory === "pematuhan" && action.sourceType === "pematuhan") return true;
    if (activeCategory === "tindakan" && action.sourceType === "tindakan") return true;
    if (activeCategory === "borang" && action.sourceType === "borang") return true;
    return true;
  });

  const handleDismiss = (id: string, name: string) => {
    setDismissedIds((prev) => [...prev, id]);
    toast.success(`Tindakan saringan bagi "${name}" ditandakan sebagai disemak.`);
  };

  const handleResetDismissed = () => {
    setDismissedIds([]);
    toast.success("Semua item disemak telah dipaparkan semula.");
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4" id="compliance-panel-loading">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 animate-pulse">
          <div className="w-10 h-10 bg-slate-100 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-3 bg-slate-50 rounded w-1/4" />
          </div>
        </div>
        <div className="space-y-3.5 pt-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 animate-pulse pt-2 first:pt-0">
              <div className="flex gap-3 items-start flex-1">
                <div className="w-3 h-3 bg-slate-200 rounded-full mt-1.5" />
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-50 rounded w-5/6" />
                </div>
              </div>
              <div className="w-24 h-8 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error Feedback State
  if (error) {
    return (
      <div className="bg-white border border-rose-200 rounded-3xl p-6 text-center space-y-4 shadow-sm" id="compliance-panel-error">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1.5">
          <h4 className="font-extrabold text-slate-800 text-sm">Gagal Sinkronisasi Pematuhan</h4>
          <p className="text-xs text-rose-600 leading-relaxed max-w-md mx-auto">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5" id="compliance-panel-methods">
      {/* Header Container adhering to "UI UX Pro Max Methodology" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl shadow-3xs">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="font-black text-slate-900 text-[14px] leading-tight tracking-tight">
              Tindakan Segera & Peringatan Pematuhan
            </h3>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mt-0.5">
              Derived Queue: {filteredActions.length} Tugasan Aktif Bertindak dalam Sistem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dismissedIds.length > 0 && (
            <button
              onClick={handleResetDismissed}
              className="text-[10px] font-black text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-150 px-3 py-1.5 rounded-lg transition-all border border-slate-150 cursor-pointer"
            >
              Papar Semula ({dismissedIds.length})
            </button>
          )}
          <span className="text-[9.5px] font-black bg-zinc-900 text-white px-2.5 py-1 rounded-md uppercase tracking-wider">
            UI UX PRO MAX METHODOLOGY
          </span>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap gap-1.5 pb-1">
        {[
          { id: "semua", label: "Semua Tugasan", count: actionQueue.length },
          { id: "pematuhan", label: "Isu Pematuhan", count: actionQueue.filter(a => a.sourceType === "pematuhan").length },
          { id: "tindakan", label: "Tindakan Susulan", count: actionQueue.filter(a => a.sourceType === "tindakan").length },
          { id: "borang", label: "Urusan Borang", count: actionQueue.filter(a => a.sourceType === "borang").length },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-[10.5px] font-extrabold rounded-lg transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeCategory === cat.id
                ? "bg-[#01696f] text-white border-[#01696f] shadow-2xs"
                : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{cat.label}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              activeCategory === cat.id ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Action Pipeline Stream */}
      {filteredActions.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl max-w-lg mx-auto space-y-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full shadow-3xs animate-bounce">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Gua Musang Bersih & Pematuhan Kelas Pertama</h4>
            <p className="text-[11px] text-slate-450 leading-relaxed px-5 max-w-sm mx-auto font-semibold">
              Tiada kelambatan borang, tindakan tertunggak, atau isu pematuhan yang dikesan dari Firestore. Prestasi cemerlang!
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1 space-y-3.5 text-left custom-scrollbar">
          {filteredActions.map((action) => {
            const isHighScore = (action.priorityScore || 0) >= 40;
            const isOverdue = action.title.toLowerCase().includes("tertunggak") || action.status.toLowerCase().includes("overdue");
            
            return (
              <div 
                key={action.id} 
                className="pt-3.5 first:pt-0 pb-1.5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 group hover:bg-slate-50/20 px-1 rounded-xl transition-all"
                id={`action-item-${action.id}`}
              >
                <div className="flex gap-3.5 items-start">
                  {/* Real-time compliance aura status pill */}
                  <span className="relative flex h-3 w-3 mt-1.5 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isHighScore ? "bg-rose-400" : "bg-amber-400"
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${
                      isHighScore ? "bg-rose-600" : "bg-amber-500"
                    }`}></span>
                  </span>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-800 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-150">
                        {action.domain || "Enforcement"}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#01696f] transition-all">
                        {action.institutionName}
                      </h4>
                      {isOverdue && (
                        <span className="text-[9.5px] font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-wide">
                          TERTUNGGAK
                        </span>
                      )}
                      
                      {action.priorityScore && action.priorityScore > 0 && (
                        <span className="text-[9.5px] font-mono font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                          Score: {action.priorityScore}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[13px] font-bold text-rose-900 group-hover:underline underline-offset-2 decoration-rose-400 block decoration-2">
                        {action.title}
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl font-medium">
                        {action.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[10.5px] font-semibold text-slate-500">
                      {action.dueDate && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Tarikh Akhir: <strong className="text-slate-700">{action.dueDate}</strong></span>
                        </div>
                      )}
                      {action.assignedOfficer && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Pegawai Rujukan: <strong className="text-slate-700">{action.assignedOfficer}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Intelligent Dynamic CTAs based on domain and source */}
                <div className="flex items-center gap-1.5 self-start lg:self-center bg-slate-50/50 p-1 rounded-xl border border-slate-150 shrink-0">
                  {/* Profile inspect */}
                  {onOpenInstitusi && action.institutionId && (
                    <button
                      onClick={() => onOpenInstitusi(action.institutionId || "")}
                      title="Siasat Profil IPS"
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-black bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer transition-colors shadow-2xs"
                    >
                      <Eye className="w-3 h-3 text-slate-400" />
                      Siasat
                    </button>
                  )}

                  {/* Borang details inspect */}
                  {onOpenBorangDetails && action.sourceType === "borang" && (
                    <button
                      onClick={() => onOpenBorangDetails(action.institutionName)}
                      title="Proses Borang / Amandemen"
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-black bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer transition-colors shadow-2xs"
                    >
                      <FileText className="w-3 h-3 text-white/80" />
                      Buka
                    </button>
                  )}

                  {/* General Case Action redirect */}
                  {onOpenTindakanPortal && action.sourceType === "tindakan" && (
                    <button
                      onClick={onOpenTindakanPortal}
                      title="Selesaikan Kes Tindakan Susulan"
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-black bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors shadow-2xs"
                    >
                      <ArrowRight className="w-3 h-3 text-white/80" />
                      Selesaikan
                    </button>
                  )}

                  {/* Dismiss / Mark processed manually */}
                  <button
                    onClick={() => handleDismiss(action.id, action.institutionName)}
                    title="Tanda telah diselesaikan / dibaca"
                    className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg cursor-pointer transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
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

export default ComplianceActionPanel;
