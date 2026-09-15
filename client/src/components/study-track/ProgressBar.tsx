import React from "react";

type Props = {
  percent: number;
  label?: string;
};

export default function ProgressBar({ percent, label = "Bugünkü plan" }: Props) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="rounded-2xl bg-slate-800/60 p-4 border border-slate-700/80">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm font-bold text-emerald-400">{p}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500 ease-out"
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}
