import { type FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function LoginPage() {
  const { login, isAuthenticated, bootstrapping, authOffline } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from?.trim() || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loading = submitting || bootstrapping;

  if (!bootstrapping && isAuthenticated) {
    return <Navigate to={from.startsWith("/login") ? "/" : from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const u = username.trim().toLowerCase();
    if (!u) {
      setError("사용자 이름을 입력하세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력하세요.");
      return;
    }
    setSubmitting(true);
    try {
      await login(u, password);
      navigate(from.startsWith("/login") ? "/" : from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f0f3f7] px-4 py-10">
      {/* subtle backdrop */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,33,63,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-[#00213f]/[0.04] blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00213f]/60">
            RV-SYSTEM
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0f172a]">
            로그인
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            계정 정보를 입력하고 계속하세요.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_-12px_rgba(15,23,42,0.12)]">
          {authOffline ? (
            <div
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950"
              role="status"
            >
              <strong className="font-semibold">오프라인 개발 모드</strong>
              — 서버 없이 로그인됩니다. 나중에 연동하려면{" "}
              <code className="rounded bg-amber-100/80 px-1">.env</code>에서{" "}
              <code className="rounded bg-amber-100/80 px-1">
                VITE_AUTH_OFFLINE
              </code>
              를 제거하거나 <code className="rounded bg-amber-100/80 px-1">false</code>
              로 두세요.
            </div>
          ) : null}
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="space-y-5"
            aria-busy={loading}
            noValidate
          >
            <div className="space-y-1.5">
              <label
                htmlFor="login-username"
                className="text-xs font-semibold text-slate-600"
              >
                사용자 이름
              </label>
              <input
                id="login-username"
                type="text"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                aria-invalid={Boolean(error)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 focus:border-[#00213f]/30 focus:bg-white focus:ring-2 focus:ring-[#00213f]/15 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="username"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="text-xs font-semibold text-slate-600"
              >
                비밀번호
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                aria-invalid={Boolean(error)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 focus:border-[#00213f]/30 focus:bg-white focus:ring-2 focus:ring-[#00213f]/15 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <div
                className="flex gap-2.5 rounded-xl border border-red-200/90 bg-red-50/90 px-3.5 py-3 text-sm text-red-900"
                role="alert"
                aria-live="polite"
              >
                <span
                  className="material-symbols-outlined shrink-0 text-lg text-red-600"
                  aria-hidden
                >
                  error
                </span>
                <span className="min-w-0 leading-snug">{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00213f] text-sm font-semibold text-white shadow-sm transition-[opacity,transform,box-shadow] hover:bg-[#001a33] hover:shadow-md active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
            >
              {(submitting || bootstrapping) && (
                <span
                  className="material-symbols-outlined animate-spin text-lg"
                  aria-hidden
                >
                  progress_activity
                </span>
              )}
              {submitting
                ? "로그인 중…"
                : bootstrapping
                  ? "확인 중…"
                  : "로그인"}
            </button>
          </form>

          <p className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            계정이 없으신가요?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#00213f] underline-offset-2 hover:underline"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
