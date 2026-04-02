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

export type AuthUser = {
  id: number;
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
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type MeResponse = { user: AuthUser };

const OFFLINE_REG_KEY = "rs_offline_reg_count";

function offlineSessionToUser(s: { username: string; role: "admin" | "user" }): AuthUser {
  return { id: 0, username: s.username, role: s.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const offline = isAuthOfflineMode();

  const [token, setTokenState] = useState<string | null>(() =>
    offline ? null : getAuthToken(),
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!offline) return null;
    const s = readOfflineSession();
    return s ? offlineSessionToUser(s) : null;
  });

  const [bootstrapping, setBootstrapping] = useState(
    () => !offline && Boolean(getAuthToken()),
  );

  useEffect(() => {
    if (offline) {
      const s = readOfflineSession();
      setUser(s ? offlineSessionToUser(s) : null);
      setBootstrapping(false);
    }
  }, [offline]);

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
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [offline, token, loadMe]);

  useEffect(() => {
    function onUnauthorized() {
      if (isAuthOfflineMode()) return;
      setTokenState(null);
      setUser(null);
    }
    window.addEventListener("rs-unauthorized", onUnauthorized);
    return () => window.removeEventListener("rs-unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    if (offline) {
      const u = username.trim().toLowerCase();
      if (!u) throw new Error("사용자 이름을 입력하세요.");
      if (!password) throw new Error("비밀번호를 입력하세요.");
      const session = { username: u, role: "admin" as const };
      writeOfflineSession(session);
      setUser(offlineSessionToUser(session));
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
  }, [offline]);

  const register = useCallback(async (username: string, password: string) => {
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
  }, [offline]);

  const logout = useCallback(() => {
    if (offline) {
      clearOfflineSession();
      setUser(null);
      return;
    }
    clearAuthToken();
    setTokenState(null);
    setUser(null);
  }, [offline]);

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
      login,
      register,
      logout,
    }),
    [user, token, offline, isAuthenticated, bootstrapping, login, register, logout],
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
