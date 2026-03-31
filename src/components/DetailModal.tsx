import { useState, type ReactNode } from "react";
import { summarizeWithGemini } from "@/lib/gemini";

export function DetailModal({
  open,
  onClose,
  title,
  children,
  aiSourceText,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** AI 요약에 넘길 원문 */
  aiSourceText: string;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!open) return null;

  async function runAi() {
    setAiLoading(true);
    setAiError(null);
    setAiText(null);
    try {
      const out = await summarizeWithGemini(aiSourceText);
      setAiText(out);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-surface-container-lowest shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2
            id="detail-modal-title"
            className="text-base font-bold text-on-surface"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="max-h-[40vh] overflow-y-auto px-5 py-4 text-sm text-on-surface">
          {children}
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={runAi}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            {aiLoading ? "요약 중…" : "AI 요약"}
          </button>
          {aiError ? (
            <p className="mt-2 text-xs text-error">{aiError}</p>
          ) : null}
          {aiText ? (
            <div className="mt-3 whitespace-pre-wrap rounded-lg border border-primary/20 bg-primary-fixed/30 p-3 text-sm text-on-primary-fixed">
              {aiText}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
