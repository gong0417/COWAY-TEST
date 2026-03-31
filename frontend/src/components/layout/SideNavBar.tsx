import { NavLink } from "react-router-dom";

const nav = [
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
  { to: "/admin", label: "관리자 모드", icon: "admin_panel_settings", end: false },
] as const;

export function SideNavBar() {
  return (
    <aside
      data-print-hide
      className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col overflow-y-auto border-r border-white/5 bg-[#00213f] shadow-2xl"
    >
      <div className="p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container">
            <span
              className="material-symbols-outlined text-on-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              precision_manufacturing
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tighter text-white">
              핵심부품 신뢰성
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-100/50">
              통합 검증 시스템
            </p>
          </div>
        </div>
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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
            RS
          </div>
          <div>
            <p className="text-sm font-bold text-white">신뢰성 검증</p>
            <p className="text-xs text-blue-100/50">내부 사용자</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
