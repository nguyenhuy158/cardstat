"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CATEGORY_COLORS, SERIES_COLORS } from "./colors";

const AXIS = "currentColor";

// Khớp breakpoint `sm` của Tailwind (640px). Width/margin của recharts là prop số
// cho SVG, không có cách chỉnh bằng CSS thuần nên cần theo dõi qua matchMedia.
const MOBILE_QUERY = "(max-width: 639px)";

function useIsCompact() {
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsCompact(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isCompact;
}

function truncateLabel(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);
}

type TooltipRow = { name?: string; value?: number; color?: string };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipRow[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">{label}</div>
      {payload.map((row) => (
        <div key={row.name} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
          <span>{row.name}</span>
          <span className="ml-auto font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatVnd(row.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CategoryChart({ data }: { data: { category: string; total: number }[] }) {
  const rows = data.filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  const isCompact = useIsCompact();
  if (rows.length === 0) return null;

  // Màn hình hẹp cần nhường phần lớn diện tích cho vùng vẽ: giảm width của trục Y
  // và margin phải (trước đây dành cho LabelList, giờ ẩn ở mobile).
  const yAxisWidth = isCompact ? 76 : 110;
  const marginRight = isCompact ? 16 : 56;

  return (
    <div className="h-72 w-full text-zinc-500 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: marginRight, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke={AXIS} strokeOpacity={0.15} />
          <XAxis
            type="number"
            tickFormatter={formatCompact}
            tick={{ fill: AXIS, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={yAxisWidth}
            tickFormatter={(v: string) => (isCompact ? truncateLabel(v, 12) : v)}
            tick={{ fill: AXIS, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: AXIS, fillOpacity: 0.06 }} />
          <Bar dataKey="total" name="Chi tiêu" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.category} fill={CATEGORY_COLORS[r.category] || CATEGORY_COLORS["Khác"]} />
            ))}
            <LabelList
              dataKey="total"
              position="right"
              formatter={(v: unknown) => formatCompact(Number(v))}
              className="hidden fill-zinc-500 text-[11px] tabular-nums sm:inline"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthChart({ data }: { data: { month: string; spend: number; income: number }[] }) {
  const isCompact = useIsCompact();
  if (data.length === 0) return null;

  // Nhiều tháng trên màn hình hẹp thì chữ "2026-02" chồng lên nhau: chỉ hiện số
  // tháng (bỏ năm) và bớt tick khi danh sách dài. "preserveEnd" là default gốc
  // của recharts, giữ nguyên cho desktop.
  const tickInterval = isCompact && data.length > 6 ? Math.ceil(data.length / 4) - 1 : "preserveEnd";

  return (
    <div className="h-56 w-full text-zinc-500 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }} barGap={2}>
          <CartesianGrid vertical={false} stroke={AXIS} strokeOpacity={0.15} />
          <XAxis
            dataKey="month"
            tickFormatter={(v: string) => (isCompact ? v.slice(5) : v)}
            interval={tickInterval}
            tick={{ fill: AXIS, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ fill: AXIS, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: AXIS, fillOpacity: 0.06 }} />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="spend" name="Chi tiêu" fill={SERIES_COLORS.spend} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Bar dataKey="income" name="Thu / hoàn tiền" fill={SERIES_COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
