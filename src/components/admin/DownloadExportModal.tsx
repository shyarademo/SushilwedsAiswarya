"use client";

import { useEffect, useId, useRef } from "react";

export type DownloadFormat = "xlsx" | "pdf";

type Props = {
  open: boolean;
  busy: boolean;
  busyFormat: DownloadFormat | null;
  onClose: () => void;
  onChoose: (format: DownloadFormat) => void;
};

export default function DownloadExportModal({
  open,
  busy,
  busyFormat,
  onClose,
  onChoose,
}: Props) {
  const titleId = useId();
  const excelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    const focusId = window.setTimeout(() => excelRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusId);
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="admin-sheet-backdrop"
      role="presentation"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="admin-sheet admin-download-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="admin-sheet__eyebrow">Export</p>
        <h2 id={titleId} className="admin-sheet__title">
          Download responses
        </h2>
        <p className="admin-download-sheet__hint">
          Exports every RSVP (ignores search and filters).
        </p>
        <div className="admin-sheet__actions">
          <button
            ref={excelRef}
            type="button"
            className="admin-btn admin-sheet__btn"
            disabled={busy}
            onClick={() => onChoose("xlsx")}
          >
            {busyFormat === "xlsx" ? "Preparing Excel…" : "Excel (.xlsx)"}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-sheet__btn"
            disabled={busy}
            onClick={() => onChoose("pdf")}
          >
            {busyFormat === "pdf" ? "Preparing PDF…" : "PDF"}
          </button>
          <button
            type="button"
            className="admin-link-btn admin-sheet__cancel"
            disabled={busy}
            onClick={() => {
              if (!busy) onClose();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
