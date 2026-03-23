import React from "react";
import { Settings } from "lucide-react";

type Props = {
  streakDays: number;
  onSettingsClick: () => void;
};

export default function Header({ streakDays, onSettingsClick }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 py-4 border-b border-slate-800 bg-[#12181f]/95 backdrop-blur"
      style={{ padding: "16px" }}
    >
      <p className="text-[15px] font-semibold tracking-tight text-slate-100">
        <span className="mr-1" aria-hidden>
          🔥
        </span>
        Streak:{" "}
        <span className="text-amber-400">{streakDays}</span> gün
      </p>
      <button
        type="button"
        onClick={onSettingsClick}
        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition text-slate-200"
        aria-label="Ayarlar"
      >
        <Settings className="w-5 h-5" strokeWidth={2} />
      </button>
    </header>
  );
}
