import React from "react";
import { 
  Building2, 
  ShieldAlert, 
  Calendar, 
  CheckCircle,
  Info,
  LucideIcon
} from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

export function KpiCard({ label, value, hint, tone = "default" }: KpiCardProps) {
  const getToneClasses = () => {
    switch (tone) {
      case "success":
        return {
          card: "bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-50/85",
          value: "text-emerald-900",
          hint: "text-emerald-700/90",
          iconBg: "bg-emerald-100 text-emerald-700",
          borderAccent: "border-t-4 border-t-emerald-500",
          icon: CheckCircle
        };
      case "warning":
        return {
          card: "bg-amber-50 border-amber-200 text-amber-950 hover:bg-amber-50/85",
          value: "text-amber-900",
          hint: "text-amber-700/90",
          iconBg: "bg-amber-100 text-amber-700",
          borderAccent: "border-t-4 border-t-amber-500",
          icon: Calendar
        };
      case "danger":
        return {
          card: "bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-50/85",
          value: "text-rose-900",
          hint: "text-rose-700/90",
          iconBg: "bg-rose-100 text-rose-700",
          borderAccent: "border-t-4 border-t-rose-500",
          icon: ShieldAlert
        };
      case "info":
        return {
          card: "bg-sky-50 border-sky-200 text-sky-950 hover:bg-sky-50/85",
          value: "text-sky-900",
          hint: "text-sky-700/90",
          iconBg: "bg-sky-100 text-sky-700",
          borderAccent: "border-t-4 border-t-sky-500",
          icon: Info
        };
      case "default":
      default:
        return {
          card: "bg-white border-slate-200 text-slate-900 hover:border-primary-200/60",
          value: "text-primary-800",
          hint: "text-slate-500",
          iconBg: "bg-primary-50 text-primary-600 border border-primary-100/40",
          borderAccent: "border-t-4 border-t-primary-600",
          icon: Building2
        };
    }
  };

  const classes = getToneClasses();
  const IconComponent = classes.icon;

  return (
    <div
      id={`kpi-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-xs flex flex-col items-center justify-center text-center min-h-[150px] ${classes.card} ${classes.borderAccent}`}
    >
      {/* Centered visual icon */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 shrink-0 ${classes.iconBg}`}>
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="space-y-1.5 w-full flex flex-col items-center justify-center">
        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase block text-center">
          {label}
        </span>
        <p className={`text-3xl md:text-4xl font-extrabold tracking-tight text-center ${classes.value}`}>
          {value}
        </p>
        {hint && (
          <p className={`text-[11px] font-bold leading-normal text-center truncate max-w-full ${classes.hint}`}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

export default KpiCard;
