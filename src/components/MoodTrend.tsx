"use client";

import { useMemo, useState } from "react";

import { ALL_LABELS, getMoodDef } from "@/lib/moods";
import { todayISO } from "@/lib/date";
import type { Entry } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Range = "week" | "month" | "year";

const RANGES: Array<{ id: Range; label: string; days: number }> = [
  { id: "week", label: "Week", days: 7 },
  { id: "month", label: "Month", days: 30 },
  { id: "year", label: "Year", days: 365 },
];

function dateAddDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

function dateDiffDays(from: string, to: string): number {
  const [ay, am, ad] = from.split("-").map(Number);
  const [by, bm, bd] = to.split("-").map(Number);
  return Math.round(
    (new Date(by, bm - 1, bd).getTime() -
      new Date(ay, am - 1, ad).getTime()) /
      86_400_000
  );
}

const NEUTRAL_COLOR = "#C9C9D3";

interface MoodTrendProps {
  entries: Entry[];
}

export function MoodTrend({ entries }: MoodTrendProps) {
  const [range, setRange] = useState<Range>("week");
  const days = RANGES.find((r) => r.id === range)!.days;

  const data = useMemo(() => {
    const today = todayISO();
    const startDate = dateAddDays(today, -(days - 1));
    const span = Math.max(1, days - 1);

    // Take latest entry per day, in range. (One-entry-per-day already enforced
    // upstream, but we de-dupe defensively.)
    const byDate = new Map<string, Entry>();
    for (const e of entries) {
      if (e.date < startDate || e.date > today) continue;
      const existing = byDate.get(e.date);
      if (!existing || existing.updatedAt < e.updatedAt) {
        byDate.set(e.date, e);
      }
    }

    const points = Array.from(byDate.values())
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((e) => {
        const idx = ALL_LABELS.indexOf(e.moodLabel);
        const def = getMoodDef(e.moodLabel);
        // y: 0 (Angry, worst) at the bottom, 1 (Excited, best) at the top
        const score =
          idx >= 0 ? (ALL_LABELS.length - 1 - idx) / (ALL_LABELS.length - 1) : 0.5;
        // x: fraction of the range
        const x = dateDiffDays(startDate, e.date) / span;
        return {
          date: e.date,
          x,
          score,
          color: def?.bg ?? NEUTRAL_COLOR,
          label: e.moodLabel,
        };
      });

    return { startDate, today, points, span };
  }, [entries, days]);

  return (
    <section aria-label="Mood trend">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Mood trend</h2>
        <RangeTabs value={range} onChange={setRange} />
      </div>
      {data.points.length < 2 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-8 text-center text-sm text-muted-foreground">
          Not enough data in this range yet.
          <br />
          {data.points.length === 0
            ? "Log at least two days to see a trend."
            : "One more day to go."}
        </div>
      ) : (
        <TrendChart
          points={data.points}
          startDate={data.startDate}
          endDate={data.today}
        />
      )}
    </section>
  );
}

interface RangeTabsProps {
  value: Range;
  onChange: (r: Range) => void;
}

function RangeTabs({ value, onChange }: RangeTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Trend range"
      className="inline-flex rounded-full border bg-muted p-0.5 text-xs"
    >
      {RANGES.map((r) => (
        <button
          key={r.id}
          role="tab"
          aria-selected={value === r.id}
          type="button"
          onClick={() => onChange(r.id)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            value === r.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

interface TrendPoint {
  date: string;
  x: number; // 0..1 across the range
  score: number; // 0..1 worst..best
  color: string;
  label: string;
}

function TrendChart({
  points,
  startDate,
  endDate,
}: {
  points: TrendPoint[];
  startDate: string;
  endDate: string;
}) {
  const W = 600;
  const H = 180;
  const PAD_X = 10;
  const PAD_TOP = 12;
  const PAD_BOT = 22;

  const xToPx = (x: number) => PAD_X + x * (W - 2 * PAD_X);
  const yToPx = (s: number) =>
    PAD_TOP + (1 - s) * (H - PAD_TOP - PAD_BOT);

  // Smooth path using monotonic cubic-ish — keep it simple: catmull-rom-like
  // tangents converted to bezier control points. Falls back to straight lines
  // for 2 points.
  const linePath = buildSmoothPath(
    points.map((p) => ({ x: xToPx(p.x), y: yToPx(p.score) }))
  );
  const bottomY = H - PAD_BOT;
  const firstX = xToPx(points[0].x);
  const lastX = xToPx(points[points.length - 1].x);
  const areaPath = `${linePath} L ${lastX.toFixed(2)} ${bottomY} L ${firstX.toFixed(
    2
  )} ${bottomY} Z`;

  // Unique IDs per chart so multiple charts on a page don't collide.
  const seed = `${startDate}-${endDate}-${points.length}`;
  const lineGradId = `line-${seed}`;
  const fillGradId = `fill-${seed}`;

  const stops = points.map((p) => ({ offset: p.x * 100, color: p.color }));

  return (
    <div className="rounded-xl border bg-card p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-44 w-full"
        role="img"
        aria-label="Mood values plotted over the selected range"
      >
        <defs>
          <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
            {stops.map((s, i) => (
              <stop
                key={i}
                offset={`${s.offset}%`}
                stopColor={s.color}
                stopOpacity={1}
              />
            ))}
          </linearGradient>
          <linearGradient id={fillGradId} x1="0" y1="0" x2="1" y2="0">
            {stops.map((s, i) => (
              <stop
                key={i}
                offset={`${s.offset}%`}
                stopColor={s.color}
                stopOpacity={0.4}
              />
            ))}
          </linearGradient>
        </defs>

        {/* Baseline grid (very subtle) */}
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={bottomY}
          y2={bottomY}
          stroke="#E5E5E5"
          strokeWidth="1"
        />
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={PAD_TOP + (H - PAD_TOP - PAD_BOT) / 2}
          y2={PAD_TOP + (H - PAD_TOP - PAD_BOT) / 2}
          stroke="#F2F2F2"
          strokeWidth="1"
        />

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${fillGradId})`} />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={`url(#${lineGradId})`}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Markers */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xToPx(p.x)}
            cy={yToPx(p.score)}
            r="4"
            fill={p.color}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          >
            <title>
              {p.date}: {p.label}
            </title>
          </circle>
        ))}

        {/* Axis labels */}
        <text
          x={PAD_X}
          y={H - 6}
          fontSize="10"
          fill="#9CA3AF"
          textAnchor="start"
        >
          {formatTick(startDate)}
        </text>
        <text
          x={W - PAD_X}
          y={H - 6}
          fontSize="10"
          fill="#9CA3AF"
          textAnchor="end"
        >
          {formatTick(endDate)}
        </text>
      </svg>
    </div>
  );
}

function formatTick(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  return `${d} ${months[m - 1]}${
    y !== new Date().getFullYear() ? ` '${String(y).slice(2)}` : ""
  }`;
}

// Build a smooth cubic Bezier path through points. Tension ≈ Catmull-Rom.
function buildSmoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }
  const tension = 0.5;
  const segs: string[] = [`M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;
    segs.push(
      `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(
        2
      )} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
    );
  }
  return segs.join(" ");
}
