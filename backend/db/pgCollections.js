/**
 * Load app collections from PostgreSQL (SELECT *) — same JSON shape as CSV parsers.
 */

function str(v) {
  if (v == null || v === "") return "";
  return String(v).trim();
}

function opt(s) {
  const t = str(s);
  return t === "" ? undefined : t;
}

function formatDate(d) {
  if (d == null) return undefined;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  const s = String(d);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export function mapSsmFromPg(row) {
  const id = str(row.ssm_id);
  const trouble = str(row.ssm_trouble);
  const defining = str(row.ssm_defining);
  const stress = str(row.ssm_stress);
  const strength = str(row.ssm_strength);
  const controlling = str(row.ssm_controling);
  const prevention = str(row.prevention);
  const testItem = str(row.test_item);
  const testCriteria = str(row.test_criteria);
  const productLine = str(row.product_line);
  const docTitle = str(row.document_title);
  const fileUrl = str(row.file_url);
  const rootParts = [stress, strength, controlling].filter(Boolean);
  const rootCause = rootParts.length ? rootParts.join(" → ") : undefined;
  return {
    id,
    title: trouble || defining || id,
    partName: opt(defining),
    severity: "SSM",
    summary: opt(trouble),
    rootCause,
    ssmDefining: opt(defining),
    ssmTrouble: opt(trouble),
    ssmStress: opt(stress),
    ssmStrength: opt(strength),
    ssmControlling: opt(controlling),
    prevention: opt(prevention),
    testItem: opt(testItem),
    testCriteria: opt(testCriteria),
    productLine: opt(productLine),
    documentTitle: opt(docTitle),
    documentUrl: opt(fileUrl),
  };
}

export function mapInspectionFromPg(row) {
  const checkId = str(row.check_id);
  const inspectionItem = str(row.inspection_item);
  const category = str(row.category);
  const internalStandard = str(row.internal_standard);
  const method = str(row.method);
  const revisionDate = formatDate(row.revision_date);
  return {
    id: checkId,
    checkId,
    name: inspectionItem || checkId,
    partNumber: checkId,
    category: opt(category),
    internalStandard: opt(internalStandard),
    method: opt(method),
    revisionDate,
    notes: [
      internalStandard && `사내 표준: ${internalStandard}`,
      method && `방법: ${method}`,
    ]
      .filter(Boolean)
      .join("\n"),
    status: "ok",
  };
}

export function mapStandardFromPg(row) {
  const standardId = str(row.standard_id);
  const componentName = str(row.component_name);
  const testName = str(row.test_name);
  const testCondition = str(row.test_condition);
  const acceptanceCriteria = str(row.acceptance_criteria);
  const sampleSize = str(row.sample_size);
  const relatedDoc = str(row.related_doc);
  const bodyParts = [
    testCondition && `시험 조건\n${testCondition}`,
    acceptanceCriteria && `합격 기준\n${acceptanceCriteria}`,
    sampleSize && `시료 수량\n${sampleSize}`,
  ].filter(Boolean);
  return {
    id: standardId,
    code: relatedDoc || standardId,
    title: testName
      ? `${testName}${componentName ? ` (${componentName})` : ""}`
      : componentName || standardId,
    section: opt(componentName),
    body: bodyParts.length ? bodyParts.join("\n\n") : undefined,
    componentName: opt(componentName),
    testName: opt(testName),
    testCondition: opt(testCondition),
    acceptanceCriteria: opt(acceptanceCriteria),
    sampleSize: opt(sampleSize),
    relatedDoc: opt(relatedDoc),
  };
}

/**
 * @param {import('pg').Pool} pool
 */
export async function loadCollectionsFromPool(pool) {
  const [ssm, ins, rel] = await Promise.all([
    pool.query(
      `SELECT ssm_id, ssm_defining, ssm_trouble, ssm_stress, ssm_strength, ssm_controling,
              prevention, test_item, test_criteria, product_line, document_title, file_url
       FROM ssm_cases ORDER BY ssm_id`,
    ),
    pool.query(
      `SELECT check_id, category, inspection_item, internal_standard, method, revision_date
       FROM inspection_items ORDER BY check_id`,
    ),
    pool.query(
      `SELECT standard_id, component_name, test_name, test_condition,
              acceptance_criteria, sample_size, related_doc
       FROM reliability_standards ORDER BY standard_id`,
    ),
  ]);
  return {
    failureCases: ssm.rows.map(mapSsmFromPg),
    inspectionItems: ins.rows.map(mapInspectionFromPg),
    reliabilityStandards: rel.rows.map(mapStandardFromPg),
  };
}
