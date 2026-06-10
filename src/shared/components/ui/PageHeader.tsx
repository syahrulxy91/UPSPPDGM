import React from "react";
import { GraduationCap, Award } from "lucide-react";

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
      <div className="space-y-2.5 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-primary-100/70 text-primary-900 border border-primary-300/40 uppercase tracking-widest">
          <Award className="w-3.5 h-3.5 text-primary-700 shrink-0" />
          SISTEM MAKLUMAT BERPADU
        </div>
        
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 font-sans leading-tight flex items-center gap-2">
            <span>{title}</span>
          </h1>
          {subtitle && (
            <p className="text-sm md:text-base text-slate-600 font-semibold font-sans leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Hero Accent Right Portal Decoration with soft gold touch */}
      <div className="hidden md:flex items-center gap-3 bg-white p-3 rounded-xl border border-secondary-350 shadow-xs relative z-10 shrink-0 select-none">
        <div className="w-10 h-10 bg-secondary-50 text-secondary-600 rounded-full flex items-center justify-center border border-secondary-200/60 shadow-xs">
          <GraduationCap className="w-5 h-5 text-secondary-600" />
        </div>
        <div className="text-left">
          <p className="text-xs font-black tracking-wider text-secondary-600 uppercase leading-none mb-1.5">
            PORTAL RASMI
          </p>
          <p className="text-xs md:text-sm font-black text-slate-900">
            Pendidikan Swasta Gua Musang
          </p>
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
