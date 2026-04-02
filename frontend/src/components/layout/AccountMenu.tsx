import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

/** Redmine 스타일: 계정 표시 · 내 계정 · 로그인/로그아웃 */
export function AccountMenu() {
  const { user, isLoggedIn, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const displayLabel = isLoggedIn ? user : "게스트";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[220px] items-center gap-2 rounded-md border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-left text-sm text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="material-symbols-outlined shrink-0 text-lg text-on-surface-variant">
          account_circle
        </span>
        <span className="min-w-0 flex-1 truncate">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-outline">
            계정
          </span>
          <span className="block truncate font-semibold text-on-surface">
            {displayLabel}
          </span>
        </span>
        <span className="material-symbols-outlined shrink-0 text-outline">
          expand_more
        </span>
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-outline">
              계정표시
            </p>
            <p className="truncate text-sm font-semibold text-on-surface">
              {isLoggedIn ? user : "로그인하지 않음"}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-on-surface hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              window.alert(
                "내 계정: 프로필·비밀번호 등은 추후 SSO/Redmine 연동 시 연결할 수 있습니다.",
              );
            }}
          >
            <span className="material-symbols-outlined text-lg text-on-surface-variant">
              person
            </span>
            내 계정
          </button>
          <div className="my-1 border-t border-slate-100" />
          {isLoggedIn ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error hover:bg-error-container/20"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              로그아웃
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-primary-fixed/20"
              onClick={() => {
                setOpen(false);
                login();
              }}
            >
              <span className="material-symbols-outlined text-lg">login</span>
              로그인
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
