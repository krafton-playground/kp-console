import { auth } from "@/lib/auth";
import { getDeploymentStats, isAdmin as checkIsAdmin } from "@/lib/supabase";
import { getLambdaMetrics, getAlarms } from "@/lib/cw";
import { getVercelUsage } from "@/lib/vercel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Activity,
  Database,
  Zap,
  ScrollText,
  Bell,
} from "lucide-react";
import { DeploymentSuccessChart } from "@/components/DeploymentSuccessChart";
import { ThroughputChart } from "@/components/ThroughputChart";

export const revalidate = 60;

const SKIP_AUTH = process.env.SKIP_AUTH === "1";
const MOCK_EMAIL = "jaejun.lee@krafton.com";

function SuccessBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {value} / {total}
        </span>
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

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
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

  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const [stats, lambdaMetrics, alarms, vercelUsage] = await Promise.all([
    getDeploymentStats(userEmail, admin, searchParams.tenant, 7),
    getLambdaMetrics("kp-api", weekAgo, now, 3600),
    getAlarms(),
    admin ? getVercelUsage() : Promise.resolve(null),
  ]);

  const cwConfigured = !!process.env.AWS_ACCESS_KEY_ID;
  const vercelConfigured = !!(
    process.env.VERCEL_API_TOKEN && process.env.VERCEL_TEAM_ID
  );

  const throughputData =
    lambdaMetrics && lambdaMetrics.timestamps.length > 0
      ? lambdaMetrics.timestamps.map((ts, i) => ({
          timestamp: ts,
          invocations: lambdaMetrics.invocations[i] ?? 0,
          p50: Math.round(lambdaMetrics.p50[i] ?? 0),
          p99: Math.round(lambdaMetrics.p99[i] ?? 0),
        }))
      : null;

  const totalInvocations = lambdaMetrics?.invocations.reduce(
    (a, b) => a + b,
    0,
  );
  const avgP50 =
    lambdaMetrics && lambdaMetrics.p50.length > 0
      ? Math.round(
          lambdaMetrics.p50.reduce((a, b) => a + b, 0) /
            lambdaMetrics.p50.length,
        )
      : null;
  const avgErrorRate =
    lambdaMetrics && lambdaMetrics.errorRate.length > 0
      ? lambdaMetrics.errorRate.reduce((a, b) => a + b, 0) /
        lambdaMetrics.errorRate.length
      : null;

  const alarmCount = alarms.filter((a) => a.state === "ALARM").length;
  const warnCount = alarms.filter(
    (a) => a.state === "INSUFFICIENT_DATA",
  ).length;
  const okCount = alarms.filter((a) => a.state === "OK").length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Monitoring</h1>
        <Badge variant="outline" className="text-xs">
          Last 7 days
        </Badge>
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
            <p
              className={`text-3xl font-bold ${stats.successRate >= 0.9 ? "text-green-600" : stats.successRate >= 0.7 ? "text-yellow-600" : "text-red-600"}`}
            >
              {stats.total > 0
                ? `${Math.round(stats.successRate * 100)}%`
                : "—"}
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
        {/* Deployment trend chart */}
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
              <>
                <DeploymentSuccessChart data={stats.dailyTrend} />
                {stats.total > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      Overall success rate
                    </p>
                    <SuccessBar value={stats.success} total={stats.total} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* API Throughput (CloudWatch) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" /> API Throughput
              {!cwConfigured && (
                <Badge variant="outline" className="text-[10px] ml-auto">
                  Not configured
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ThroughputChart data={throughputData} />
            {cwConfigured && (
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  {
                    label: "Invocations",
                    value:
                      totalInvocations != null
                        ? totalInvocations.toLocaleString()
                        : "—",
                  },
                  {
                    label: "P50 Latency",
                    value: avgP50 != null ? `${avgP50}ms` : "—",
                  },
                  {
                    label: "Error Rate",
                    value:
                      avgErrorRate != null
                        ? `${(avgErrorRate * 100).toFixed(1)}%`
                        : "—",
                  },
                ].map((m) => (
                  <div key={m.label} className="rounded-md bg-muted/50 p-3">
                    <p className="text-lg font-semibold">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Lambda Duration (avg P50)</p>
                <p className="text-[10px] text-muted-foreground">
                  Source: CloudWatch
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-muted-foreground">
                  {avgP50 != null ? avgP50 : "—"}
                </span>
                {avgP50 != null && (
                  <span className="text-xs text-muted-foreground ml-1">ms</span>
                )}
              </div>
            </div>
            {admin && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Vercel Bandwidth</p>
                  <p className="text-[10px] text-muted-foreground">
                    Source: Vercel API
                    {!vercelConfigured && (
                      <span className="ml-1 text-muted-foreground/60">
                        (not configured)
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-muted-foreground">
                    {vercelUsage != null
                      ? formatBytes(vercelUsage.bandwidthBytes)
                      : "—"}
                  </span>
                </div>
              </div>
            )}
            {admin && vercelUsage && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Serverless Function Invocations
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Source: Vercel API
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold">
                    {vercelUsage.functionInvocations.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            {!cwConfigured && !vercelConfigured && (
              <p className="text-xs text-muted-foreground border-t pt-3">
                Configure AWS and Vercel credentials to see live data.
              </p>
            )}
          </CardContent>
        </Card>

        {/* CloudWatch Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" /> CloudWatch Alerts
              {!cwConfigured && (
                <Badge variant="outline" className="text-[10px] ml-auto">
                  Not configured
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                {
                  label: "ALARM",
                  count: cwConfigured ? alarmCount : "—",
                  color: "text-red-600",
                },
                {
                  label: "WARN",
                  count: cwConfigured ? warnCount : "—",
                  color: "text-yellow-600",
                },
                {
                  label: "OK",
                  count: cwConfigured ? okCount : "—",
                  color: "text-green-600",
                },
              ].map((a) => (
                <div key={a.label} className="rounded-md bg-muted/50 p-3">
                  <p className={`text-xl font-bold ${a.color}`}>{a.count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {a.label}
                  </p>
                </div>
              ))}
            </div>
            {cwConfigured && alarms.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {alarms.slice(0, 5).map((alarm) => (
                  <div
                    key={alarm.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground truncate max-w-[200px]">
                      {alarm.name}
                    </span>
                    <Badge
                      variant={
                        alarm.state === "ALARM"
                          ? "destructive"
                          : alarm.state === "OK"
                            ? "default"
                            : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {alarm.state}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            {!cwConfigured && (
              <div className="rounded-lg border border-dashed p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Configure{" "}
                  <code className="bg-muted px-1 rounded">
                    AWS_ACCESS_KEY_ID
                  </code>{" "}
                  to view alarm status.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Logs — admin only */}
      {admin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="h-4 w-4" /> CloudWatch Logs
              <Badge variant="secondary" className="text-[10px]">
                Admin
              </Badge>
              {!cwConfigured && (
                <Badge variant="outline" className="text-[10px] ml-auto">
                  Not configured
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Real-time log viewer
              </p>
              <p className="text-xs text-muted-foreground">
                Requires{" "}
                <code className="bg-muted px-1 rounded">AWS_ACCESS_KEY_ID</code>{" "}
                with CloudWatch Logs read permission. Log group:{" "}
                <code className="bg-muted px-1 rounded">
                  /aws/lambda/kp-api
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
