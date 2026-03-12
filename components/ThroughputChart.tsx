"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LambdaDataPoint {
  timestamp: string;
  invocations: number;
  p50: number;
  p99: number;
}

export function ThroughputChart({ data }: { data: LambdaDataPoint[] | null }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] rounded-lg border border-dashed text-center p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            CloudWatch not configured
          </p>
          <p className="text-xs text-muted-foreground">
            Set{" "}
            <code className="bg-muted px-1 rounded">AWS_ACCESS_KEY_ID</code> to
            enable Lambda throughput metrics.
          </p>
        </div>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.timestamp).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={formatted}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
      >
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="invocations"
          name="Invocations"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="p50"
          name="P50 (ms)"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="p99"
          name="P99 (ms)"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
