// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  Leaf,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

import { carbonAnalyticsApi, MonthlyEmissionPoint, SourceBreakdownItem } from "../api/carbonAnalytics";
import { carbonTransactionsApi } from "../api/carbonTransactions";
import { environmentalGoalsApi } from "../api/environmentalGoals";
import { CarbonTransaction, DepartmentCarbonSummary, EnvironmentalGoal } from "../types";

/* ── Aesthetics ─────────────────────────────────────────────────────────── */

const SOURCE_COLORS: Record<string, string> = {
  fleet: "#3b82f6",
  manufacturing: "#10b981",
  purchase: "#a855f7",
  expense: "#f59e0b",
};

const SOURCE_LABELS: Record<string, string> = {
  fleet: "Fleet Vehicles",
  manufacturing: "Manufacturing",
  purchase: "Purchase Energy",
  expense: "Expenses",
};

const GOAL_STATUS_META: Record<string, { label: string; badge: string; bar: string }> = {
  on_track: {
    label: "On-track",
    badge: "bg-emerald-950/40 text-emerald-400 border-emerald-500/20",
    bar: "bg-emerald-500",
  },
  at_risk: {
    label: "At-risk",
    badge: "bg-amber-950/40 text-amber-400 border-amber-500/20",
    bar: "bg-amber-500",
  },
  achieved: {
    label: "Achieved",
    badge: "bg-sky-950/40 text-sky-400 border-sky-500/20",
    bar: "bg-sky-500",
  },
  missed: {
    label: "Missed",
    badge: "bg-rose-950/40 text-rose-400 border-rose-500/20",
    bar: "bg-rose-500",
  },
};

const formatNumber = (value: number, digits = 1) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);

/* ── Component ──────────────────────────────────────────────────────────── */

interface Props {
  transactions: CarbonTransaction[];
  environmentalGoals: EnvironmentalGoal[];
  onRefreshGoals: () => void;
}

export default function EnvironmentalDashboardTab({
  transactions,
  environmentalGoals,
  onRefreshGoals,
}: Props) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  /* Chart data */
  const [trendData, setTrendData] = useState<MonthlyEmissionPoint[]>([]);
  const [prevYearTrend, setPrevYearTrend] = useState<MonthlyEmissionPoint[]>([]);
  const [sourceBreakdown, setSourceBreakdown] = useState<SourceBreakdownItem[]>([]);
  const [deptSummary, setDeptSummary] = useState<DepartmentCarbonSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = () => {
    setLoading(true);
    Promise.all([
      carbonAnalyticsApi.emissionsTrend(selectedYear),
      carbonAnalyticsApi.emissionsTrend(selectedYear - 1),
      carbonAnalyticsApi.sourceBreakdown({ year: selectedYear }),
      carbonTransactionsApi.summaryByDepartment({}),
    ])
      .then(([trend, prevTrend, breakdown, dept]) => {
        setTrendData(trend);
        setPrevYearTrend(prevTrend);
        setSourceBreakdown(breakdown);
        setDeptSummary(dept);
      })
      .catch((err) => console.error("Failed to load analytics", err))
      .finally(() => setLoading(false));
  };

  useEffect(loadAnalytics, [selectedYear]);

  /* ── Computed stats ──────────────────────────────────────────────────── */
  const totalRecordedCo2e = transactions.reduce((sum, t) => sum + t.co2e, 0);
  const activeGoalCount = environmentalGoals.filter(
    (goal) => goal.status !== "achieved" && goal.status !== "missed"
  ).length;

  const currentYearTotal = trendData.reduce((s, d) => s + d.total_co2e, 0);
  const prevYearTotal = prevYearTrend.reduce((s, d) => s + d.total_co2e, 0);
  const yoyChange =
    prevYearTotal > 0
      ? ((currentYearTotal - prevYearTotal) / prevYearTotal) * 100
      : 0;

  const topSource = sourceBreakdown.length > 0 ? sourceBreakdown[0] : null;

  /* Merge current + previous year trend for the area chart overlay */
  const mergedTrend = trendData.map((d, i) => ({
    month: d.month,
    current: d.total_co2e,
    previous: prevYearTrend[i]?.total_co2e ?? 0,
  }));

  /* ── Pie chart data ──────────────────────────────────────────────────── */
  const pieData = sourceBreakdown.map((item) => ({
    name: SOURCE_LABELS[item.source_type] || item.source_type,
    value: item.total_co2e,
    color: SOURCE_COLORS[item.source_type] || "#6b7280",
  }));

  /* ── Department bar chart data ───────────────────────────────────────── */
  const deptBarData = deptSummary.slice(0, 8).map((d) => ({
    name: d.department_name || "Unassigned",
    co2e: d.total_co2e,
  }));

  const DEPT_BAR_COLORS = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

  /* ── Year selector ───────────────────────────────────────────────────── */
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Environmental Dashboard</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Emissions summary, trends, and goal tracking from live ERP data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-slate-900 border border-brand-border text-sm font-semibold px-4 py-2 pr-8 rounded-xl text-gray-300 focus:outline-none focus:border-emerald-500/50"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <button
            onClick={loadAnalytics}
            className="bg-slate-900 border border-brand-border p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Total CO₂e */}
        <div className="glass-card p-5 md:p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Total CO₂e</span>
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl md:text-4xl font-extrabold mt-3 text-white">
            {formatNumber(totalRecordedCo2e)}
            <span className="text-base md:text-lg text-gray-500 ml-1">kg</span>
          </p>
          <p className="text-xs text-gray-400 mt-3">All confirmed ledger entries</p>
        </div>

        {/* Active Goals */}
        <div className="glass-card p-5 md:p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Active Goals</span>
            <Activity className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-3xl md:text-4xl font-extrabold mt-3 text-white">
            {activeGoalCount}
            <span className="text-base md:text-lg text-gray-500 ml-1">targets</span>
          </p>
          <p className="text-xs text-gray-400 mt-3">Sustainability goals in progress</p>
        </div>

        {/* YoY Change */}
        <div className="glass-card p-5 md:p-6 rounded-2xl relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 ${yoyChange <= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"} rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500`} />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Year-over-Year</span>
            {yoyChange <= 0 ? (
              <TrendingDown className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingUp className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <p className={`text-3xl md:text-4xl font-extrabold mt-3 ${yoyChange <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {yoyChange <= 0 ? "" : "+"}
            {formatNumber(yoyChange)}%
          </p>
          <p className="text-xs text-gray-400 mt-3">
            {selectedYear} vs {selectedYear - 1}
          </p>
        </div>

        {/* Top Source */}
        <div className="glass-card p-5 md:p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Top Source</span>
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-xl md:text-2xl font-extrabold mt-3 text-white capitalize truncate">
            {topSource ? SOURCE_LABELS[topSource.source_type] || topSource.source_type : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-3">
            {topSource ? `${formatNumber(topSource.total_co2e)} kg CO₂e` : "No data"}
          </p>
        </div>
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Emissions Trend (YoY overlay) */}
        <div className="glass-card p-5 md:p-6 rounded-2xl xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Emissions Trend — {selectedYear} vs {selectedYear - 1}
            </h3>
          </div>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedTrend}>
                <defs>
                  <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b0f19",
                    border: "1px solid #1f2937",
                    borderRadius: "12px",
                    color: "white",
                  }}
                  formatter={(value: number, name: string) => [
                    `${formatNumber(value)} kg`,
                    name === "current" ? String(selectedYear) : String(selectedYear - 1),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#currentGrad)"
                  name="current"
                />
                <Area
                  type="monotone"
                  dataKey="previous"
                  stroke="#4f46e5"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  fillOpacity={0}
                  name="previous"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 rounded-full inline-block" />
              {selectedYear}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-500 rounded-full inline-block border-dashed" />
              {selectedYear - 1}
            </span>
          </div>
        </div>

        {/* Source Breakdown Pie */}
        <div className="glass-card p-5 md:p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-5">
              Source Breakdown
            </h3>
            <div className="h-48 md:h-56 flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0b0f19",
                        border: "1px solid #1f2937",
                        borderRadius: "12px",
                      }}
                      formatter={(value: number) => [`${formatNumber(value)} kg`, "CO₂e"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No emission data for {selectedYear}</p>
              )}
            </div>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-[10px] font-semibold text-gray-400 truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Department Bar Chart + Goal Tracking ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        {/* Department Breakdown */}
        <div className="glass-card p-5 md:p-6 rounded-2xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-5">
            Department Emissions
          </h3>
          <div className="h-64 md:h-72">
            {deptBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptBarData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={11}
                    width={110}
                    tick={{ fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b0f19",
                      border: "1px solid #1f2937",
                      borderRadius: "12px",
                      color: "white",
                    }}
                    formatter={(value: number) => [`${formatNumber(value)} kg CO₂e`]}
                  />
                  <Bar dataKey="co2e" radius={[0, 6, 6, 0]} barSize={20}>
                    {deptBarData.map((_, i) => (
                      <Cell key={i} fill={DEPT_BAR_COLORS[i % DEPT_BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                No department data available
              </div>
            )}
          </div>
        </div>

        {/* Goal Tracking */}
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 md:p-6 border-b border-brand-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Sustainability Goal Tracking
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Emissions are refreshed from confirmed ledger entries.
              </p>
            </div>
            <button
              onClick={onRefreshGoals}
              className="text-xs bg-slate-900 text-gray-300 border border-brand-border px-3 py-1.5 rounded-lg font-bold hover:text-white hover:bg-slate-800 transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="divide-y divide-brand-border overflow-y-auto max-h-[360px]">
            {environmentalGoals.length === 0 ? (
              <div className="p-6 text-sm text-gray-400">
                No sustainability goals configured yet.
              </div>
            ) : (
              environmentalGoals.map((goal) => {
                const meta =
                  GOAL_STATUS_META[goal.status] || GOAL_STATUS_META.on_track;
                const progress = Math.max(0, Math.min(goal.progress_pct, 100));
                const timeline = Math.max(0, Math.min(goal.timeline_pct, 100));
                return (
                  <div key={goal.id} className="p-5 md:p-6 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{goal.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatNumber(goal.current_value)} /{" "}
                          {formatNumber(goal.target_value)} {goal.unit} by{" "}
                          {goal.deadline}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold border shrink-0 ${meta.badge}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-400">
                        <span>{formatNumber(progress)}% of target</span>
                        <span>{formatNumber(timeline)}% timeline</span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-brand-border bg-slate-950">
                        <div
                          className={`h-full rounded-full ${meta.bar}`}
                          style={{ width: `${progress}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-px bg-white/70"
                          style={{ left: `${timeline}%` }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
