import React from "react";

export interface StatusBadgeProps {
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const getBadgeStyles = () => {
    switch (tone) {
      case "success":
        return "bg-emerald-100/60 text-emerald-900 border-emerald-300/40";
      case "warning":
        return "bg-amber-100/65 text-amber-900 border-amber-300/40";
      case "danger":
        return "bg-rose-100/60 text-rose-900 border-rose-300/40";
      case "info":
        return "bg-sky-100/60 text-sky-900 border-sky-300/40";
      case "neutral":
      default:
        return "bg-slate-100/80 text-slate-900 border-slate-200/80";
    }
  };

  return (
    <span
      id={`status-badge-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border transition-all duration-200 ${getBadgeStyles()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        tone === "success" ? "bg-emerald-500 animate-pulse" :
        tone === "warning" ? "bg-amber-500 animate-pulse" :
        tone === "danger" ? "bg-rose-500 animate-pulse" :
        tone === "info" ? "bg-sky-500 animate-pulse" : "bg-slate-400"
      }`} />
      {label}
    </span>
  );
}

export default StatusBadge;
