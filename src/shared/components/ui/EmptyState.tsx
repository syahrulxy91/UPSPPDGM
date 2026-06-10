import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div
      id={`empty-state-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-slate-200/80 max-w-lg mx-auto space-y-4 shadow-2xs"
    >
      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 shadow-3xs">
        <FolderOpen className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-bold text-slate-800 font-sans tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export default EmptyState;
