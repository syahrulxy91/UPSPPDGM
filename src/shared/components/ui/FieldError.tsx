import React from "react";
import { AlertCircle } from "lucide-react";

interface FieldErrorProps {
  error?: string;
}

export function FieldError({ error }: FieldErrorProps) {
  if (!error) return null;
  return (
    <span className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-1 transition-all duration-150">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
      <span>{error}</span>
    </span>
  );
}

export default FieldError;
