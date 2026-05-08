"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SparklinePoint = {
  label: string;
  mrr: number;
};

export function RevenueSparkline({ data }: { data: SparklinePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        No revenue history yet
      </div>
    );
  }

  return (
    <div className="h-40 rounded-lg border bg-background p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            cursor={false}
            formatter={(value) => [
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(Number(value)),
              "MRR",
            ]}
          />
          <Line
            type="monotone"
            dataKey="mrr"
            stroke="var(--foreground)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
