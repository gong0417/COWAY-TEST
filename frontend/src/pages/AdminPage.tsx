import { useCallback, useEffect, useState } from "react";
import { GenericPgTableAdmin } from "@/components/admin/GenericPgTableAdmin";
import { MainLayout } from "@/components/layout/MainLayout";
import { SearchResultsPanel } from "@/components/SearchResultsPanel";
import { useAuth } from "@/context/AuthContext";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { apiFetch } from "@/lib/api";
import { batchCreateInspectionItems } from "@/lib/inspectionBatchWrite";
import { parseInspectionWorkbook } from "@/lib/parseInspectionSpreadsheet";
import type { FileUploadRecord } from "@/types/models";

type AdminDataTarget = "inspection" | "ssm_cases" | "reliability_standards";

const TARGET_TABS: { id: AdminDataTarget; label: string; hint: string }[] = [
  {
    id: "inspection",
    label: "부품 점검",
    hint: "inspection_items.csv + inspection_overlay.json",
  },
  { id: "ssm_cases", label: "실패 사례", hint: "ssm.csv + ssm_overlay.json" },
  {
    id: "reliability_standards",
    label: "시험 표준",
    hint: "reliability_standards.csv + reliability_standards_overlay.json",
  },
];

export function AdminPage() {
  const { authOffline } = useAuth();
  const { apiReady, refetch, loading, error } = useReliabilityDataContext();
  const [uploads, setUploads] = useState<FileUploadRecord[]>([]);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [dataTarget, setDataTarget] = useState<AdminDataTarget>("inspection");
  const [tableReload, setTableReload] = useState(0);

  const bumpTableReload = useCallback(() => {
    setTableReload((n) => n + 1);
  }, []);

  const loadUploads = useCallback(async () => {
    if (authOffline) {
      setUploads([]);
      setUploadMsg(null);
      return;
    }
    try {
      const r = await apiFetch("/api/file-uploads");
      if (!r.ok) {
        setUploadMsg(`업로드 목록을 불러오지 못했습니다 (${r.status})`);
        return;
      }
      const data = (await r.json()) as FileUploadRecord[];
      setUploads(data);
    } catch (e) {
      setUploadMsg(
        e instanceof Error ? e.message : "업로드 목록 요청에 실패했습니다.",
      );
    }
  }, [authOffline]);

  useEffect(() => {
    void loadUploads();
  }, [loadUploads]);

  const uploadsForScope = useCallback((scope: string) => {
    return uploads.filter((u) => (u.scope ?? "inspection") === scope);
  }, [uploads]);

  const onFiles = useCallback(
    async (files: FileList | null, scope: string) => {
      if (!files?.length) return;
      if (authOffline) {
        setUploadMsg("오프라인 인증 모드에서는 파일 업로드 API를 사용할 수 없습니다.");
        return;
      }
      setUploading(true);
      setUploadMsg(null);
      try {
        const fd = new FormData();
        fd.append("scope", scope);
        for (const file of Array.from(files)) {
          fd.append("files", file);
        }
        const res = await apiFetch("/api/file-uploads", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `업로드 실패 (${res.status})`);
        }
        setUploadMsg("업로드가 완료되었습니다.");
        await loadUploads();
        await refetch();
        bumpTableReload();
      } catch (e) {
        setUploadMsg(e instanceof Error ? e.message : String(e));
      } finally {
        setUploading(false);
      }
    },
    [authOffline, loadUploads, refetch, bumpTableReload],
  );

  async function onSpreadsheetFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (authOffline) {
      setUploadMsg("오프라인 인증 모드에서는 일괄 등록 API를 사용할 수 없습니다.");
      return;
    }
    if (!apiReady) {
      setUploadMsg("백엔드 서버를 실행한 뒤 일괄 등록하세요.");
      return;
    }
    setBatchBusy(true);
    setUploadMsg(null);
    try {
      const buf = await file.arrayBuffer();
      const rows = parseInspectionWorkbook(buf, file.name);
      if (!rows.length) {
        setUploadMsg("시트에서 유효한 행을 찾지 못했습니다. 헤더(부품명 등)를 확인하세요.");
        return;
      }
      const { written } = await batchCreateInspectionItems(rows);
      setUploadMsg(`일괄 등록 완료: ${written}건 (${file.name})`);
      await refetch();
      bumpTableReload();
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBatchBusy(false);
    }
  }

  const uploadBundle = (scope: string, inputId: string) => ({
    inputId,
    scope,
    drag,
    setDrag,
    uploading,
    apiReady: apiReady && !authOffline,
    onFiles: (f: FileList | null) => void onFiles(f, scope),
    uploads: uploadsForScope(scope),
  });

  const inspectionBatchExtra = (
    <div className="space-y-2">
      <p className="text-sm font-bold text-primary">엑셀 / CSV → 일괄 저장</p>
      <p className="text-xs leading-relaxed text-on-surface-variant">
        첫 시트 · 1행 헤더(
        <span className="font-mono">
          부품명, 품번, 분류, 등급, SOC 정밀도, 절연 저항, 비고, 상태
        </span>
        ) · 기존{" "}
        <code className="rounded bg-surface-container-high px-1 text-[11px]">
          /api/inspection-items/batch
        </code>{" "}
        로 오버레이에 누적합니다. 목록은{" "}
        <code className="rounded bg-surface-container-high px-1 text-[11px]">
          GET /api/inspection_items
        </code>
        와 동일 소스를 반영합니다.
      </p>
      <button
        type="button"
        disabled={batchBusy || !apiReady || authOffline}
        onClick={() => document.getElementById("admin-sheet")?.click()}
        className="mt-1 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-lg">table_view</span>
        {batchBusy ? "처리 중…" : "스프레드시트 선택"}
      </button>
      <input
        id="admin-sheet"
        type="file"
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          void onSpreadsheetFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );

  return (
    <MainLayout>
      <SearchResultsPanel />
      <div className="mx-auto max-w-7xl space-y-8">
        {loading ? (
          <p className="text-sm text-on-surface-variant">컬렉션 불러오는 중…</p>
        ) : null}
        {error ? (
          <div
            className="flex flex-wrap items-center gap-3 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error"
            role="alert"
          >
            <span>데이터를 불러오지 못했습니다: {error}</span>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-md bg-error px-3 py-1 text-xs font-bold text-on-error hover:opacity-90"
            >
              다시 시도
            </button>
          </div>
        ) : null}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              데이터베이스 마스터 관리
            </h1>
            <p className="text-on-surface-variant">
              시스템 코어 데이터 동기화 및 부품 신뢰성 지표를 직접 관리합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
            >
              <span className="material-symbols-outlined text-xl">history</span>
              변경 이력
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("admin-pg-row-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-primary to-primary-container px-6 py-2.5 text-sm font-bold text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">save</span>
              행 추가 폼으로 이동
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-outline-variant/15 bg-surface-container-low p-2">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
            관리 데이터 선택
          </p>
          <div className="flex flex-wrap gap-2">
            {TARGET_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDataTarget(t.id)}
                className={[
                  "rounded-lg border px-4 py-2.5 text-left text-sm font-bold transition-colors",
                  dataTarget === t.id
                    ? "border-primary bg-primary text-on-primary shadow-sm"
                    : "border-transparent bg-surface-container-lowest text-on-surface hover:border-outline-variant/30",
                ].join(" ")}
              >
                <span className="block">{t.label}</span>
                <span
                  className={
                    dataTarget === t.id
                      ? "mt-0.5 block text-[10px] font-normal text-blue-100/90"
                      : "mt-0.5 block text-[10px] font-normal text-on-surface-variant"
                  }
                >
                  {t.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        {uploadMsg ? (
          <p className="mb-4 rounded-lg border border-primary/25 bg-primary-fixed/15 px-4 py-2 text-sm text-primary">
            {uploadMsg}
          </p>
        ) : null}

        {dataTarget === "inspection" ? (
          <GenericPgTableAdmin
            table="inspection_items"
            reloadSignal={tableReload}
            onNotify={setUploadMsg}
            onChanged={() => void refetch()}
            upload={uploadBundle("inspection", "admin-file-inspection")}
            sideExtra={inspectionBatchExtra}
          />
        ) : null}
        {dataTarget === "ssm_cases" ? (
          <GenericPgTableAdmin
            table="ssm_cases"
            reloadSignal={tableReload}
            onNotify={setUploadMsg}
            onChanged={() => void refetch()}
            upload={uploadBundle("ssm_cases", "admin-file-ssm")}
          />
        ) : null}
        {dataTarget === "reliability_standards" ? (
          <GenericPgTableAdmin
            table="reliability_standards"
            reloadSignal={tableReload}
            onNotify={setUploadMsg}
            onChanged={() => void refetch()}
            upload={uploadBundle("reliability_standards", "admin-file-rel")}
          />
        ) : null}
      </div>
    </MainLayout>
  );
}
