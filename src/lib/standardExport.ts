import { jsPDF } from "jspdf";
import type { ReliabilityStandard } from "@/types/models";

export function downloadStandardPdf(doc: ReliabilityStandard): void {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  pdf.setFontSize(10);
  pdf.setTextColor(0, 33, 63);
  pdf.text(doc.code ?? "—", margin, y);
  y += 18;

  pdf.setFontSize(16);
  pdf.setTextColor(24, 28, 30);
  const titleLines = pdf.splitTextToSize(doc.title, pageW);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 20 + 8;

  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);
  const meta = [doc.section && `절: ${doc.section}`, doc.revision && `개정: ${doc.revision}`]
    .filter(Boolean)
    .join("  ·  ");
  if (meta) {
    pdf.text(meta, margin, y);
    y += 20;
  }

  pdf.setFontSize(11);
  pdf.setTextColor(40, 40, 40);
  if (doc.body?.trim()) {
    const paras = doc.body.split(/\n\n+/);
    for (const p of paras) {
      const lines = pdf.splitTextToSize(p.trim(), pageW);
      for (const line of lines) {
        if (y > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 14;
      }
      y += 6;
    }
  }

  if (doc.safetyNotes?.trim()) {
    y += 10;
    if (y > pdf.internal.pageSize.getHeight() - margin - 80) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(11);
    pdf.setTextColor(186, 26, 26);
    pdf.text("안전·취급 유의사항", margin, y);
    y += 16;
    pdf.setTextColor(40, 40, 40);
    const sn = pdf.splitTextToSize(doc.safetyNotes.trim(), pageW);
    for (const line of sn) {
      if (y > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += 14;
    }
  }

  const fname = `${(doc.code ?? "standard").replace(/[^\w.-가-힣]+/g, "_")}.pdf`;
  pdf.save(fname);
}

/** 인쇄 시 `body.printing-standard`와 `[data-print-hide]`로 레이아웃을 숨깁니다. */
export function printStandardView(): void {
  document.body.classList.add("printing-standard");
  const done = () => {
    document.body.classList.remove("printing-standard");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}
