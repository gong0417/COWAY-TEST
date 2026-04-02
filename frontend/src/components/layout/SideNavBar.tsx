import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const baseNav = [
  { to: "/", label: "대시보드", icon: "dashboard", end: true },
  {
    to: "/inspection",
    label: "부품 점검 및 내부 표준",
    icon: "fact_check",
    end: false,
  },
  { to: "/failures", label: "과거 실패 사례", icon: "history_edu", end: false },
  {
    to: "/reliability",
    label: "부품 신뢰성 시험 표준",
    icon: "biotech",
    end: false,
  },
] as const;

const adminNav = {
  to: "/admin",
  label: "관리자 모드",
  icon: "admin_panel_settings",
  end: false,
} as const;

export function SideNavBar() {
  const { isAuthenticated } = useAuth();
  const nav = isAuthenticated ? [...baseNav, adminNav] : [...baseNav];

  return (
    <aside
      data-print-hide
      className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col overflow-y-auto border-r border-white/5 bg-[#00213f] shadow-2xl"
    >
      <div className="p-6">
        <Link
          to="/"
          className="mb-8 block rounded-xl p-2 outline-none ring-white/0 transition-all hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-on-primary-container"
          title="대시보드로 이동"
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-[3.25rem] min-w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl bg-white px-2.5 py-1.5 shadow-lg ring-1 ring-white/40"
              aria-hidden
            >
              <span className="select-none text-[11px] font-black leading-none tracking-[0.2em] text-[#0095d9]">
                COWAY
              </span>
              <span className="mt-1.5 h-0.5 w-9 rounded-full bg-gradient-to-r from-sky-400 via-[#0095d9] to-blue-800" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h1 className="text-[13px] font-extrabold leading-snug tracking-tight text-white">
                핵심 부품 신뢰성
                <span className="block text-[12px] font-bold text-blue-100/95">
                  통합 검증 시스템
                </span>
              </h1>
              <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-blue-200/45">
                홈 · 대시보드
              </p>
            </div>
          </div>
        </Link>
        <nav className="space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "mx-0 my-1 flex items-center rounded-lg px-4 py-3 text-sm font-bold tracking-tight transition-all duration-200",
                  isActive
                    ? "scale-[0.98] bg-[#003366] text-white"
                    : "text-blue-100/70 hover:bg-[#003366]/50",
                ].join(" ")
              }
            >
              <span className="material-symbols-outlined mr-3 text-[22px]">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-white/5 p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/40">
          Reliability System
        </p>
        <p className="mt-1 text-xs text-blue-100/55">내부 신뢰성 검증 포털</p>
      </div>
    </aside>
  );
}
