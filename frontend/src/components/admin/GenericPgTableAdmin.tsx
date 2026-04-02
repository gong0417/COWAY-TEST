import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AdminUploadPanel } from "@/components/admin/AdminUploadPanel";
import { useAuth } from "@/context/AuthContext";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { apiFetch } from "@/lib/api";
import { friendlyApiMessage } from "@/lib/apiFriendlyError";
import {
  failureCasesToSsmTableRows,
  inspectionItemsToInsTableRows,
  reliabilityStandardsToTableRows,
} from "@/lib/adminOfflineRows";
import type { FileUploadRecord } from "@/types/models";

export type AdminPgTableName =
  | "ssm_cases"
  | "reliability_standards"
  | "inspection_items";

const TABLE_PK: Record<AdminPgTableName, string> = {
  ssm_cases: "ssm_id",
  reliability_standards: "standard_id",
  inspection_items: "check_id",
};

type UploadBundle = {
  inputId: string;
  scope: string;
  drag: boolean;
  setDrag: (v: boolean) => void;
  uploading: boolean;
  apiReady: boolean;
  onFiles: (files: FileList | null) => void;
  uploads: FileUploadRecord[];
};

export function GenericPgTableAdmin({
  table,
  onNotify,
  onChanged,
  upload,
  reloadSignal = 0,
  sideExtra,
}: {
  table: AdminPgTableName;
  onNotify: (msg: string | null) => void;
  onChanged: () => void;
  upload: UploadBundle;
  /** 부모에서 refetch 후 목록만 다시 읽을 때 증가 */
  reloadSignal?: number;
  sideExtra?: ReactNode;
}) {
  const { authOffline } = useAuth();
  const { failureCases, reliabilityStandards, inspectionItems } =
    useReliabilityDataContext();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [listHint, setListHint] = useState<string | null>(null);

  const pk = TABLE_PK[table];

  const load = useCallback(async () => {
    setLoading(true);
    setListHint(null);
    if (authOffline) {
      try {
        const fromContext =
          table === "ssm_cases"
            ? failureCasesToSsmTableRows(failureCases)
            : table === "reliability_standards"
              ? reliabilityStandardsToTableRows(reliabilityStandards)
              : inspectionItemsToInsTableRows(inspectionItems);
        setRows(fromContext);
        setListHint(
          "오프라인 인증 모드입니다. 목록은 앱과 동일한 로컬 CSV 데이터이며, 서버 추가·삭제·업로드는 할 수 없습니다.",
        );
      } catch {
        setRows([]);
        setListHint("로컬 데이터를 표시하지 못했습니다.");
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      const r = await apiFetch(`/api/${table}`);
      const t = await r.text();
      if (!r.ok) {
        setRows([]);
        setListHint(friendlyApiMessage(r.status, t));
        return;
      }
      setRows(JSON.parse(t) as Record<string, unknown>[]);
    } catch {
      setRows([]);
      setListHint("네트워크 오류로 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [authOffline, table, failureCases, reliabilityStandards, inspectionItems]);

  useEffect(() => {
    void load();
  }, [load, reloadSignal]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (authOffline) {
      onNotify("오프라인 인증 모드에서는 서버에 행을 추가할 수 없습니다.");
      return;
    }
    const id = form[pk]?.trim();
    if (!id) {
      onNotify(`${pk} 값은 필수입니다.`);
      return;
    }
    setBusy(true);
    onNotify(null);
    try {
      const body: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(form)) {
        const s = v.trim();
        body[k] = s === "" ? null : s;
      }
      body[pk] = id;
      const r = await apiFetch(`/api/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const txt = await r.text();
      if (!r.ok) {
        onNotify(friendlyApiMessage(r.status, txt));
        return;
      }
      onNotify("행이 추가되었습니다.");
      setForm({});
      await load();
      onChanged();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(id: string) {
    if (authOffline) {
      onNotify("오프라인 인증 모드에서는 서버에서 삭제할 수 없습니다.");
      return;
    }
    if (!confirm(`삭제할까요? (${id})`)) return;
    setBusy(true);
    onNotify(null);
    try {
      const r = await apiFetch(`/api/${table}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const txt = await r.text();
      if (!r.ok) {
        onNotify(friendlyApiMessage(r.status, txt));
        return;
      }
      onNotify("삭제되었습니다.");
      await load();
      onChanged();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const title =
    table === "ssm_cases"
      ? "SSM 실패 사례 (ssm_cases)"
      : table === "reliability_standards"
        ? "신뢰성 시험 표준 (reliability_standards)"
        : "부품 점검 마스터 (inspection_items)";

  const formFields: { key: string; label: string; required?: boolean }[] =
    table === "ssm_cases"
      ? [
          { key: "ssm_id", label: "SSM ID *", required: true },
          { key: "ssm_defining", label: "정의 부품" },
          { key: "ssm_trouble", label: "고장 현상" },
          { key: "product_line", label: "제품군" },
          { key: "ssm_stress", label: "ssm.stress" },
          { key: "ssm_strength", label: "ssm.strength" },
          { key: "ssm_controling", label: "ssm.controling" },
          { key: "prevention", label: "재발 방지" },
          { key: "test_item", label: "시험 항목" },
          { key: "test_criteria", label: "시험 기준" },
          { key: "document_title", label: "문서 제목" },
          { key: "file_url", label: "파일 URL" },
        ]
      : table === "reliability_standards"
        ? [
            { key: "standard_id", label: "standard_id *", required: true },
            { key: "component_name", label: "부품명" },
            { key: "test_name", label: "시험명" },
            { key: "test_condition", label: "시험 조건" },
            { key: "acceptance_criteria", label: "합격 기준" },
            { key: "sample_size", label: "시료 수" },
            { key: "related_doc", label: "관련 문서" },
          ]
        : [
            { key: "check_id", label: "check_id *", required: true },
            { key: "category", label: "분류" },
            { key: "inspection_item", label: "점검 항목(표시명)" },
            { key: "internal_standard", label: "사내 표준" },
            { key: "method", label: "방법" },
            { key: "revision_date", label: "개정일 (YYYY-MM-DD)" },
          ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 flex flex-col gap-4 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 lg:col-span-4">
          <AdminUploadPanel
            title="파일 업로드"
            scope={upload.scope}
            inputId={upload.inputId}
            drag={upload.drag}
            setDrag={upload.setDrag}
            uploading={upload.uploading}
            apiReady={upload.apiReady && !authOffline}
            onPickFiles={() => document.getElementById(upload.inputId)?.click()}
            onFiles={upload.onFiles}
            uploads={upload.uploads}
          />
          <div className="rounded-lg bg-white/40 p-4 text-xs text-on-surface-variant">
            <p className="font-bold text-on-surface">안내</p>
            <p className="mt-1">
              PostgreSQL가 없으면 <code className="rounded bg-surface-container-lowest px-1">data/</code>{" "}
              CSV와 <code className="rounded bg-surface-container-lowest px-1">data/_state/</code>{" "}
              JSON 오버레이로 목록·추가·삭제가 동작합니다. NAS·PG 연동 시 서버 설정만 바꾸면 됩니다.
            </p>
          </div>
          {sideExtra ? (
            <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4">
              {sideExtra}
            </div>
          ) : null}
        </div>

        <div className="col-span-12 flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm lg:col-span-8">
          <div className="flex items-center justify-between bg-surface-container-high px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary">
                등록 목록
              </span>
              <span className="rounded-full px-4 py-1.5 text-xs font-bold text-on-surface-variant">
                {loading ? "…" : `${rows.length}건`}
              </span>
            </div>
          </div>
          {listHint ? (
            <div className="border-b border-outline-variant/15 bg-amber-50 px-6 py-4 text-sm text-amber-950">
              {listHint}
            </div>
          ) : null}
          <div className="max-h-[min(480px,55vh)] overflow-auto">
            {loading ? (
              <p className="p-6 text-sm text-on-surface-variant">불러오는 중…</p>
            ) : (
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      ID
                    </th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      요약
                    </th>
                    <th className="w-28 px-6 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {rows.map((row, i) => {
                    const id = String(row[pk] ?? "");
                    const summary =
                      table === "ssm_cases"
                        ? String(row.ssm_trouble ?? row.ssm_defining ?? "—")
                        : table === "reliability_standards"
                          ? String(row.test_name ?? row.component_name ?? "—")
                          : String(
                              row.inspection_item ?? row.category ?? "—",
                            );
                    return (
                      <tr
                        key={id}
                        className={`transition-colors hover:bg-primary-fixed/15 ${i % 2 === 1 ? "bg-surface-container-low/40" : ""}`}
                      >
                        <td className="px-6 py-4 font-mono text-xs">{id}</td>
                        <td className="max-w-md truncate px-6 py-4">{summary}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            disabled={busy || Boolean(listHint)}
                            onClick={() => void removeRow(id)}
                            className="text-error hover:underline disabled:opacity-40"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!loading && rows.length === 0 && !listHint ? (
              <p className="p-6 text-center text-sm text-on-surface-variant">행이 없습니다.</p>
            ) : null}
          </div>
          <div className="border-t border-outline-variant/10 bg-surface-container-low px-6 py-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              {title}
            </p>
          </div>
        </div>
      </div>

      <form
        id="admin-pg-row-form"
        onSubmit={(e) => void submit(e)}
        className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm"
      >
        <h3 className="mb-4 text-base font-bold text-primary">행 추가 (로컬 오버레이 또는 PostgreSQL)</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {formFields.map((f) => (
            <label key={f.key} className="block text-xs text-on-surface-variant">
              {f.label}
              <input
                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface"
                value={form[f.key] ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                required={f.required === true}
              />
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={busy || Boolean(listHint)}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-40"
        >
          {busy ? "처리 중…" : "추가"}
        </button>
      </form>
    </div>
  );
}
