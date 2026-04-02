import { jsPDF } from "jspdf";
import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
} from "@/types/models";

function pdfEnsureSpace(
  pdf: jsPDF,
  y: number,
  margin: number,
  need: number,
): number {
  if (y + need > pdf.internal.pageSize.getHeight() - margin) {
    pdf.addPage();
    return margin;
  }
  return y;
}

function pdfWriteParagraphs(
  pdf: jsPDF,
  margin: number,
  pageW: number,
  yStart: number,
  text: string,
  lineHeight = 14,
): number {
  let y = yStart;
  const paras = text.split(/\n\n+/);
  for (const p of paras) {
    const lines = pdf.splitTextToSize(p.trim(), pageW);
    for (const line of lines) {
      y = pdfEnsureSpace(pdf, y, margin, lineHeight);
      pdf.text(line, margin, y);
      y += lineHeight;
    }
    y += 6;
  }
  return y;
}

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

export function downloadInspectionPdf(item: InspectionItem): void {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  pdf.setFontSize(9);
  pdf.setTextColor(0, 33, 63);
  pdf.text("부품 점검 및 사내 표준", margin, y);
  y += 16;

  pdf.setFontSize(10);
  pdf.setTextColor(0, 90, 140);
  pdf.text(item.checkId ?? item.id, margin, y);
  y += 18;

  pdf.setFontSize(16);
  pdf.setTextColor(24, 28, 30);
  const titleLines = pdf.splitTextToSize(item.name, pageW);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 20 + 8;

  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);
  const meta = [
    item.category && `분류: ${item.category}`,
    item.grade && `Grade: ${item.grade}`,
    item.partNumber && `품번: ${item.partNumber}`,
    item.revisionDate && `개정: ${item.revisionDate}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (meta) {
    pdf.text(meta, margin, y);
    y += 18;
  }

  pdf.setFontSize(11);
  pdf.setTextColor(0, 90, 140);
  y = pdfEnsureSpace(pdf, y, margin, 40);
  pdf.text("사내 표준", margin, y);
  y += 14;
  pdf.setTextColor(40, 40, 40);
  if (item.internalStandard?.trim()) {
    y = pdfWriteParagraphs(pdf, margin, pageW, y, item.internalStandard.trim());
  } else {
    pdf.text("—", margin, y);
    y += 16;
  }

  y += 6;
  pdf.setTextColor(0, 90, 140);
  y = pdfEnsureSpace(pdf, y, margin, 40);
  pdf.text("시험·검사 방법", margin, y);
  y += 14;
  pdf.setTextColor(40, 40, 40);
  if (item.method?.trim()) {
    y = pdfWriteParagraphs(pdf, margin, pageW, y, item.method.trim());
  } else {
    pdf.text("—", margin, y);
    y += 16;
  }

  y += 10;
  y = pdfEnsureSpace(pdf, y, margin, 50);
  pdf.setTextColor(0, 90, 140);
  pdf.text("주요 점검 항목", margin, y);
  y += 14;
  pdf.setTextColor(40, 40, 40);
  pdf.text(
    `SOC 정밀도: ${item.socPrecision?.trim() ? item.socPrecision : "—"}`,
    margin,
    y,
  );
  y += 14;
  pdf.text(
    `절연 저항: ${item.insulationResistance?.trim() ? item.insulationResistance : "—"}`,
    margin,
    y,
  );
  y += 14;

  if (item.notes?.trim()) {
    y += 6;
    pdf.setTextColor(0, 90, 140);
    y = pdfEnsureSpace(pdf, y, margin, 40);
    pdf.text("비고", margin, y);
    y += 14;
    pdf.setTextColor(40, 40, 40);
    y = pdfWriteParagraphs(pdf, margin, pageW, y, item.notes.trim());
  }

  const fname = `inspection_${(item.checkId ?? item.id).replace(/[^\w.-가-힣]+/g, "_")}.pdf`;
  pdf.save(fname);
}

export function downloadFailurePdf(c: FailureCase): void {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  pdf.setFontSize(9);
  pdf.setTextColor(0, 33, 63);
  pdf.text("과거 실패 사례", margin, y);
  y += 16;

  pdf.setFontSize(10);
  pdf.setTextColor(180, 40, 40);
  pdf.text(`${c.severity ?? "SSM"}  ·  ${c.id}`, margin, y);
  y += 18;

  pdf.setFontSize(16);
  pdf.setTextColor(24, 28, 30);
  const titleLines = pdf.splitTextToSize(c.title, pageW);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 20 + 8;

  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);
  const meta = [
    (c.ssmDefining ?? c.partName) && `정의 부품: ${c.ssmDefining ?? c.partName}`,
    c.productLine && `제품군: ${c.productLine}`,
    c.occurredAt && `발생일: ${c.occurredAt}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (meta) {
    pdf.text(meta, margin, y);
    y += 18;
  }

  const sections: { title: string; body?: string }[] = [
    { title: "고장 현상 (ssm.trouble)", body: c.summary ?? c.ssmTrouble },
    { title: "Stress", body: c.ssmStress },
    { title: "Strength", body: c.ssmStrength },
    { title: "Controlling", body: c.ssmControlling },
    { title: "재발 방지 대책", body: c.prevention },
    { title: "시험 항목", body: c.testItem },
    { title: "시험 기준", body: c.testCriteria },
  ];

  for (const { title, body } of sections) {
    if (!body?.trim()) continue;
    y += 8;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 90, 140);
    y = pdfEnsureSpace(pdf, y, margin, 40);
    pdf.text(title, margin, y);
    y += 14;
    pdf.setFontSize(11);
    pdf.setTextColor(40, 40, 40);
    y = pdfWriteParagraphs(pdf, margin, pageW, y, body.trim());
  }

  if (c.documentUrl?.trim()) {
    y += 10;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 90, 140);
    y = pdfEnsureSpace(pdf, y, margin, 40);
    pdf.text("관련 문서", margin, y);
    y += 14;
    pdf.setTextColor(40, 40, 40);
    if (c.documentTitle?.trim()) {
      y = pdfWriteParagraphs(pdf, margin, pageW, y, c.documentTitle.trim());
    }
    const urlLines = pdf.splitTextToSize(c.documentUrl.trim(), pageW);
    for (const line of urlLines) {
      y = pdfEnsureSpace(pdf, y, margin, 14);
      pdf.text(line, margin, y);
      y += 14;
    }
  }

  const fname = `failure_${c.id.replace(/[^\w.-가-힣]+/g, "_")}.pdf`;
  pdf.save(fname);
}

/**
 * 인쇄 시 `body.printing-detail-view`와 `[data-print-hide]`로 사이드·버튼 등을 숨깁니다.
 * (시험 표준 / 점검 / 실패 사례 공통)
 */
export function printDetailView(): void {
  document.body.classList.add("printing-detail-view");
  const done = () => {
    document.body.classList.remove("printing-detail-view");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

/** @deprecated `printDetailView`와 동일 (하위 호환) */
export const printStandardView = printDetailView;
