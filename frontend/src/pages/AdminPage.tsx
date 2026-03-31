import { useCallback, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SearchResultsPanel } from "@/components/SearchResultsPanel";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { apiUrl } from "@/lib/api";
import { batchCreateInspectionItems } from "@/lib/inspectionBatchWrite";
import { parseInspectionWorkbook } from "@/lib/parseInspectionSpreadsheet";
import type { FileUploadRecord, InspectionItem } from "@/types/models";

const GRADE_OPTIONS = ["", "S", "A", "B+", "B", "Warning"] as const;

export function AdminPage() {
  const { inspectionItems, apiReady, refetch, loading, error } =
    useReliabilityDataContext();
  const [uploads, setUploads] = useState<FileUploadRecord[]>([]);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const [form, setForm] = useState<Partial<InspectionItem>>({
    name: "",
    partNumber: "",
    category: "",
    grade: "",
    socPrecision: "",
    insulationResistance: "",
    notes: "",
    status: "ok",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadUploads = useCallback(async () => {
    try {
      const r = await fetch(apiUrl("/api/file-uploads"));
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
  }, []);

  useEffect(() => {
    if (!apiReady) return;
    void loadUploads();
  }, [apiReady, loadUploads]);

  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      if (!apiReady) {
        setUploadMsg("백엔드 API가 준비된 뒤 업로드하세요.");
        return;
      }
      setUploading(true);
      setUploadMsg(null);
      try {
        const fd = new FormData();
        for (const file of Array.from(files)) {
          fd.append("files", file);
        }
        const res = await fetch(apiUrl("/api/file-uploads"), {
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
      } catch (e) {
        setUploadMsg(e instanceof Error ? e.message : String(e));
      } finally {
        setUploading(false);
      }
    },
    [apiReady, loadUploads, refetch],
  );

  async function saveMaster() {
    if (!apiReady || !form.name?.trim()) {
      setUploadMsg("이름을 입력하고 백엔드 서버를 실행했는지 확인하세요.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      partNumber: form.partNumber?.trim() || null,
      category: form.category?.trim() || null,
      grade: form.grade?.trim() || null,
      socPrecision: form.socPrecision?.trim() || null,
      insulationResistance: form.insulationResistance?.trim() || null,
      notes: form.notes?.trim() || null,
      status: form.status ?? "ok",
      updatedAt: Date.now(),
    };
    try {
      const res = editingId
        ? await fetch(apiUrl(`/api/inspection-items/${editingId}`), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(apiUrl("/api/inspection-items"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      setUploadMsg(editingId ? "수정되었습니다." : "추가되었습니다.");
      setForm({
        name: "",
        partNumber: "",
        category: "",
        grade: "",
        socPrecision: "",
        insulationResistance: "",
        notes: "",
        status: "ok",
      });
      setEditingId(null);
      await refetch();
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function removeMaster(id: string) {
    if (!apiReady) return;
    if (!confirm("삭제할까요?")) return;
    try {
      const res = await fetch(apiUrl(`/api/inspection-items/${id}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      setUploadMsg("삭제되었습니다.");
      await refetch();
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : String(e));
    }
  }

  function startEdit(row: InspectionItem) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      partNumber: row.partNumber,
      category: row.category,
      grade: row.grade ?? "",
      socPrecision: row.socPrecision,
      insulationResistance: row.insulationResistance,
      notes: row.notes,
      status: row.status ?? "ok",
    });
  }

  async function onSpreadsheetFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
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
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBatchBusy(false);
    }
  }

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
                  .getElementById("admin-master-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-primary to-primary-container px-6 py-2.5 text-sm font-bold text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">save</span>
              마스터 폼으로 이동
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 flex flex-col gap-4 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 lg:col-span-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
                <span className="material-symbols-outlined text-secondary">
                  upload_file
                </span>
                파일 / 대량 업로드
              </h2>
              <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                NAS
              </span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                void onFiles(e.dataTransfer.files);
              }}
              onClick={() => document.getElementById("admin-file")?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  document.getElementById("admin-file")?.click();
              }}
              className={[
                "flex flex-1 cursor-pointer flex-col items-center justify-center space-y-3 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center transition-all hover:border-primary group",
                drag ? "border-primary bg-primary-fixed/10" : "",
              ].join(" ")}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl text-primary">
                  cloud_upload
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-on-surface">
                  드래그하거나 클릭하여 업로드
                </p>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  Express · 로컬 data/uploads
                  <br />
                  {uploading ? "업로드 중…" : "여러 파일 선택 가능"}
                </p>
              </div>
              <input
                id="admin-file"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => void onFiles(e.target.files)}
              />
            </div>
            <div className="rounded-xl border border-dashed border-primary/35 bg-primary-fixed/15 p-4">
              <p className="text-sm font-bold text-primary">
                엑셀 / CSV → API 일괄 저장
              </p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                첫 번째 시트 · 1행 헤더(
                <span className="font-mono">부품명, 품번, 분류, 등급, SOC 정밀도, 절연 저항, 비고, 상태</span>
                ) · 서버에 JSON 오버레이로 누적
              </p>
              <button
                type="button"
                disabled={batchBusy || !apiReady}
                onClick={() => document.getElementById("admin-sheet")?.click()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-40"
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
            {uploadMsg ? (
              <p className="text-sm text-primary">{uploadMsg}</p>
            ) : null}
            {uploads.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {uploads.slice(0, 6).map((u) => (
                  <li key={u.id}>
                    <a
                      href={u.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {u.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="space-y-3 rounded-lg bg-white/40 p-4">
              <p className="flex items-center gap-1 text-xs font-bold text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">info</span>
                컬렉션
              </p>
              <p className="text-xs text-on-surface-variant">
                부품 마스터:{" "}
                <code className="rounded bg-surface-container-lowest px-1">
                  inspection_items
                </code>
                , 업로드 메타:{" "}
                <code className="rounded bg-surface-container-lowest px-1">
                  file_uploads
                </code>
              </p>
            </div>
          </div>

          <div className="col-span-12 flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm lg:col-span-8">
            <div className="flex items-center justify-between bg-surface-container-high px-6 py-4">
              <div className="flex gap-4">
                <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary">
                  부품 마스터
                </span>
                <span className="rounded-full px-4 py-1.5 text-xs font-bold text-on-surface-variant">
                  {inspectionItems.length}건
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-white"
                  aria-label="필터"
                >
                  <span className="material-symbols-outlined text-xl">
                    filter_list
                  </span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-outline-variant/20 bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      부품명
                    </th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      품번
                    </th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      등급
                    </th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      상태
                    </th>
                    <th className="w-32 px-6 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {inspectionItems.map((row, i) => (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-primary-fixed/20 ${i % 2 === 1 ? "bg-surface-container-low/30" : ""}`}
                    >
                      <td className="px-6 py-4 font-medium text-on-surface">
                        {row.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-primary">
                        {row.partNumber ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-on-surface">
                        {row.grade ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {row.status ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="p-1.5 text-on-surface-variant transition-colors hover:text-primary"
                          aria-label="편집"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeMaster(row.id)}
                          className="p-1.5 text-on-surface-variant transition-colors hover:text-error"
                          aria-label="삭제"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low px-6 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Total {inspectionItems.length} entries
              </p>
            </div>
          </div>
        </div>

        <section
          id="admin-master-form"
          className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6"
        >
          <h2 className="mb-4 text-base font-bold text-primary">
            부품 마스터 {editingId ? "수정" : "추가"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-xs text-on-surface-variant">
              부품명 *
              <input
                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block text-xs text-on-surface-variant">
              품번
              <input
                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                value={form.partNumber ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, partNumber: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs text-on-surface-variant">
              분류
              <input
                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                value={form.category ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs text-on-surface-variant">
              신뢰 등급 (Grade)
              <select
                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                value={form.grade ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g || "none"} value={g}>
                    {g || "(미지정)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-on-surface-variant">
              SOC 정밀도
              <input
                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                value={form.socPrecision ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, socPrecision: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs text-on-surface-variant md:col-span-2">
              절연 저항
              <input
                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                value={form.insulationResistance ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, insulationResistance: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs text-on-surface-variant md:col-span-2">
              비고
              <textarea
                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                rows={2}
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              상태
              <select
                className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                value={form.status ?? "ok"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as InspectionItem["status"],
                  }))
                }
              >
                <option value="ok">ok</option>
                <option value="warn">warn</option>
                <option value="fail">fail</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => void saveMaster()}
                disabled={!apiReady}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-40"
              >
                {editingId ? "수정 저장" : "추가"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      name: "",
                      partNumber: "",
                      category: "",
                      grade: "",
                      socPrecision: "",
                      insulationResistance: "",
                      notes: "",
                      status: "ok",
                    });
                  }}
                  className="text-sm text-on-surface-variant hover:text-on-surface"
                >
                  취소
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary">
            <span className="material-symbols-outlined pointer-events-none absolute -bottom-4 -right-4 rotate-12 text-9xl text-white/5">
              database
            </span>
            <div className="relative z-10">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-300">
                NAS API
              </h3>
              <p className="text-2xl font-bold">
                {loading
                  ? "…"
                  : error
                    ? "오류"
                    : apiReady
                      ? "연결됨"
                      : "미설정"}
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-outline-variant/20 bg-white p-6">
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                업로드 기록
              </h3>
              <p className="text-2xl font-bold text-on-surface">{uploads.length}</p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-outline-variant/20 bg-white p-6">
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                부품 마스터
              </h3>
              <p className="text-2xl font-bold text-on-surface">
                {inspectionItems.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
