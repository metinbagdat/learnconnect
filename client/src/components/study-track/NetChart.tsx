import React, { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./NetChart.module.css";

export type NetPoint = { label: string; value: number };

type Props = {
  data: NetPoint[];
};

export default function NetChart({ data }: Props) {
  const max = useMemo(() => {
    const m = Math.max(1, ...data.map((d) => d.value));
    return Math.ceil(m / 5) * 5;
  }, [data]);

  return (
    <div className="rounded-2xl bg-slate-800/50 border border-slate-700/80 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-slate-200">Son 7 gün net</h3>
        <span className="text-xs text-slate-500">Günlük toplam</span>
      </div>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#475569" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, max]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#34d399"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#22d3ee", stroke: "#0f172a", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
