import type { FailureCase } from "@/types/models";

/** AI 요약·검색용 텍스트 (SSM CSV / Firestore 공통 스키마) */
export function failureCaseToPromptText(c: FailureCase): string {
  return [
    `SSM ID: ${c.id}`,
    `제목: ${c.title}`,
    c.productLine && `제품군: ${c.productLine}`,
    c.partName && `정의 부품(ssm.defining): ${c.partName}`,
    c.summary && `고장 현상(ssm.trouble): ${c.summary}`,
    c.rootCause && `원인 연결: ${c.rootCause}`,
    c.ssmStress && `Stress: ${c.ssmStress}`,
    c.ssmStrength && `Strength: ${c.ssmStrength}`,
    c.ssmControlling && `Controlling: ${c.ssmControlling}`,
    c.prevention && `재발 방지 대책: ${c.prevention}`,
    c.testItem && `시험 항목: ${c.testItem}`,
    c.testCriteria && `시험 기준: ${c.testCriteria}`,
    c.documentTitle && `관련 문서 제목: ${c.documentTitle}`,
    c.documentUrl && `파일/링크: ${c.documentUrl}`,
    c.severity && `구분: ${c.severity}`,
    c.occurredAt && `발생일: ${c.occurredAt}`,
  ]
    .filter(Boolean)
    .join("\n");
}
