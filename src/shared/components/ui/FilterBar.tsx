import React from "react";
import { ListFilter } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
}

export interface FilterBarProps {
  fields: FilterField[];
  onChange: (key: string, value: string) => void;
}

export function FilterBar({ fields, onChange }: FilterBarProps) {
  return (
    <div
      id="filter-bar-container"
      className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-xs"
    >
      <div className="flex items-center gap-2.5 text-slate-950 text-sm font-black uppercase tracking-wider shrink-0 pb-2 md:pb-0 border-b md:border-b-0 border-slate-200/50 w-full md:w-auto">
        <div className="p-1 px-1.5 bg-primary-100/70 text-primary-900 rounded-lg border border-primary-200/50 shadow-xs">
          <ListFilter className="w-3.5 h-3.5 text-primary-700" />
        </div>
        <span>Cari Mengikut:</span>
      </div>

      <div className="flex flex-wrap items-center gap-4 overflow-x-auto pb-0.5 scrollbar-none w-full">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1 min-w-[130px] flex-1 sm:flex-initial">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1">
              {field.label}
            </span>
            <select
              id={`filter-select-${field.key}`}
              value={field.value}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="bg-white border border-slate-350 hover:border-secondary-500 text-slate-900 text-sm rounded-lg px-3.5 py-2.5 font-semibold transition-all duration-200 focus:border-primary-500 focus:outline-hidden cursor-pointer shadow-xs"
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FilterBar;
