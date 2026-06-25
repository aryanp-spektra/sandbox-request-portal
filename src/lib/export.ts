/**
 * Catalog export utilities, Excel (.xlsx) and PDF.
 * Called from client components only (uses browser download). Libraries are
 * imported dynamically so they stay out of the initial bundle.
 */
import type { Lab } from "./types";

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

/** Number a lab's modules into a single multi-line cell (GPS-catalog style). */
function numberedModules(modules: string[]): string {
  return modules.map((m, i) => `${i + 1}. ${m}`).join("\n");
}

/* ════════════════════════════════════════════════════════════════════════
   EXCEL — GPS Catalog column layout
   ════════════════════════════════════════════════════════════════════════ */

interface Row {
  "FY26 Solution Area": string;
  "FY26 Solution Play": string;
  "FY27 Solution Area": string;
  "FY27 Solution Play": string;
  "Level (in GPS Catalog format)": string;
  "Lab Title": string;
  "Lab Catalog": string;
  Style: string;
  Status: string;
  "Duration in Hours": string | number;
  "Course Overview (in GPS Catalog format)": string;
  "Lab Modules / Exercises": string;
  "Featured Product (in GPS Catalog format)": string;
}

function toRows(labs: Lab[]): Row[] {
  return labs.map((l) => ({
    "FY26 Solution Area": l.fy26Area ?? "",
    "FY26 Solution Play": l.fy26Play ?? "",
    "FY27 Solution Area": l.fy27Area,
    "FY27 Solution Play": l.fy27Play ?? "",
    "Level (in GPS Catalog format)": l.level ?? "",
    "Lab Title": l.title,
    "Lab Catalog": l.typeLabel,
    Style: l.style ?? "",
    Status: l.catalogStatus,
    "Duration in Hours": l.durationHours ?? "",
    "Course Overview (in GPS Catalog format)": l.overview,
    "Lab Modules / Exercises": numberedModules(l.modules),
    "Featured Product (in GPS Catalog format)": l.products.join(", "),
  }));
}

export async function exportExcel(labs: Lab[], label = "filtered view") {
  const XLSX = await import("xlsx");
  const rows = toRows(labs);

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 22 }, { wch: 26 }, { wch: 22 }, { wch: 30 }, { wch: 16 }, { wch: 42 },
    { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 72 }, { wch: 56 }, { wch: 46 },
  ];
  // Wrap text and lift row height so the multi-line module/overview cells breathe.
  // (Best-effort: honored by Excel; ignored by viewers that don't read styles.)
  const range = XLSX.utils.decode_range(ws["!ref"]!);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell) cell.s = { alignment: { wrapText: true, vertical: "top" } };
    }
  }
  ws["!rows"] = [{ hpt: 18 }, ...rows.map(() => ({ hpt: 120 }))];

  // summary sheet
  const byType = new Map<string, number>();
  const byArea = new Map<string, number>();
  const byStatus = new Map<string, number>();
  for (const l of labs) {
    byType.set(l.typeLabel, (byType.get(l.typeLabel) ?? 0) + 1);
    byArea.set(String(l.solutionArea), (byArea.get(String(l.solutionArea)) ?? 0) + 1);
    byStatus.set(l.catalogStatus, (byStatus.get(l.catalogStatus) ?? 0) + 1);
  }
  const summary = [
    ["Microsoft Sandbox, Lab Catalog FY27"],
    [`Exported ${stamp()} (${label})`],
    [`Total labs: ${labs.length}`],
    [],
    ["By offering type"],
    ...[...byType.entries()].map(([k, v]) => [k, v]),
    [],
    ["By solution area"],
    ...[...byArea.entries()].map(([k, v]) => [k, v]),
    [],
    ["By status"],
    ...[...byStatus.entries()].map(([k, v]) => [k, v]),
  ];
  const wsSum = XLSX.utils.aoa_to_sheet(summary);
  wsSum["!cols"] = [{ wch: 40 }, { wch: 10 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "FY27 Catalog");
  XLSX.utils.book_append_sheet(wb, wsSum, "Summary");
  XLSX.writeFile(wb, `Microsoft-Sandbox-Catalog-${stamp()}.xlsx`);
}

/* ════════════════════════════════════════════════════════════════════════
   PDF — premium one-lab-per-page booklet
   ════════════════════════════════════════════════════════════════════════ */

// CloudLabs brand palette (sRGB approximations of the violet tokens)
const BRAND: [number, number, number] = [109, 78, 214];
const BRAND_DARK: [number, number, number] = [70, 48, 138];
const INK: [number, number, number] = [26, 26, 32];
const MUT: [number, number, number] = [110, 110, 128];
const FAINT: [number, number, number] = [150, 150, 165];
const LINE: [number, number, number] = [228, 226, 236];
const TINT: [number, number, number] = [245, 242, 252];

export async function exportPDF(labs: Lab[], label = "Full catalog") {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2;

  /* ── cover ──────────────────────────────────────────────────────────── */
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, W, H, "F");
  // soft lighter wash in the corner for depth
  doc.setFillColor(...BRAND);
  doc.circle(W + 40, -20, 240, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setCharSpace(2);
  doc.text("MICROSOFT SANDBOX", M, 250);
  doc.setCharSpace(0);

  doc.setFontSize(42);
  doc.text("FY27 Lab Catalog", M, 300);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13.5);
  doc.setTextColor(225, 218, 248);
  doc.text(
    doc.splitTextToSize(
      "Guided labs, hackathons and sandboxes across AI, cloud and security — the complete FY27 program, one lab per page.",
      CW - 80
    ),
    M,
    336
  );

  // divider + meta
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.line(M, 392, M + 120, 392);
  doc.setFontSize(11);
  doc.setTextColor(235, 230, 250);
  doc.text(`${labs.length} labs   ·   ${label}   ·   Exported ${stamp()}`, M, 416);

  doc.setFontSize(10.5);
  doc.setTextColor(205, 196, 235);
  doc.text("Powered by CloudLabs — Spektra Systems", M, H - 56);

  /* ── helpers for lab pages ──────────────────────────────────────────── */
  let y = 0;
  const ensure = (need: number) => {
    if (y + need > H - 54) {
      doc.addPage();
      y = 64;
    }
  };
  const heading = (text: string) => {
    ensure(34);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND);
    doc.setCharSpace(1.2);
    doc.text(text.toUpperCase(), M, y);
    doc.setCharSpace(0);
    y += 7;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.7);
    doc.line(M, y, M + CW, y);
    y += 15;
  };
  const para = (text: string, size = 9.7, color = INK, lh = 13.5) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CW) as string[];
    for (const ln of lines) {
      ensure(lh);
      doc.text(ln, M, y);
      y += lh;
    }
  };

  /* ── one page per lab ───────────────────────────────────────────────── */
  labs.forEach((l, i) => {
    doc.addPage();

    // header band
    const bandH = 118;
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, W, bandH, "F");

    doc.setTextColor(232, 224, 250);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setCharSpace(1.5);
    doc.text(`${l.typeLabel.toUpperCase()}   ·   LAB ${i + 1} OF ${labs.length}`, M, 40);
    doc.setCharSpace(0);

    // status pill (top-right)
    const pill = l.catalogStatus;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    const pw = doc.getTextWidth(pill) + 20;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(W - M - pw, 26, pw, 18, 9, 9, "F");
    doc.setTextColor(...BRAND_DARK);
    doc.text(pill, W - M - pw + 10, 38.5);

    // title (white, up to 2 lines)
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    const titleLines = (doc.splitTextToSize(l.title, CW) as string[]).slice(0, 2);
    let ty = 72;
    for (const ln of titleLines) {
      doc.text(ln, M, ty);
      ty += 24;
    }

    // meta card
    y = bandH + 22;
    const fields: [string, string][] = [
      ["FY27 Solution Area", l.fy27Area || "—"],
      ["FY27 Solution Play", l.fy27Play || "—"],
      ["FY26 Solution Area", l.fy26Area || "—"],
      ["FY26 Solution Play", l.fy26Play || "—"],
      ["Level", l.level || "—"],
      ["Style", l.style || "—"],
      ["Duration", l.durationHours ? `${l.durationHours} hours` : "—"],
      ["Featured products", `${l.products.length} products`],
    ];
    const rowsN = 4;
    const colW = CW / 2;
    const rowH = 26;
    const cardH = rowsN * rowH + 16;
    doc.setFillColor(...TINT);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.7);
    doc.roundedRect(M, y, CW, cardH, 8, 8, "F");
    doc.roundedRect(M, y, CW, cardH, 8, 8, "S");

    fields.forEach(([k, v], idx) => {
      const col = idx < rowsN ? 0 : 1;
      const row = idx % rowsN;
      const cx = M + 14 + col * colW;
      const cy = y + 18 + row * rowH;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(...FAINT);
      doc.setCharSpace(0.8);
      doc.text(k.toUpperCase(), cx, cy);
      doc.setCharSpace(0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      const val = (doc.splitTextToSize(v, colW - 28) as string[])[0] ?? v;
      doc.text(val, cx, cy + 12);
    });
    y += cardH + 18;

    // tagline / hook
    if (l.hook) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10.5);
      doc.setTextColor(...BRAND_DARK);
      const hookLines = doc.splitTextToSize(l.hook, CW) as string[];
      for (const ln of hookLines) {
        ensure(14);
        doc.text(ln, M, y);
        y += 14;
      }
      y += 8;
    }

    // overview
    if (l.overview) {
      heading("Overview");
      para(l.overview);
      y += 6;
    }

    // modules (numbered, hanging indent)
    if (l.modules.length) {
      heading("Lab modules & exercises");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.7);
      l.modules.forEach((m, idx) => {
        const num = `${idx + 1}.`;
        const lines = doc.splitTextToSize(m, CW - 24) as string[];
        ensure(lines.length * 13.5 + 2);
        doc.setTextColor(...BRAND);
        doc.setFont("helvetica", "bold");
        doc.text(num, M, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...INK);
        lines.forEach((ln, j) => {
          doc.text(ln, M + 24, y + j * 13.5);
        });
        y += lines.length * 13.5 + 4;
      });
      y += 6;
    }

    // featured products
    if (l.products.length) {
      heading("Featured products");
      para(l.products.join(",  "), 9.5, MUT, 13.5);
    }
  });

  /* ── footers (page numbers + brand rule) ────────────────────────────── */
  const total = doc.getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.7);
    doc.line(M, H - 38, W - M, H - 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...FAINT);
    doc.text("Microsoft Sandbox · FY27 Lab Catalog", M, H - 24);
    doc.text(`${p - 1} / ${total - 1}`, W - M, H - 24, { align: "right" });
  }

  doc.save(`Microsoft-Sandbox-Catalog-${stamp()}.pdf`);
}
