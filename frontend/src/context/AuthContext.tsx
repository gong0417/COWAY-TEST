import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiUrl, fetchApiJson } from "@/lib/api";
import { isSupabaseAuthFrontend } from "@/lib/authProviderFrontend";
import {
  clearOfflineSession,
  isAuthOfflineMode,
  readOfflineSession,
  writeOfflineSession,
} from "@/lib/authMode";
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "@/lib/authToken";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export type AuthUser = {
  id: string;
  username: string;
  role: "admin" | "user";
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  bootstrapping: boolean;
  /** 서버 없이 로컬 세션만 쓰는지 (VITE_AUTH_OFFLINE) */
  authOffline: boolean;
  /** Supabase Auth 사용 여부 (VITE_USE_SUPABASE_AUTH) */
  supabaseAuth: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type MeResponse = { user: AuthUser };

const OFFLINE_REG_KEY = "rs_offline_reg_count";

function offlineSessionToUser(s: { username: string; role: "admin" | "user" }): AuthUser {
  return { id: "0", username: s.username, role: s.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const offline = isAuthOfflineMode();
  const supabaseAuth = !offline && isSupabaseAuthFrontend();

  const [token, setTokenState] = useState<string | null>(() => {
    if (offline) return null;
    if (supabaseAuth) return null;
    return getAuthToken();
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!offline) return null;
    const s = readOfflineSession();
    return s ? offlineSessionToUser(s) : null;
  });

  const [bootstrapping, setBootstrapping] = useState(() => {
    if (offline) return false;
    if (supabaseAuth) return true;
    return Boolean(getAuthToken());
  });

  useEffect(() => {
    if (offline) {
      const s = readOfflineSession();
      setUser(s ? offlineSessionToUser(s) : null);
      setBootstrapping(false);
    }
  }, [offline]);

  useEffect(() => {
    if (offline || !supabaseAuth) return;
    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setBootstrapping(false);
      return;
    }
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      const t = session?.access_token ?? null;
      if (t) setAuthToken(t);
      else clearAuthToken();
      setTokenState(t);
      if (!t) setUser(null);
    });
    return () => subscription.unsubscribe();
  }, [offline, supabaseAuth]);

  const loadMe = useCallback(async (t: string) => {
    const data = await fetchApiJson<MeResponse>("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${t}` },
    });
    setUser(data?.user ?? null);
  }, []);

  useEffect(() => {
    if (offline) return;
    if (!token) {
      setUser(null);
      setBootstrapping(false);
      return;
    }
    let cancelled = false;
    setBootstrapping(true);
    void (async () => {
      try {
        await loadMe(token);
      } catch {
        if (!cancelled) {
          clearAuthToken();
          setTokenState(null);
          setUser(null);
          if (supabaseAuth) {
            const sb = getSupabaseBrowserClient();
            await sb?.auth.signOut();
          }
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [offline, token, loadMe, supabaseAuth]);

  useEffect(() => {
    function onUnauthorized() {
      if (isAuthOfflineMode()) return;
      setTokenState(null);
      setUser(null);
    }
    window.addEventListener("rs-unauthorized", onUnauthorized);
    return () => window.removeEventListener("rs-unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      if (offline) {
        const u = username.trim().toLowerCase();
        if (!u) throw new Error("사용자 이름을 입력하세요.");
        if (!password) throw new Error("비밀번호를 입력하세요.");
        const session = { username: u, role: "admin" as const };
        writeOfflineSession(session);
        setUser(offlineSessionToUser(session));
        return;
      }
      if (supabaseAuth) {
        const sb = getSupabaseBrowserClient();
        if (!sb) {
          throw new Error(
            "Supabase 설정이 없습니다. .env에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 확인하세요.",
          );
        }
        const email = username.trim();
        if (!email) throw new Error("이메일을 입력하세요.");
        const { data, error } = await sb.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw new Error(error.message);
        const t = data.session?.access_token;
        if (!t) throw new Error("세션을 받지 못했습니다. 이메일 인증을 완료했는지 확인하세요.");
        setAuthToken(t);
        setTokenState(t);
        return;
      }
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try {
          const j = JSON.parse(text) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          /* keep text */
        }
        throw new Error(msg || `로그인 실패 (${res.status})`);
      }
      const body = JSON.parse(text) as { token: string; user: AuthUser };
      setAuthToken(body.token);
      setTokenState(body.token);
      setUser(body.user);
    },
    [offline, supabaseAuth],
  );

  const register = useCallback(
    async (username: string, password: string) => {
      if (offline) {
        const u = username.trim().toLowerCase();
        if (!u) throw new Error("사용자 이름을 입력하세요.");
        if (password.length < 8) {
          throw new Error("비밀번호는 8자 이상이어야 합니다.");
        }
        const n = Number(localStorage.getItem(OFFLINE_REG_KEY) || "0");
        const role = n === 0 ? ("admin" as const) : ("user" as const);
        localStorage.setItem(OFFLINE_REG_KEY, String(n + 1));
        const session = { username: u, role };
        writeOfflineSession(session);
        setUser(offlineSessionToUser(session));
        return;
      }
      if (supabaseAuth) {
        const sb = getSupabaseBrowserClient();
        if (!sb) {
          throw new Error(
            "Supabase 설정이 없습니다. .env에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 확인하세요.",
          );
        }
        const email = username.trim();
        if (!email) throw new Error("이메일을 입력하세요.");
        if (password.length < 6) {
          throw new Error("비밀번호는 Supabase 정책에 맞는 길이여야 합니다. (보통 6자 이상)");
        }
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw new Error(error.message);
        const t = data.session?.access_token;
        if (t) {
          setAuthToken(t);
          setTokenState(t);
        } else {
          throw new Error(
            "가입은 완료되었습니다. 이메일 확인 후 로그인하세요. (프로젝트에서 이메일 확인을 끈 경우 자동 로그인됩니다.)",
          );
        }
        return;
      }
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try {
          const j = JSON.parse(text) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          /* keep text */
        }
        throw new Error(msg || `가입 실패 (${res.status})`);
      }
      const body = JSON.parse(text) as { token: string; user: AuthUser };
      setAuthToken(body.token);
      setTokenState(body.token);
      setUser(body.user);
    },
    [offline, supabaseAuth],
  );

  const logout = useCallback(() => {
    if (offline) {
      clearOfflineSession();
      setUser(null);
      return;
    }
    if (supabaseAuth) {
      void getSupabaseBrowserClient()?.auth.signOut();
    }
    clearAuthToken();
    setTokenState(null);
    setUser(null);
  }, [offline, supabaseAuth]);

  const isAuthenticated = offline
    ? Boolean(user)
    : Boolean(token && user);

  const value = useMemo(
    () => ({
      user,
      token: offline ? null : token,
      isAuthenticated,
      bootstrapping: offline ? false : bootstrapping,
      authOffline: offline,
      supabaseAuth,
      login,
      register,
      logout,
    }),
    [
      user,
      token,
      offline,
      supabaseAuth,
      isAuthenticated,
      bootstrapping,
      login,
      register,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
