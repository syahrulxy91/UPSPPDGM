import React from "react";

export interface LoadingSkeletonProps {
  rows?: number;
}

export function LoadingSkeleton({ rows = 4 }: LoadingSkeletonProps) {
  return (
    <div
      id="loading-skeleton-container"
      className="w-full bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-3xs"
    >
      {/* Header bar placeholder */}
      <div className="flex items-center space-x-4 pb-2 border-b border-slate-100">
        <div className="h-6 w-1/4 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-4 w-1/12 bg-slate-100 rounded-sm animate-pulse ml-auto" />
      </div>

      {/* Rows of loading bars */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 py-2 border-b border-slate-50 last:border-0"
          >
            <div className="h-4 w-12 bg-slate-200 rounded-md animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1 select-none">
              <div className="h-4 w-full bg-slate-100 rounded-md animate-pulse" />
              <div className="h-3 w-4/6 bg-slate-50 rounded-md animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingSkeleton;
