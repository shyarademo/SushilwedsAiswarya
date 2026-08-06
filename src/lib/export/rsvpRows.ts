import type { RsvpRow } from "@/lib/rsvpApi";

export type ExportRow = {
  When: string;
  Name: string;
  Phone: string;
  Side: string;
  Guests: string;
  Wedding: string;
  Kochi: string;
  Bengaluru: string;
  Message: string;
};

export const EXPORT_HEADERS = [
  "When",
  "Name",
  "Phone",
  "Side",
  "Guests",
  "Wedding",
  "Kochi",
  "Bengaluru",
  "Message",
] as const satisfies ReadonlyArray<keyof ExportRow>;

/** D1 often returns "YYYY-MM-DD HH:MM:SS" without timezone — normalize for Date(). */
function formatTime(raw: string): string {
  try {
    let value = raw.trim();
    if (!value) return "—";
    if (!value.includes("T")) value = value.replace(" ", "T");
    if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) value = `${value}Z`;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return raw;
  }
}

function labelYesNo(value: string | null | undefined): string {
  if (!value) return "—";
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return value;
}

function labelSide(value: string | null): string {
  if (!value) return "—";
  if (value === "bride") return "Bride";
  if (value === "groom") return "Groom";
  return value;
}

function displayGuestCount(row: RsvpRow): string {
  if (row.attendance !== "yes") return "—";
  if (row.guest_count == null || row.guest_count === undefined) return "—";
  const n = Number(row.guest_count);
  if (!Number.isFinite(n)) return "—";
  return String(n);
}

export function toExportRows(rsvps: RsvpRow[]): ExportRow[] {
  return rsvps.map((row) => ({
    When: formatTime(row.created_at),
    Name: row.full_name || "—",
    Phone: row.phone?.trim() || "—",
    Side: labelSide(row.side),
    Guests: displayGuestCount(row),
    Wedding: labelYesNo(row.attend_wedding),
    Kochi: labelYesNo(row.attend_reception),
    Bengaluru: labelYesNo(row.attend_reception_bengaluru),
    Message: row.message?.trim() || "—",
  }));
}

export function exportFilename(ext: "xlsx" | "pdf"): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `aiswarya-sushil-rsvps-${yyyy}-${mm}-${dd}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
