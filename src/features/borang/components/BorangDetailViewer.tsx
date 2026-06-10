import React, { useEffect, useState } from "react";
import { BorangRecord } from "../../../types/borang";

interface BorangDetailViewerProps {
  borang: BorangRecord;
}

export const BorangDetailViewer: React.FC<BorangDetailViewerProps> = ({ borang }) => {
  const fields = borang.detailFields;
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!borang || !borang.id) return;
    
    async function fetchFormAudit() {
      setLoading(true);
      try {
        const { getAuditLogsForEntity } = await import("../../../shared/services/auditLogService");
        const logs = await getAuditLogsForEntity("borang", borang.id);
        setAuditLogs(logs);
      } catch (err) {
        console.error("Gagal mendapatkan audit log bagi borang ini", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFormAudit();
  }, [borang]);

  if (!fields || Object.keys(fields).length === 0) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 italic font-semibold">
        Sila klik butang kemas kini tindakan untuk melampirkan butiran berstruktur.
      </div>
    );
  }

  const renderItem = (label: string, val: any) => {
    if (val === undefined || val === null || val === "") return null;
    let textVal = String(val);
    if (Array.isArray(val)) {
      textVal = val.join(", ");
    }
    return (
      <div key={label} className="border-b border-slate-100 py-2 flex flex-col sm:flex-row sm:justify-between gap-1 text-[11px]">
        <span className="font-extrabold text-slate-400 uppercase tracking-wider shrink-0 min-w-[170px]">{label.replace(/_/g, " ")}:</span>
        <span className="font-extrabold text-slate-900 break-words text-right sm:text-right">{textVal}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-50/55 border border-slate-200/60 p-4 rounded-xl space-y-2 mt-3.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
        <span className="text-[10px] font-black tracking-widest text-primary-950 uppercase">Kandungan Lapisan Form Fields:</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-primary-100 text-primary-950 font-black tracking-wider uppercase">RESMI KPM</span>
      </div>
      <div className="grid grid-cols-1 gap-x-4">
        {Object.entries(fields).map(([key, value]) => {
          // Exclude internal ids if redundancy is not requested
          if (key === "ipsId") return null;
          return renderItem(key, value);
        })}
      </div>

      {/* Sejarah Tindakan Borang (Audit Trace) */}
      <div className="border-t border-slate-200/80 pt-3.5 mt-3.5 space-y-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-black tracking-widest text-primary-950 uppercase">Sejarah Tindakan Borang (SPS Audit):</span>
        </div>
        
        {loading ? (
          <div className="text-[10px] font-mono text-slate-400 py-1 flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>Memulakan semakan terus ke Firestore...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-[10px] text-slate-400 font-bold bg-slate-100 p-2.5 text-center rounded-xl">
            Tiada log tindakan dirakam bagi borang rujukan ini.
          </div>
        ) : (
          <div className="space-y-2 select-none">
            {auditLogs.map((log) => (
              <div key={log.id} className="text-[10px] bg-white border border-slate-150 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 transition-all hover:border-slate-300">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-slate-800">
                      {log.description}
                    </span>
                    <span className="text-[8px] bg-slate-100 text-slate-550 border border-slate-150 px-1 py-0.2 rounded font-black uppercase">
                      {log.actionType}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                    Oleh: <span className="text-secondary-750 font-black">{log.performedBy || "Pegawai"}</span> ({log.performedEmail})
                  </div>
                </div>
                <span className="text-[9px] font-mono font-extrabold text-slate-500 whitespace-nowrap bg-slate-50 px-1.5 py-0.5 border border-slate-100 rounded">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
