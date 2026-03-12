// lib/cw.ts — AWS CloudWatch SDK v3 wrapper
// Returns null when AWS credentials are not configured (graceful fallback)
import {
  CloudWatchClient,
  GetMetricDataCommand,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

export interface LambdaMetrics {
  invocations: number[];
  p50: number[];
  p99: number[];
  errorRate: number[]; // 0.0 ~ 1.0
  timestamps: string[];
}

export interface AlarmState {
  name: string;
  state: "OK" | "ALARM" | "INSUFFICIENT_DATA";
  reason: string;
  updatedAt: string;
}

export interface LogEvent {
  timestamp: number;
  message: string;
  logStreamName: string;
}

function getCwClient(): CloudWatchClient | null {
  if (!process.env.AWS_ACCESS_KEY_ID) return null;
  return new CloudWatchClient({
    region: process.env.AWS_REGION ?? "ap-northeast-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export async function getLambdaMetrics(
  functionName: string,
  startTime: Date,
  endTime: Date,
  period = 300,
): Promise<LambdaMetrics | null> {
  const client = getCwClient();
  if (!client) return null;

  try {
    const cmd = new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: endTime,
      MetricDataQueries: [
        {
          Id: "invocations",
          MetricStat: {
            Metric: {
              Namespace: "AWS/Lambda",
              MetricName: "Invocations",
              Dimensions: [{ Name: "FunctionName", Value: functionName }],
            },
            Period: period,
            Stat: "Sum",
          },
        },
        {
          Id: "errors",
          MetricStat: {
            Metric: {
              Namespace: "AWS/Lambda",
              MetricName: "Errors",
              Dimensions: [{ Name: "FunctionName", Value: functionName }],
            },
            Period: period,
            Stat: "Sum",
          },
        },
        {
          Id: "durationP50",
          MetricStat: {
            Metric: {
              Namespace: "AWS/Lambda",
              MetricName: "Duration",
              Dimensions: [{ Name: "FunctionName", Value: functionName }],
            },
            Period: period,
            Stat: "p50",
          },
        },
        {
          Id: "durationP99",
          MetricStat: {
            Metric: {
              Namespace: "AWS/Lambda",
              MetricName: "Duration",
              Dimensions: [{ Name: "FunctionName", Value: functionName }],
            },
            Period: period,
            Stat: "p99",
          },
        },
      ],
    });

    const result = await client.send(cmd);
    const ts =
      result.MetricDataResults?.[0]?.Timestamps?.map((t) =>
        t.toISOString(),
      ) ?? [];
    const inv =
      result.MetricDataResults?.find((r) => r.Id === "invocations")?.Values ??
      [];
    const errs =
      result.MetricDataResults?.find((r) => r.Id === "errors")?.Values ?? [];
    const p50 =
      result.MetricDataResults?.find((r) => r.Id === "durationP50")?.Values ??
      [];
    const p99 =
      result.MetricDataResults?.find((r) => r.Id === "durationP99")?.Values ??
      [];

    return {
      timestamps: ts,
      invocations: inv,
      p50,
      p99,
      errorRate: inv.map((v, i) => (v > 0 ? (errs[i] ?? 0) / v : 0)),
    };
  } catch {
    return null;
  }
}

export async function getAlarms(): Promise<AlarmState[]> {
  const client = getCwClient();
  if (!client) return [];

  try {
    const cmd = new DescribeAlarmsCommand({ AlarmNamePrefix: "kp-api" });
    const result = await client.send(cmd);

    return (result.MetricAlarms ?? []).map((a) => ({
      name: a.AlarmName ?? "",
      state: (a.StateValue ?? "INSUFFICIENT_DATA") as AlarmState["state"],
      reason: a.StateReason ?? "",
      updatedAt: a.StateUpdatedTimestamp?.toISOString() ?? "",
    }));
  } catch {
    return [];
  }
}

export async function getLogs(
  logGroup: string,
  startTime: Date,
  limit = 100,
  filterPattern?: string,
): Promise<LogEvent[]> {
  if (!process.env.AWS_ACCESS_KEY_ID) return [];

  try {
    const client = new CloudWatchLogsClient({
      region: process.env.AWS_REGION ?? "ap-northeast-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });

    const cmd = new FilterLogEventsCommand({
      logGroupName: logGroup,
      startTime: startTime.getTime(),
      endTime: Date.now(),
      limit,
      filterPattern: filterPattern || undefined,
    });

    const result = await client.send(cmd);
    return (result.events ?? []).map((e) => ({
      timestamp: e.timestamp ?? 0,
      message: e.message ?? "",
      logStreamName: e.logStreamName ?? "",
    }));
  } catch {
    return [];
  }
}
