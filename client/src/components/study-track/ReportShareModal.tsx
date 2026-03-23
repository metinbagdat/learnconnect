import React from "react";
import { X, Link2 } from "lucide-react";

type Props = {
  open: boolean;
  url: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

export default function ReportShareModal({
  open,
  url,
  loading,
  error,
  onClose,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-[390px] rounded-2xl bg-slate-900 border border-slate-700 p-4 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-white">Rapor bağlantısı</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {loading && (
          <p className="text-sm text-slate-400">PDF oluşturuluyor…</p>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {url && !loading && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 break-all">{url}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(url);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-slate-100 text-sm font-medium hover:bg-slate-700"
              >
                <Link2 className="w-4 h-4" />
                Kopyala
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
              >
                Aç
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
