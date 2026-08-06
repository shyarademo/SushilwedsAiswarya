import type { RsvpRow } from "@/lib/rsvpApi";
import {
  downloadBlob,
  EXPORT_HEADERS,
  exportFilename,
  toExportRows,
  type ExportRow,
} from "@/lib/export/rsvpRows";

/** Build and download a landscape A4 PDF table from RSVP rows (client-side only). */
export async function exportRsvpsPdf(rsvps: RsvpRow[]): Promise<void> {
  const [jspdfMod, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const jsPDF = jspdfMod.default;
  const autoTable = autoTableMod.default;

  const exportRows = toExportRows(rsvps);
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const marginX = 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(90, 20, 30);
  // Stick to WinAnsi-safe glyphs for built-in Helvetica (no em dash / middle dot).
  doc.text("Aiswarya & Sushil - RSVPs", marginX, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 70, 60);
  const generated = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.text(
    `${exportRows.length} responses | Generated ${generated}`,
    marginX,
    20
  );

  const body = exportRows.map((row) =>
    EXPORT_HEADERS.map((key) => {
      const value = row[key as keyof ExportRow];
      // Helvetica cannot render em dash; normalize common placeholders.
      return value === "—" ? "-" : value;
    })
  );

  autoTable(doc, {
    startY: 24,
    head: [[...EXPORT_HEADERS]],
    body,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      overflow: "linebreak",
      valign: "top",
      textColor: [58, 42, 34],
    },
    headStyles: {
      fillColor: [90, 20, 30],
      textColor: [255, 254, 249],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [252, 248, 240],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      2: { cellWidth: 24 },
      3: { cellWidth: 14 },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 16, halign: "center" },
      6: { cellWidth: 14, halign: "center" },
      7: { cellWidth: 18, halign: "center" },
      8: { cellWidth: "auto" },
    },
    margin: { left: marginX, right: marginX, top: 24, bottom: 14 },
  });

  // Stamp page numbers after layout so "of N" is correct on every page.
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 110, 100);
    doc.text(
      `Page ${page} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  downloadBlob(doc.output("blob"), exportFilename("pdf"));
}
