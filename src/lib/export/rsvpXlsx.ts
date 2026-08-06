import type { RsvpRow } from "@/lib/rsvpApi";
import {
  downloadBlob,
  EXPORT_HEADERS,
  exportFilename,
  toExportRows,
} from "@/lib/export/rsvpRows";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function toArrayBuffer(
  raw: ArrayBuffer | Uint8Array | number[] | unknown
): ArrayBuffer {
  if (raw instanceof ArrayBuffer) return raw;
  if (ArrayBuffer.isView(raw)) {
    const view = raw as ArrayBufferView;
    const copy = new Uint8Array(view.byteLength);
    copy.set(
      new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
    );
    return copy.buffer;
  }
  if (Array.isArray(raw)) {
    const copy = Uint8Array.from(raw as number[]);
    return copy.buffer;
  }
  throw new Error("Unexpected workbook output");
}

/** Build and download an .xlsx workbook from RSVP rows (client-side only). */
export async function exportRsvpsXlsx(rsvps: RsvpRow[]): Promise<void> {
  const XLSX = await import("xlsx");
  const exportRows = toExportRows(rsvps);
  const sheet = XLSX.utils.json_to_sheet(exportRows, {
    header: [...EXPORT_HEADERS],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "RSVPs");
  const raw = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  downloadBlob(
    new Blob([toArrayBuffer(raw)], { type: XLSX_MIME }),
    exportFilename("xlsx")
  );
}
