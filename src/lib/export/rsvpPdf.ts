import type { RsvpRow } from "@/lib/rsvpApi";
import {
  EXPORT_HEADERS,
  toExportRows,
  type ExportRow,
} from "@/lib/export/rsvpRows";

/** Escapes HTML characters to prevent rendering glitches. */
function escapeHtml(unsafe: string | number | boolean | null | undefined): string {
  if (unsafe == null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Build and trigger browser print of a landscape A4 table from RSVP rows (client-side only). */
export async function exportRsvpsPdf(rsvps: RsvpRow[]): Promise<void> {
  const exportRows = toExportRows(rsvps);
  const generated = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Create an iframe to hold the print layout.
  // Using 0x0 size and placing it out of flow instead of `visibility: hidden` 
  // or `display: none` to ensure it works reliably in Firefox/Safari print dialogs.
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  // Generate HTML table for printing
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Aiswarya & Sushil - RSVPs</title>
        <meta charset="utf-8">
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #3a2a22;
            margin: 0;
            padding: 0;
          }
          h1 {
            color: #5a141e;
            font-size: 16px;
            margin: 0 0 4px 0;
          }
          p.meta {
            color: #50463c;
            margin: 0 0 16px 0;
            font-size: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed; /* helps with long messages */
          }
          /* Column sizing */
          th:nth-child(1), td:nth-child(1) { width: 12%; } /* When */
          th:nth-child(2), td:nth-child(2) { width: 12%; } /* Name */
          th:nth-child(3), td:nth-child(3) { width: 10%; } /* Phone */
          th:nth-child(4), td:nth-child(4) { width: 6%; }  /* Side */
          th:nth-child(5), td:nth-child(5) { width: 5%; text-align: center; }  /* Guests */
          th:nth-child(6), td:nth-child(6) { width: 6%; text-align: center; }  /* Wedding */
          th:nth-child(7), td:nth-child(7) { width: 6%; text-align: center; }  /* Kochi */
          th:nth-child(8), td:nth-child(8) { width: 7%; text-align: center; }  /* Bengaluru */
          th:nth-child(9), td:nth-child(9) { width: auto; } /* Message */

          th {
            background-color: #5a141e;
            color: #fffef9;
            font-weight: bold;
            padding: 6px 4px;
            text-align: left;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          td {
            padding: 6px 4px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          tr:nth-child(even) td {
            background-color: #fcf8f0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <h1>Aiswarya & Sushil - RSVPs</h1>
        <p class="meta">${escapeHtml(exportRows.length)} responses | Generated ${escapeHtml(generated)}</p>
        <table>
          <thead>
            <tr>
              ${EXPORT_HEADERS.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${exportRows
              .map(
                (row) => `
              <tr>
                ${EXPORT_HEADERS.map((key) => {
                  let val = row[key as keyof ExportRow];
                  if (val === "—") val = "-"; // normalize em dash if present
                  return `<td>${escapeHtml(val)}</td>`;
                }).join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  // Print after rendering
  return new Promise((resolve) => {
    // Wait briefly for the DOM to settle and styles to apply
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print failed:", err);
      }
      
      // Cleanup iframe. Some browsers block JS during print(),
      // so this timeout starts *after* the print dialog closes.
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve();
      }, 500);
    }, 250);
  });
}
