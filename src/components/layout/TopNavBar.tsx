import { FuseSearchBar } from "@/components/FuseSearchBar";

export function TopNavBar() {
  return (
    <header
      data-print-hide
      className="fixed left-64 right-0 top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 px-8 backdrop-blur-md"
    >
      <div className="flex flex-1 items-center">
        <FuseSearchBar />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
          aria-label="알림"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
          aria-label="설정"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button
          type="button"
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
          aria-label="도움말"
        >
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </div>
    </header>
  );
}
