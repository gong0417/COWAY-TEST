import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const USER_RE = /^[a-z0-9_]{3,50}$/;

export function RegisterPage() {
  const { register, isAuthenticated, bootstrapping, authOffline } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!bootstrapping && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const u = username.trim().toLowerCase();
    if (!USER_RE.test(u)) {
      setError(
        "사용자 이름: 3~50자, 영문 소문자·숫자·밑줄(_)만 사용할 수 있습니다.",
      );
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== password2) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setSubmitting(true);
    try {
      await register(u, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-low px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-primary">회원가입</h1>
        <p className="mb-6 text-sm text-on-surface-variant">
          {authOffline ? (
            <>
              오프라인 모드: 브라우저에만 저장되며,{" "}
              <strong className="text-on-surface">첫 가입만 admin</strong>입니다.
            </>
          ) : (
            <>
              첫 가입자는 자동으로{" "}
              <strong className="text-on-surface">admin</strong> 역할이 부여됩니다.
            </>
          )}
        </p>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <label className="block text-xs font-bold text-on-surface-variant">
            사용자 이름
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm text-on-surface"
            />
          </label>
          <label className="block text-xs font-bold text-on-surface-variant">
            비밀번호 (8자 이상)
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm text-on-surface"
            />
          </label>
          <label className="block text-xs font-bold text-on-surface-variant">
            비밀번호 확인
            <input
              type="password"
              name="password2"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm text-on-surface"
            />
          </label>
          {error ? (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting || bootstrapping}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "처리 중…" : "가입하기"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
