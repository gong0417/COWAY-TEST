import type { FailureCase } from "@/types/models";

function Row({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-on-surface">{value}</p>
    </div>
  );
}

export function FailureCaseDetailBody({ c }: { c: FailureCase }) {
  return (
    <div className="space-y-3 text-on-surface">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-bold text-primary">{c.id}</span>
        {c.productLine ? (
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-bold text-on-surface-variant">
            {c.productLine}
          </span>
        ) : null}
      </div>
      <Row label="정의 부품 (ssm.defining)" value={c.ssmDefining ?? c.partName} />
      <Row label="고장 현상 (ssm.trouble)" value={c.summary ?? c.ssmTrouble} />
      <Row label="Stress" value={c.ssmStress} />
      <Row label="Strength" value={c.ssmStrength} />
      <Row label="Controlling" value={c.ssmControlling} />
      <Row label="재발 방지 대책" value={c.prevention} />
      <Row label="시험 항목" value={c.testItem} />
      <Row label="시험 기준" value={c.testCriteria} />
      {c.documentUrl?.trim() ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            관련 문서
          </p>
          {c.documentTitle?.trim() ? (
            <p className="mt-0.5 text-sm">{c.documentTitle}</p>
          ) : null}
          <a
            href={c.documentUrl.trim()}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block break-all text-sm text-primary hover:underline"
          >
            {c.documentUrl.trim()}
          </a>
        </div>
      ) : null}
    </div>
  );
}
