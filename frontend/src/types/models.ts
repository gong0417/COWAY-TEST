export type DbRecordId = string;

/** 점검 항목 / 부품 마스터 */
export interface InspectionItem {
  id: DbRecordId;
  name: string;
  partNumber?: string;
  category?: string;
  /** 신뢰 등급 (예: S, A, B+, Warning) */
  grade?: string;
  socPrecision?: string;
  insulationResistance?: string;
  notes?: string;
  status?: "ok" | "warn" | "fail";
  updatedAt?: number;
  /** 점검 항목 ID (CSV/DB: checkId) */
  checkId?: string;
  /** 사내 표준 텍스트 (inspection_items.csv) */
  internalStandard?: string;
  /** 시험·검사 방법 */
  method?: string;
  /** 개정일 (YYYY-MM-DD 등) */
  revisionDate?: string;
}

/** 실패 사례 */
export interface FailureCase {
  id: DbRecordId;
  title: string;
  partName?: string;
  severity?: string;
  occurredAt?: string;
  summary?: string;
  rootCause?: string;
  /** SSM / ssm.csv 확장 필드 */
  ssmDefining?: string;
  ssmTrouble?: string;
  ssmStress?: string;
  ssmStrength?: string;
  ssmControlling?: string;
  prevention?: string;
  testItem?: string;
  testCriteria?: string;
  productLine?: string;
  documentTitle?: string;
  documentUrl?: string;
}

/** 시험 표준 (ISO/IEC 등) */
export interface ReliabilityStandard {
  id: DbRecordId;
  code?: string;
  title: string;
  body?: string;
  /** 안전·취급 유의사항 (본문과 분리 표기 시) */
  safetyNotes?: string;
  section?: string;
  revision?: string;
  /** reliability_standards.csv */
  componentName?: string;
  testName?: string;
  testCondition?: string;
  acceptanceCriteria?: string;
  sampleSize?: string;
  relatedDoc?: string;
}

export type SearchCategory = "inspection" | "failure" | "standard";

export interface UnifiedSearchHit {
  id: string;
  category: SearchCategory;
  label: string;
  subtitle?: string;
  raw: InspectionItem | FailureCase | ReliabilityStandard;
}

export interface FileUploadRecord {
  id: DbRecordId;
  fileName: string;
  url: string;
  createdAt: number;
}
