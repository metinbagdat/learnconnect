import React from "react";
import { Target } from "lucide-react";

type Props = {
  goalNet: number;
  currentNet: number;
};

export default function TargetCard({ goalNet, currentNet }: Props) {
  const diff = goalNet - currentNet;
  const need = diff > 0;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-600/30 to-violet-600/20 border border-indigo-500/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-indigo-300" />
        <h3 className="text-sm font-semibold text-slate-100">Hedef</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-slate-900/50 py-3">
          <p className="text-xs text-slate-400 mb-1">Hedef net</p>
          <p className="text-2xl font-bold text-white">{goalNet}</p>
        </div>
        <div className="rounded-xl bg-slate-900/50 py-3">
          <p className="text-xs text-slate-400 mb-1">Şu an</p>
          <p className="text-2xl font-bold text-cyan-300">{currentNet}</p>
        </div>
      </div>
      <p className="mt-3 text-center text-sm font-medium">
        {need ? (
          <span className="text-amber-300">
            +{diff} net gerekli
          </span>
        ) : (
          <span className="text-emerald-400">Hedefe ulaşıldı 🎉</span>
        )}
      </p>
    </div>
  );
}
