import { useState } from "react";
import { Link } from "react-router-dom";
import { DefiningDistributionSection } from "@/components/charts/DefiningDistributionSection";
import { MainLayout } from "@/components/layout/MainLayout";
import { DetailModal } from "@/components/DetailModal";
import { SearchResultsPanel } from "@/components/SearchResultsPanel";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { DashboardDomainSummaries } from "@/components/dashboard/DashboardDomainSummaries";
import { FailureCaseDetailBody } from "@/components/FailureCaseDetailBody";
import { failureCaseToPromptText } from "@/lib/failureCasePrompt";
import { severityPillClass } from "@/lib/severityUi";
import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
} from "@/types/models";

function LiveStatCard({
  title,
  count,
  icon,
  tone,
  badge,
}: {
  title: string;
  count: number;
  icon: string;
  tone: "primary" | "error" | "secondary";
  badge: string;
}) {
  const toneIcon =
    tone === "primary"
      ? "bg-primary-fixed text-on-primary-fixed"
      : tone === "error"
        ? "bg-error-container text-on-error-container"
        : "bg-secondary-fixed text-on-secondary-fixed";
  const badgeCls =
    tone === "primary"
      ? "bg-primary-container text-primary-fixed-dim"
      : tone === "error"
        ? "bg-error text-on-error"
        : "bg-secondary-container text-on-secondary-container";

  return (
    <div className="relative min-h-[152px] overflow-hidden rounded-xl border border-slate-100/50 bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`absolute right-0 top-0 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-bl-2xl ${toneIcon}`}
      >
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div className="flex h-full min-h-[152px] flex-col justify-between p-6 pr-[4.75rem]">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeCls}`}
          >
            {badge}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface-variant">{title}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-on-surface">{count}</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">등록 건수</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { inspectionItems, failureCases, reliabilityStandards, loading, error } =
    useReliabilityDataContext();
  const [modalCase, setModalCase] = useState<FailureCase | null>(null);
  const [modalInspection, setModalInspection] = useState<InspectionItem | null>(
    null,
  );
  const [modalStandard, setModalStandard] = useState<ReliabilityStandard | null>(
    null,
  );

  function openFailure(c: FailureCase) {
    setModalInspection(null);
    setModalStandard(null);
    setModalCase(c);
  }

  function openInspection(i: InspectionItem) {
    setModalCase(null);
    setModalStandard(null);
    setModalInspection(i);
  }

  function openStandard(s: ReliabilityStandard) {
    setModalCase(null);
    setModalInspection(null);
    setModalStandard(s);
  }

  const updatedLabel = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <MainLayout>
      <SearchResultsPanel />
      {error ? (
        <p className="mb-4 text-sm text-error">데이터: {error}</p>
      ) : null}

      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="mb-1 text-3xl font-bold tracking-tight text-on-surface">
              신뢰성 통합 분석 현황
            </h2>
            <p className="text-on-surface-variant">
              시스템 내 실시간 등록 및 검증 데이터 요약
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-xs">update</span>
            최종 업데이트: {updatedLabel}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-on-surface-variant">불러오는 중…</p>
        ) : (
          <>
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-on-surface">실시간 등록 현황</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
                <LiveStatCard
                  title="부품별 점검항목 및 사내 표준"
                  count={inspectionItems.length}
                  icon="inventory_2"
                  tone="primary"
                  badge="LIVE"
                />
                <LiveStatCard
                  title="과거 실패사례 데이터베이스"
                  count={failureCases.length}
                  icon="report_problem"
                  tone="error"
                  badge="DB"
                />
                <LiveStatCard
                  title="부품 신뢰성 시험 표준 문서"
                  count={reliabilityStandards.length}
                  icon="science"
                  tone="secondary"
                  badge="STD"
                />
              </div>
            </section>

            <DefiningDistributionSection failureCases={failureCases} />

            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3 lg:gap-8">
              <div className="flex min-h-[min(520px,58vh)] flex-col lg:col-span-2">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100/80 bg-surface-container-lowest shadow-md ring-1 ring-slate-100/60">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-error-container/40 via-error-container/15 to-transparent px-5 py-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error-container text-on-error-container shadow-sm">
                        <span className="material-symbols-outlined text-[22px]">
                          report_problem
                        </span>
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold tracking-tight text-on-surface">
                          과거 실패 사례
                        </h3>
                        <p className="text-[11px] text-on-surface-variant">
                          실패 이력·원인 요약
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary-container px-3 py-1 text-xs font-bold tabular-nums text-secondary">
                      {failureCases.length}건
                    </span>
                  </div>
                  <div className="max-h-[min(calc(100vh-14rem),680px)] min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 pr-2">
                    {failureCases.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => openFailure(row)}
                        className="w-full cursor-pointer rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${severityPillClass(row.severity)}`}
                          >
                            {(row.severity ?? "미분류").toUpperCase()}
                          </span>
                          <span className="font-mono text-xs font-bold text-primary">{row.id}</span>
                          {row.productLine ? (
                            <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                              {row.productLine}
                            </span>
                          ) : null}
                        </div>
                        <h4 className="text-base font-bold text-on-surface">{row.title}</h4>
                        <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">
                          {row.partName ?? row.ssmDefining ?? "—"}
                        </p>
                      </button>
                    ))}
                    {failureCases.length === 0 ? (
                      <p className="py-8 text-center text-sm text-on-surface-variant">
                        등록된 실패 사례가 없습니다.
                      </p>
                    ) : null}
                    <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low/80 p-5">
                      <p className="text-[11px] font-bold tracking-widest text-primary">QUICK TIP</p>
                      <h4 className="mt-1 text-base font-bold text-on-surface">통합 검색 · 초성 검색</h4>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        상단 검색창에서 점검·실패 사례·시험 표준을 한 번에 찾을 수 있습니다.
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 bg-surface-container-low/50 px-4 py-3">
                    <Link
                      to="/failures"
                      className="flex items-center justify-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-primary-container"
                    >
                      상세 탭 이동
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex min-h-[min(520px,58vh)] flex-col gap-6 lg:col-span-1">
                <DashboardDomainSummaries
                  inspectionItems={inspectionItems}
                  reliabilityStandards={reliabilityStandards}
                  onSelectInspection={openInspection}
                  onSelectStandard={openStandard}
                />
                <div className="flex items-center justify-between rounded-2xl border border-slate-100/80 bg-surface-container-high px-6 py-5 shadow-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      System
                    </p>
                    <p className="text-sm font-bold text-on-surface">클라이언트 정상</p>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-6 w-1.5 animate-pulse rounded-full bg-primary" />
                    <div className="h-4 w-1.5 rounded-full bg-primary/60" />
                    <div className="h-8 w-1.5 rounded-full bg-primary/80" />
                    <div className="h-5 w-1.5 rounded-full bg-primary/40" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <DetailModal
        open={!!modalCase}
        onClose={() => setModalCase(null)}
        title={modalCase?.title ?? ""}
        aiSourceText={modalCase ? failureCaseToPromptText(modalCase) : ""}
      >
        {modalCase ? <FailureCaseDetailBody c={modalCase} /> : null}
      </DetailModal>

      <DetailModal
        open={!!modalInspection}
        onClose={() => setModalInspection(null)}
        title={modalInspection?.name ?? ""}
        aiSourceText={modalInspection ? inspectionItemToPrompt(modalInspection) : ""}
      >
        {modalInspection ? <DashboardInspectionModalBody item={modalInspection} /> : null}
      </DetailModal>

      <DetailModal
        open={!!modalStandard}
        onClose={() => setModalStandard(null)}
        title={modalStandard?.title ?? ""}
        aiSourceText={modalStandard ? standardToPrompt(modalStandard) : ""}
      >
        {modalStandard ? <DashboardStandardModalBody doc={modalStandard} /> : null}
      </DetailModal>
    </MainLayout>
  );
}

function inspectionItemToPrompt(i: InspectionItem): string {
  return [
    i.checkId && `점검 ID: ${i.checkId}`,
    `부품: ${i.name}`,
    i.partNumber && `품번: ${i.partNumber}`,
    i.grade && `등급: ${i.grade}`,
    i.internalStandard && `사내 표준: ${i.internalStandard}`,
    i.method && `방법: ${i.method}`,
    i.revisionDate && `개정일: ${i.revisionDate}`,
    i.socPrecision && `SOC 정밀도: ${i.socPrecision}`,
    i.insulationResistance && `절연 저항: ${i.insulationResistance}`,
    i.notes && `비고: ${i.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function standardToPrompt(s: ReliabilityStandard): string {
  return [
    s.id && `표준 ID: ${s.id}`,
    s.relatedDoc && `관련 규격/문서: ${s.relatedDoc}`,
    s.code && `코드: ${s.code}`,
    `제목: ${s.title}`,
    s.componentName && `부품·대상: ${s.componentName}`,
    s.testName && `시험명: ${s.testName}`,
    s.testCondition && `시험 조건:\n${s.testCondition}`,
    s.acceptanceCriteria && `합격 기준:\n${s.acceptanceCriteria}`,
    s.sampleSize && `시료 수량: ${s.sampleSize}`,
    s.section && `절: ${s.section}`,
    s.body && `본문:\n${s.body}`,
    s.safetyNotes && `안전 유의:\n${s.safetyNotes}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function DashboardInspectionModalBody({ item }: { item: InspectionItem }) {
  return (
    <div className="space-y-2 text-on-surface">
      <ModalField label="점검 ID" value={item.checkId ?? item.id} />
      <ModalField label="품번" value={item.partNumber} />
      <ModalField label="분류" value={item.category} />
      <ModalField label="Grade" value={item.grade} />
      <ModalField label="사내 표준" value={item.internalStandard} />
      <ModalField label="시험·검사 방법" value={item.method} />
      <ModalField label="개정일" value={item.revisionDate} />
      <ModalField label="SOC 정밀도" value={item.socPrecision} />
      <ModalField label="절연 저항" value={item.insulationResistance} />
      <ModalField label="비고" value={item.notes} />
    </div>
  );
}

function DashboardStandardModalBody({ doc }: { doc: ReliabilityStandard }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-on-surface">
      <p className="font-mono text-xs text-primary">
        {doc.relatedDoc ?? doc.code ?? doc.id}
      </p>
      <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
        {doc.componentName ? (
          <span className="rounded bg-surface-container-low px-2 py-1">
            부품·대상: {doc.componentName}
          </span>
        ) : null}
        {doc.sampleSize ? (
          <span className="rounded bg-surface-container-low px-2 py-1">
            시료: {doc.sampleSize}
          </span>
        ) : null}
        {doc.revision ? (
          <span className="rounded bg-surface-container-low px-2 py-1">
            개정: {doc.revision}
          </span>
        ) : null}
      </div>
      {doc.body?.trim() ? (
        <div className="space-y-3">
          {doc.body.split("\n\n").map((para, i) => (
            <p key={i} className="whitespace-pre-wrap text-justify">
              {para}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-on-surface-variant">본문이 없습니다.</p>
      )}
      {doc.safetyNotes?.trim() ? (
        <aside className="rounded-xl border border-error/25 bg-error-container/15 p-4">
          <h3 className="mb-2 text-xs font-bold text-error">안전·취급 유의사항</h3>
          <p className="whitespace-pre-wrap text-sm">{doc.safetyNotes.trim()}</p>
        </aside>
      ) : null}
    </div>
  );
}

function ModalField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-0.5 text-on-surface">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}
