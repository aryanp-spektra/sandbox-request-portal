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

/** "Last refreshed" label for the PDF meta rail. */
function refreshLabel(iso: string | null): string {
  if (!iso) return "New for Build 2026";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** Most offerings are hands-on; pure skilling content is the exception. */
function handsOnLabel(type: string): string {
  return type === "gps-skilling" ? "No" : "Yes";
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
   PDF — landscape "course one-pager", styled after the GPS skilling-catalog
   slide: a brand header bar (breadcrumb + status), a left title/meta panel,
   and a right side with section-header bars + a multi-column module agenda.
   One lab per landscape page. Our terminology, our FY27 data.
   ════════════════════════════════════════════════════════════════════════ */

// CloudLabs brand palette — exact sRGB of the violet design tokens.
const BRAND: [number, number, number] = [98, 86, 206];
const BRAND_DARK: [number, number, number] = [77, 60, 179];
const BRAND_DEEP: [number, number, number] = [50, 40, 119];
const PURPLE_LIGHT: [number, number, number] = [153, 150, 255];
const INK: [number, number, number] = [26, 26, 32];
const MUT: [number, number, number] = [110, 110, 128];
const FAINT: [number, number, number] = [150, 150, 165];
const LINE: [number, number, number] = [228, 226, 236];
const TINT: [number, number, number] = [247, 246, 252];

/** Load an image (PNG/WEBP) and return a PNG data URL + natural size.
 *  Returns null if it can't load, so the PDF still renders without the logo. */
async function loadImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("img load failed"));
      img.src = url;
    });
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return { data: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight };
  } catch {
    return null;
  }
}

const LOGO_WHITE = "/CloudLabs-with-SS-white-Full-1024x346-1-768x260-1.png";
const LOGO_MARK = "/cl-light-mode-small.png";

type ImgData = { data: string; w: number; h: number } | null;
// Minimal structural type for the jsPDF instance we use (avoids an any-cast).
type Doc = import("jspdf").jsPDF;

export async function exportPDF(labs: Lab[], label = "Full catalog") {
  const { jsPDF } = await import("jspdf");
  const [logoWhite, logoMark] = await Promise.all([loadImage(LOGO_WHITE), loadImage(LOGO_MARK)]);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(); // ~842
  const H = doc.internal.pageSize.getHeight(); // ~595
  const M = 36;

  drawCover(doc, labs.length, label, W, H, M, logoWhite);

  labs.forEach((l, i) => {
    doc.addPage("a4", "landscape");
    drawLabPage(doc, l, i, labs.length, W, H, M);
  });

  drawFooters(doc, W, H, M, logoMark);
  doc.save(`Microsoft-Sandbox-Catalog-${stamp()}.pdf`);
}

/* ── cover ──────────────────────────────────────────────────────────────── */
function drawCover(
  doc: Doc, count: number, label: string, W: number, H: number, M: number, logoWhite: ImgData
) {
  doc.setFillColor(...BRAND_DEEP);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...BRAND);
  doc.circle(W + 20, -30, 260, "F");
  doc.setFillColor(...BRAND_DARK);
  doc.circle(-40, H + 30, 200, "F");

  if (logoWhite) {
    const lw = 210;
    doc.addImage(logoWhite.data, "PNG", M, 78, lw, (lw * logoWhite.h) / logoWhite.w, "logoWhite", "FAST");
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setCharSpace(3);
  doc.text("MICROSOFT SANDBOX", M, 300);
  doc.setCharSpace(0);

  doc.setFontSize(46);
  doc.text("FY27 Lab Catalog", M, 350);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(220, 214, 248);
  doc.text(
    doc.splitTextToSize(
      "Guided labs, hackathons and sandboxes across AI, cloud and security — the complete FY27 program, one course per page.",
      W * 0.62
    ),
    M,
    386
  );

  doc.setDrawColor(...PURPLE_LIGHT);
  doc.setLineWidth(1);
  doc.line(M, 442, M + 150, 442);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(235, 230, 250);
  doc.text(`${count} labs   ·   ${label}   ·   Exported ${stamp()}`, M, 466);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(198, 190, 232);
  doc.text("Powered by CloudLabs — Spektra Systems", M, H - 44);
}

/* ── one landscape page per lab ─────────────────────────────────────────── */
function drawLabPage(doc: Doc, l: Lab, i: number, total: number, W: number, H: number, M: number) {
  const HB = 56; // header band height
  const bodyTop = HB + 20;
  const bodyBot = H - 28;
  const LEFT_W = 214;
  const GAP = 22;
  const leftX = M;
  const rightX = M + LEFT_W + GAP;
  const rightW = W - M - rightX;

  /* ── header band ─────────────────────────────────────────────────────── */
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, HB, "F");
  doc.setFillColor(...BRAND_DARK);
  doc.circle(W - 24, -20, 90, "F");

  // left: offering eyebrow + breadcrumb
  doc.setTextColor(232, 224, 250);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setCharSpace(1.5);
  doc.text(`MICROSOFT SANDBOX  ·  ${l.typeLabel.toUpperCase()}`, M, 23);
  doc.setCharSpace(0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(214, 206, 244);
  const crumb = ["Home", l.fy27Area, l.fy27Play].filter(Boolean).join("   >   ");
  doc.text((doc.splitTextToSize(crumb, W * 0.62) as string[])[0], M, 41);

  // right: status pill + "Lab i of N"
  const pill = l.catalogStatus;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const pw = doc.getTextWidth(pill) + 22;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(W - M - pw, 14, pw, 19, 9.5, 9.5, "F");
  doc.setTextColor(...BRAND_DARK);
  doc.text(pill, W - M - pw + 11, 26.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(214, 206, 244);
  doc.text(`Lab ${i + 1} of ${total}`, W - M, 46, { align: "right" });

  /* ── left panel: title + hook + meta + products ──────────────────────── */
  doc.setFillColor(...TINT);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.7);
  doc.roundedRect(leftX, bodyTop, LEFT_W, bodyBot - bodyTop, 9, 9, "F");
  doc.roundedRect(leftX, bodyTop, LEFT_W, bodyBot - bodyTop, 9, 9, "S");

  const lpad = 16;
  const lx = leftX + lpad;
  const lw = LEFT_W - lpad * 2;
  let ly = bodyTop + 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  for (const ln of (doc.splitTextToSize(l.title, lw) as string[]).slice(0, 5)) {
    doc.text(ln, lx, ly);
    ly += 18;
  }
  ly += 2;

  if (l.hook) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.6);
    doc.setTextColor(...BRAND_DARK);
    for (const ln of (doc.splitTextToSize(l.hook, lw) as string[]).slice(0, 4)) {
      doc.text(ln, lx, ly);
      ly += 11;
    }
  }
  ly += 8;
  doc.setDrawColor(...LINE);
  doc.line(lx, ly, lx + lw, ly);
  ly += 16;

  const fields: [string, string][] = [
    ["Duration", l.durationHours ? `${l.durationHours} hours` : "—"],
    ["Level", l.level || "All levels"],
    ["Hands-on Labs", handsOnLabel(l.type)],
    ["Delivery Format", l.style || "—"],
    ["Modules", String(l.modules.length)],
    ["Last refreshed", refreshLabel(l.lastRefresh)],
  ];

  fields.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.6);
    doc.setTextColor(...FAINT);
    doc.setCharSpace(0.6);
    doc.text(k.toUpperCase(), lx, ly);
    doc.setCharSpace(0);
    ly += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    doc.setTextColor(...INK);
    for (const ln of doc.splitTextToSize(v, lw) as string[]) {
      doc.text(ln, lx, ly);
      ly += 10.5;
    }
    ly += 7;
  });

  /* ── right side: section bars + multi-column agenda ──────────────────── */
  let ry = bodyTop;
  const bar = (title: string) => {
    doc.setFillColor(...BRAND);
    doc.roundedRect(rightX, ry, rightW, 17, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setCharSpace(0.8);
    doc.text(title.toUpperCase(), rightX + 9, ry + 11.5);
    doc.setCharSpace(0);
    ry += 17 + 12;
  };

  if (l.overview) {
    bar("About this lab");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.7);
    doc.setTextColor(...INK);
    for (const ln of (doc.splitTextToSize(l.overview, rightW) as string[]).slice(0, 6)) {
      doc.text(ln, rightX, ry);
      ry += 11.5;
    }
    ry += 12;
  }

  if (l.modules.length) {
    bar("What you'll cover");
    const agendaTop = ry;
    const maxY = bodyBot - 32; // leave room for the products section
    const cols = l.modules.length > 6 ? 3 : 2;
    const colGap = 14;
    const colW = (rightW - colGap * (cols - 1)) / cols;
    let col = 0;
    let cx = rightX;
    let cy = agendaTop;
    let maxColY = agendaTop;

    l.modules.forEach((m, idx) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.4);
      const lines = doc.splitTextToSize(m, colW - 38) as string[];
      const cardH = Math.max(30, 13 + lines.length * 11 + 8);
      if (cy + cardH > maxY && col < cols - 1) {
        col += 1;
        cx = rightX + col * (colW + colGap);
        cy = agendaTop;
      }
      // module card
      doc.setFillColor(...TINT);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.7);
      doc.roundedRect(cx, cy, colW, cardH, 6, 6, "F");
      doc.roundedRect(cx, cy, colW, cardH, 6, 6, "S");
      // numbered disc
      doc.setFillColor(...BRAND);
      doc.circle(cx + 16, cy + 16, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(String(idx + 1), cx + 16, cy + 19, { align: "center" });
      // module text
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.4);
      lines.forEach((ln, j) => doc.text(ln, cx + 30, cy + 16 + j * 11));
      cy += cardH + 9;
      if (cy > maxColY) maxColY = cy;
    });
    ry = maxColY + 6;
  }

  if (l.products.length && ry + 52 < bodyBot) {
    bar("Featured products");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    const chipH = 17;
    const chipGap = 7;
    let px = rightX;
    let py = ry;
    for (const p of l.products) {
      const cw = doc.getTextWidth(p) + 18;
      if (px + cw > rightX + rightW) {
        px = rightX;
        py += chipH + chipGap;
      }
      if (py + chipH > bodyBot) break;
      doc.setFillColor(...TINT);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.7);
      doc.roundedRect(px, py, cw, chipH, 8.5, 8.5, "F");
      doc.roundedRect(px, py, cw, chipH, 8.5, 8.5, "S");
      doc.setTextColor(...MUT);
      doc.text(p, px + 9, py + 11.5);
      px += cw + chipGap;
    }
  }
}

/* ── footers (CloudLabs mark + page numbers + brand rule) ───────────────── */
function drawFooters(doc: Doc, W: number, H: number, M: number, logoMark: ImgData) {
  const total = doc.getNumberOfPages();
  const markH = 12;
  const markW = logoMark ? (markH * logoMark.w) / logoMark.h : 0;
  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.7);
    doc.line(M, H - 22, W - M, H - 22);
    let fx = M;
    if (logoMark) {
      doc.addImage(logoMark.data, "PNG", fx, H - 17, markW, markH, "logoMark", "FAST");
      fx += markW + 7;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...FAINT);
    doc.text("Microsoft Sandbox · FY27 Lab Catalog", fx, H - 8);
    doc.text(`${p - 1} / ${total - 1}`, W - M, H - 8, { align: "right" });
  }
}
