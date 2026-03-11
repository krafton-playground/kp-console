import { auth } from "@/lib/auth";
import { getDeploymentStats, isAdmin as checkIsAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Database, Zap, ScrollText, Bell } from "lucide-react";

const SKIP_AUTH = process.env.SKIP_AUTH === "1";
const MOCK_EMAIL = "jaejun.lee@krafton.com";

function SuccessBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{value} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: { tenant?: string };
}) {
  let userEmail = MOCK_EMAIL;
  let admin = true;

  if (!SKIP_AUTH) {
    const session = await auth();
    userEmail = session?.user?.email ?? session?.user?.name ?? MOCK_EMAIL;
    admin = await checkIsAdmin(userEmail);
  }

  const stats = await getDeploymentStats(userEmail, admin, searchParams.tenant, 7);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Monitoring</h1>
        <Badge variant="outline" className="text-xs">Last 7 days</Badge>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Total Deployments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${stats.successRate >= 0.9 ? "text-green-600" : stats.successRate >= 0.7 ? "text-yellow-600" : "text-red-600"}`}>
              {stats.total > 0 ? `${Math.round(stats.successRate * 100)}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-green-500" /> Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.success}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deployment trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Deployment Trend (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.dailyTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              stats.dailyTrend.map((day) => {
                const dayTotal = day.success + day.failed;
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-muted-foreground">
                        {day.success > 0 && <span className="text-green-600 mr-1">✓{day.success}</span>}
                        {day.failed > 0 && <span className="text-red-600">✗{day.failed}</span>}
                        {dayTotal === 0 && <span>—</span>}
                      </span>
                    </div>
                    {dayTotal > 0 && (
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${(day.success / dayTotal) * 100}%` }}
                        />
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${(day.failed / dayTotal) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {stats.total > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Overall success rate</p>
                <SuccessBar value={stats.success} total={stats.total} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Throughput — needs CloudWatch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" /> API Throughput
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed p-4 text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">CloudWatch integration required</p>
              <p className="text-xs text-muted-foreground">
                Set <code className="bg-muted px-1 rounded text-xs">AWS_ACCESS_KEY_ID</code>,{" "}
                <code className="bg-muted px-1 rounded text-xs">AWS_SECRET_ACCESS_KEY</code> in Vercel env to enable Lambda metrics.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Invocations", value: "—" },
                { label: "P50 Latency", value: "—" },
                { label: "Error Rate", value: "—" },
              ].map((m) => (
                <div key={m.label} className="rounded-md bg-muted/50 p-3">
                  <p className="text-lg font-semibold text-muted-foreground">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" /> Resource Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Lambda Duration (avg)", value: "—", unit: "ms", note: "CloudWatch" },
              { label: "Vercel Bandwidth", value: "—", unit: "GB", note: "Vercel API" },
              { label: "Supabase DB Size", value: "—", unit: "MB", note: "Supabase API" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground">Source: {r.note}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-muted-foreground">{r.value}</span>
                  {r.value !== "—" && (
                    <span className="text-xs text-muted-foreground ml-1">{r.unit}</span>
                  )}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground border-t pt-3">
              Configure API credentials to see live data.
            </p>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" /> CloudWatch Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "ALARM", count: "—", color: "text-red-600" },
                { label: "WARN", count: "—", color: "text-yellow-600" },
                { label: "OK", count: "—", color: "text-green-600" },
              ].map((a) => (
                <div key={a.label} className="rounded-md bg-muted/50 p-3">
                  <p className={`text-xl font-bold ${a.color}`}>{a.count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{a.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-dashed p-3 text-center">
              <p className="text-xs text-muted-foreground">
                Configure <code className="bg-muted px-1 rounded">AWS_ACCESS_KEY_ID</code> to view alarm status.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Logs — admin only */}
      {admin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="h-4 w-4" /> CloudWatch Logs
              <Badge variant="secondary" className="text-[10px]">Admin</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Real-time log viewer</p>
              <p className="text-xs text-muted-foreground">
                Requires <code className="bg-muted px-1 rounded">AWS_ACCESS_KEY_ID</code> with CloudWatch Logs read permission.
                Log group: <code className="bg-muted px-1 rounded">/aws/lambda/kp-api</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
