import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ReliabilityTrendChart } from "@/components/charts/ReliabilityTrendChart";
import { MainLayout } from "@/components/layout/MainLayout";
import { DetailModal } from "@/components/DetailModal";
import { SearchResultsPanel } from "@/components/SearchResultsPanel";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import {
  buildMonthlyFailureSeries,
  defectExposurePercent,
} from "@/lib/failureTrendStats";
import { FailureCaseDetailBody } from "@/components/FailureCaseDetailBody";
import { failureCaseToPromptText } from "@/lib/failureCasePrompt";
import { severityPillClass } from "@/lib/severityUi";
import type { FailureCase } from "@/types/models";

export function DashboardPage() {
  const { inspectionItems, failureCases, reliabilityStandards, loading, error } =
    useReliabilityDataContext();
  const [modalCase, setModalCase] = useState<FailureCase | null>(null);

  const trendSeries = useMemo(
    () => buildMonthlyFailureSeries(failureCases, 6),
    [failureCases],
  );
  const exposurePct = useMemo(
    () => defectExposurePercent(inspectionItems, failureCases),
    [inspectionItems, failureCases],
  );

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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="group flex flex-col justify-between rounded-xl border border-slate-100/50 bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-primary-fixed p-3 text-on-primary-fixed">
                    <span className="material-symbols-outlined">inventory_2</span>
                  </div>
                  <span className="rounded bg-primary-container px-2 py-1 text-xs font-bold text-primary-fixed-dim">
                    LIVE
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-on-surface-variant">
                    부품별 점검항목 및 사내 표준
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-on-surface">
                      {inspectionItems.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="group flex flex-col justify-between rounded-xl border border-slate-100/50 bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-error-container p-3 text-on-error-container">
                    <span className="material-symbols-outlined">report_problem</span>
                  </div>
                  <span className="rounded bg-error px-2 py-1 text-xs font-bold text-on-error">
                    DB
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-on-surface-variant">
                    과거 실패사례 데이터베이스
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-on-surface">
                      {failureCases.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="group flex flex-col justify-between rounded-xl border border-slate-100/50 bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-secondary-fixed p-3 text-on-secondary-fixed">
                    <span className="material-symbols-outlined">science</span>
                  </div>
                  <span className="rounded bg-secondary-container px-2 py-1 text-xs font-bold text-on-secondary-container">
                    STANDARD
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-on-surface-variant">
                    부품 신뢰성 시험 표준 문서
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-on-surface">
                      {reliabilityStandards.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <ReliabilityTrendChart data={trendSeries} exposurePercent={exposurePct} />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 rounded-2xl bg-surface-container-low p-8 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-on-surface">
                    과거 이슈 부품 현황
                  </h3>
                  <Link
                    to="/failures"
                    className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                  >
                    전체보기
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </Link>
                </div>
                <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-surface-container-high/50">
                      <tr>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          SSM ID
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          이슈 / 정의 부품
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          제품군
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          구분
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {failureCases.map((row, i) => (
                        <tr
                          key={row.id}
                          className={`cursor-pointer transition-colors hover:bg-primary-fixed/10 ${i % 2 === 1 ? "bg-surface-container-low/30" : ""}`}
                          onClick={() => setModalCase(row)}
                        >
                          <td className="px-6 py-4 font-mono text-sm text-secondary">
                            {row.id.length > 14 ? `${row.id.slice(0, 12)}…` : row.id}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-on-surface">
                            {row.title}
                            {row.partName ? (
                              <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
                                {row.partName}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant">
                            {row.productLine ?? "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${severityPillClass(row.severity)}`}
                            >
                              {row.severity ?? "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {failureCases.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-on-surface-variant">
                      등록된 실패 사례가 없습니다.
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest/80 p-6">
                  <p className="text-[11px] font-bold tracking-widest text-primary">
                    QUICK TIP
                  </p>
                  <h4 className="mt-1 text-lg font-bold text-on-surface">
                    통합 검색 · 초성 검색
                  </h4>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    상단 검색창에서 점검·실패 사례·시험 표준을 한 번에 찾을 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-2xl border border-slate-100 bg-surface-container-lowest p-8 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      campaign
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-on-surface">
                      빠른 링크
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    <li>
                      <Link
                        to="/inspection"
                        className="block text-sm font-bold text-on-surface hover:text-primary"
                      >
                        부품 점검 및 내부 표준
                      </Link>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        벤토 그리드 카드 뷰
                      </p>
                    </li>
                    <li>
                      <Link
                        to="/failures"
                        className="block text-sm font-bold text-on-surface hover:text-primary"
                      >
                        과거 실패 사례
                      </Link>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        상세 분석 패널
                      </p>
                    </li>
                    <li>
                      <Link
                        to="/reliability"
                        className="block text-sm font-bold text-on-surface hover:text-primary"
                      >
                        부품 신뢰성 시험 표준
                      </Link>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        문서 뷰어
                      </p>
                    </li>
                  </ul>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-on-primary">
                  <div className="relative z-10">
                    <h3 className="mb-2 text-lg font-bold">신뢰성 가이드라인</h3>
                    <p className="mb-6 text-sm text-blue-100/70">
                      관리자 메뉴에서 마스터 데이터와 파일을 관리합니다.
                    </p>
                    <Link
                      to="/admin"
                      className="inline-block rounded-lg bg-white px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary-fixed"
                    >
                      관리자로 이동
                    </Link>
                  </div>
                  <span
                    className="material-symbols-outlined pointer-events-none absolute -bottom-10 -right-10 text-9xl opacity-20"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    shield_with_heart
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-surface-container-high p-6">
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
    </MainLayout>
  );
}
