import React from "react";
import { AlertTriangle } from "lucide-react";

type Props = {
  message: string | null;
};

export default function WarningCard({ message }: Props) {
  if (!message) return null;
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <p className="text-sm leading-relaxed text-amber-100/95">{message}</p>
    </div>
  );
}
