import React from "react";
import { Award } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div
      id={`page-header-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="w-full relative overflow-hidden bg-gradient-to-r from-primary-50 via-white to-secondary-50/30 p-6 md:p-8 rounded-2xl border-l-4 border-l-primary-600 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      {/* Decorative clean background badges (official look) */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary-100/30 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-100/25 rounded-full blur-xl -ml-12 -mb-12 pointer-events-none" />

      {/* Hero Content Panel Left */}
      <div className="space-y-2.5 relative z-10 w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-primary-100/70 text-primary-900 border border-primary-300/40 uppercase tracking-widest">
          <Award className="w-3.5 h-3.5 text-primary-700 shrink-0" />
          SISTEM MAKLUMAT BERPADU
        </div>
        
        <div className="space-y-1.5 font-sans">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight flex items-center gap-2">
            <span>{title}</span>
          </h1>
          {subtitle && (
            <p className="text-sm md:text-base text-slate-600 font-semibold leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
