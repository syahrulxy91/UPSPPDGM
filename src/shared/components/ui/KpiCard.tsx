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
          borderAccent: "border-l-4 border-l-emerald-500",
          icon: CheckCircle
        };
      case "warning":
        return {
          card: "bg-amber-50 border-amber-200 text-amber-950 hover:bg-amber-50/85",
          value: "text-amber-900",
          hint: "text-amber-700/90",
          iconBg: "bg-amber-100 text-amber-700",
          borderAccent: "border-l-4 border-l-amber-500",
          icon: Calendar
        };
      case "danger":
        return {
          card: "bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-50/85",
          value: "text-rose-900",
          hint: "text-rose-700/90",
          iconBg: "bg-rose-100 text-rose-700",
          borderAccent: "border-l-4 border-l-rose-500",
          icon: ShieldAlert
        };
      case "info":
        return {
          card: "bg-sky-50 border-sky-200 text-sky-950 hover:bg-sky-50/85",
          value: "text-sky-900",
          hint: "text-sky-700/90",
          iconBg: "bg-sky-100 text-sky-700",
          borderAccent: "border-l-4 border-l-sky-500",
          icon: Info
        };
      case "default":
      default:
        return {
          card: "bg-white border-slate-200 text-slate-900 hover:border-primary-200/60",
          value: "text-primary-800",
          hint: "text-slate-500",
          iconBg: "bg-primary-50 text-primary-600 border border-primary-100/40",
          borderAccent: "border-l-4 border-l-primary-600",
          icon: Building2
        };
    }
  };

  const classes = getToneClasses();
  const IconComponent = classes.icon;

  return (
    <div
      id={`kpi-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-xs flex flex-col justify-between min-h-[136px] ${classes.card} ${classes.borderAccent}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-black tracking-wider text-slate-500 uppercase">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${classes.iconBg}`}>
          <IconComponent className="w-4 h-4" />
        </div>
      </div>
      
      <div className="space-y-1 mt-2">
        <p className={`text-3xl md:text-4xl font-extrabold tracking-tight ${classes.value}`}>
          {value}
        </p>
        {hint && (
          <p className={`text-xs font-bold leading-normal truncate ${classes.hint}`}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

export default KpiCard;
