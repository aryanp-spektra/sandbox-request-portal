/**
 * Catalog export utilities, Excel (.xlsx) and PDF.
 * Called from client components only (uses browser download). Libraries are
 * imported dynamically so they stay out of the initial bundle.
 */
import type { Lab, Lifecycle } from "./types";

const STATUS_LABEL: Record<Lifecycle, string> = {
  Ready: "Ready",
  InUse: "In use",
  Stale: "Needs validation",
  InTesting: "Coming soon",
  Retired: "Retired",
};

function fmt(iso: string | null) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "Not yet built";
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

interface Row {
  Title: string;
  Type: string;
  "FY26 Solution Area": string;
  "FY26 Solution Play": string;
  "FY27 Solution Area": string;
  "FY27 Solution Play": string;
  Level: string;
  Delivery: string;
  "Access (h)": string;
  Status: string;
  Requestable: string;
  "Last refreshed": string;
  Modules: number;
  "Featured products": string;
  "What changed (Build 2026)": string;
  Highlight: string;
}

function toRows(labs: Lab[]): Row[] {
  return labs.map((l) => ({
    Title: l.title,
    Type: l.typeLabel,
    "FY26 Solution Area": l.fy26Area ?? "New for FY27",
    "FY26 Solution Play": l.fy26Play ?? "New for FY27",
    "FY27 Solution Area": l.fy27Area,
    "FY27 Solution Play": l.fy27Play ?? "",
    Level: l.level ?? "",
    Delivery: l.style ?? "",
    "Access (h)": l.durationHours ? String(l.durationHours) : "",
    Status: STATUS_LABEL[l.lifecycle],
    Requestable: l.requestable ? "Yes" : "No",
    "Last refreshed": fmt(l.lastRefresh),
    Modules: l.modules.length,
    "Featured products": l.products.join(", "),
    "What changed (Build 2026)": l.enhancements ?? "",
    Highlight: l.hook,
  }));
}

export async function exportExcel(labs: Lab[], label = "filtered view") {
  const XLSX = await import("xlsx");
  const rows = toRows(labs);

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 52 }, { wch: 16 }, { wch: 24 }, { wch: 30 }, { wch: 24 }, { wch: 30 },
    { wch: 13 }, { wch: 18 }, { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
    { wch: 9 }, { wch: 46 }, { wch: 50 }, { wch: 60 },
  ];

  // summary sheet
  const byType = new Map<string, number>();
  const byArea = new Map<string, number>();
  const byStatus = new Map<string, number>();
  for (const l of labs) {
    byType.set(l.typeLabel, (byType.get(l.typeLabel) ?? 0) + 1);
    byArea.set(String(l.solutionArea), (byArea.get(String(l.solutionArea)) ?? 0) + 1);
    byStatus.set(STATUS_LABEL[l.lifecycle], (byStatus.get(STATUS_LABEL[l.lifecycle]) ?? 0) + 1);
  }
  const summary = [
    ["Microsoft Sandbox, Lab Catalog FY27"],
    [`Exported ${stamp()} (${label})`],
    [`Total labs: ${labs.length}`],
    [],
    ["By offering type"],
    ...[...byType.entries()].map(([k, v]) => [k, v]),
    [],
    ["By workload"],
    ...[...byArea.entries()].map(([k, v]) => [k, v]),
    [],
    ["By status"],
    ...[...byStatus.entries()].map(([k, v]) => [k, v]),
  ];
  const wsSum = XLSX.utils.aoa_to_sheet(summary);
  wsSum["!cols"] = [{ wch: 38 }, { wch: 10 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSum, "Summary");
  XLSX.utils.book_append_sheet(wb, ws, "Lab Catalog");
  XLSX.writeFile(wb, `Microsoft-Sandbox-Catalog-${stamp()}.xlsx`);
}

export async function exportPDF(labs: Lab[], label = "Full catalog") {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // branded header band
  doc.setFillColor(10, 14, 26);
  doc.rect(0, 0, W, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Microsoft Sandbox, Lab Catalog FY27", 40, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(180, 190, 215);
  doc.text(`${label}  |  ${labs.length} labs  |  Exported ${stamp()}`, 40, 48);

  autoTable(doc, {
    startY: 78,
    head: [["Lab", "Type", "FY26 play", "FY27 area", "FY27 play", "Level", "Status"]],
    body: labs.map((l) => [
      l.title,
      l.typeLabel,
      l.fy26Play ?? "New for FY27",
      l.fy27Area,
      l.fy27Play ?? "",
      l.level ?? "",
      STATUS_LABEL[l.lifecycle],
    ]),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak", valign: "middle" },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: [246, 247, 251] },
    columnStyles: {
      0: { cellWidth: 210, fontStyle: "bold" },
      1: { cellWidth: 78 },
      2: { cellWidth: 130 },
      3: { cellWidth: 110 },
      4: { cellWidth: 130 },
      5: { cellWidth: 62 },
      6: { cellWidth: 70 },
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(`Microsoft-Sandbox-Catalog-${stamp()}.pdf`);
}
