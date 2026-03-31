import type { MonthlyFailurePoint } from "@/lib/failureTrendStats";

export function ReliabilityTrendChart({
  data,
  exposurePercent,
}: {
  data: MonthlyFailurePoint[];
  exposurePercent: number;
}) {
  const w = 560;
  const h = 200;
  const pad = { t: 20, r: 20, b: 36, l: 44 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const maxY = Math.max(...data.map((d) => d.count), 1);
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = pad.l + i * step;
    const y = pad.t + innerH - (d.count / maxY) * innerH;
    return { x, y, ...d };
  });
  const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const areaD =
    points.length && last && first
      ? `${lineD} L${last.x},${pad.t + innerH} L${first.x},${pad.t + innerH} Z`
      : "";

  return (
    <div className="rounded-xl border border-slate-100 bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-primary">
            RELIABILITY TREND
          </p>
          <h4 className="text-lg font-bold text-on-surface">월별 실패 사례 등록 추이</h4>
          <p className="text-sm text-on-surface-variant">
            발생일(occurredAt) 기준 최근 6개월 · 결함률은 DB 스냅샷 지표입니다.
          </p>
        </div>
        <div className="rounded-lg bg-primary-fixed/30 px-4 py-2 text-right sm:shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
            부품 대비 사례 비율
          </p>
          <p className="text-2xl font-bold tabular-nums text-primary">{exposurePercent}%</p>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-2 h-auto w-full"
        role="img"
        aria-label="월별 실패 사례 건수 차트"
      >
        <title>월별 실패 사례 건수</title>
        <defs>
          <linearGradient id="reliabilityTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2d6197" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2d6197" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.t + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={pad.l}
              y1={y}
              x2={w - pad.r}
              y2={y}
              stroke="#e5e9eb"
              strokeWidth={1}
            />
          );
        })}
        {areaD ? <path d={areaD} fill="url(#reliabilityTrendFill)" /> : null}
        {lineD ? (
          <path
            d={lineD}
            fill="none"
            stroke="#00213f"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {points.map((p) => (
          <g key={p.monthKey}>
            <circle cx={p.x} cy={p.y} r={4} fill="#00213f" />
            <text
              x={p.x}
              y={h - 10}
              textAnchor="middle"
              fill="#74777f"
              fontSize={10}
              fontFamily="system-ui, sans-serif"
            >
              {p.label}
            </text>
            {p.count > 0 ? (
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fill="#00213f"
                fontSize={11}
                fontWeight={700}
                fontFamily="system-ui, sans-serif"
              >
                {p.count}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}
