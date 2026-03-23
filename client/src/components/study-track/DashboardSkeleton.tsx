import React from "react";
import StudyTrackShell from "./StudyTrackShell";

export default function DashboardSkeleton() {
  return (
    <StudyTrackShell>
      <div className="px-4 py-4 border-b border-slate-800 flex justify-between animate-pulse">
        <div className="h-5 w-40 rounded-lg bg-slate-700/80" />
        <div className="h-10 w-10 rounded-xl bg-slate-700/80" />
      </div>
      <div className="flex-1 px-4 py-4 space-y-4">
        <div className="h-24 rounded-2xl bg-slate-800/60 animate-pulse" />
        <div className="h-36 rounded-2xl bg-slate-800/50 animate-pulse" />
        <div className="h-52 rounded-2xl bg-slate-800/50 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-800/60 animate-pulse" />
      </div>
    </StudyTrackShell>
  );
}
