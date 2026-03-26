import React from "react";

/**
 * Mobile frame 390×844 — pixel-perfect shell for study-track screens.
 */
export default function StudyTrackShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen w-full bg-[#0f1419] flex justify-center items-start sm:items-center sm:py-6">
      <div
        className={`w-full max-w-[390px] min-h-[844px] bg-[#12181f] text-slate-100 shadow-2xl border border-slate-800/80 overflow-hidden flex flex-col ${className}`}
        style={{ minHeight: "844px", maxWidth: "390px" }}
      >
        {children}
      </div>
    </div>
  );
}
