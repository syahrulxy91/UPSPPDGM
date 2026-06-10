import React from "react";

export interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className = "" }: SectionCardProps) {
  return (
    <section
      id={`section-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Elegantly styled section header with dual blue & gold accent pillar */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white px-6 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center shrink-0">
            <span className="w-1.5 h-3 bg-primary-600 rounded-t-full" />
            <span className="w-1.5 h-2.5 bg-secondary-400 rounded-b-full mt-0.5" />
          </div>
          <h3 className="text-base md:text-lg font-black tracking-tight text-slate-900 font-sans">
            {title}
          </h3>
        </div>
      </div>
      
      {/* Spacious padded inner wrapper */}
      <div className="p-6 md:p-8">
        {children}
      </div>
    </section>
  );
}

export default SectionCard;
