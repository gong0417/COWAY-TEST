import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
} from "@/types/models";

/** Map app `FailureCase` → PG/API row shape for admin table (ssm_cases). */
export function failureCasesToSsmTableRows(
  cases: FailureCase[],
): Record<string, unknown>[] {
  return cases.map((c) => ({
    ssm_id: c.id,
    ssm_defining: c.ssmDefining ?? c.partName ?? null,
    ssm_trouble: c.ssmTrouble ?? c.summary ?? c.title ?? null,
    ssm_stress: c.ssmStress ?? null,
    ssm_strength: c.ssmStrength ?? null,
    ssm_controling: c.ssmControlling ?? null,
    prevention: c.prevention ?? null,
    test_item: c.testItem ?? null,
    test_criteria: c.testCriteria ?? null,
    product_line: c.productLine ?? null,
    document_title: c.documentTitle ?? null,
    file_url: c.documentUrl ?? null,
  }));
}

/** Map app `ReliabilityStandard` → PG/API row shape (reliability_standards). */
export function reliabilityStandardsToTableRows(
  standards: ReliabilityStandard[],
): Record<string, unknown>[] {
  return standards.map((s) => ({
    standard_id: s.id,
    component_name: s.componentName ?? s.section ?? null,
    test_name: s.testName ?? null,
    test_condition: s.testCondition ?? null,
    acceptance_criteria: s.acceptanceCriteria ?? null,
    sample_size: s.sampleSize ?? null,
    related_doc: s.relatedDoc ?? s.code ?? null,
  }));
}

/** Map app `InspectionItem` → PG/API row shape (`inspection_items`). */
export function inspectionItemsToInsTableRows(
  items: InspectionItem[],
): Record<string, unknown>[] {
  return items.map((it) => ({
    check_id: it.id ?? it.checkId ?? "",
    category: it.category ?? null,
    inspection_item: it.name ?? null,
    internal_standard: it.internalStandard ?? null,
    method: it.method ?? null,
    revision_date: it.revisionDate ?? null,
  }));
}
