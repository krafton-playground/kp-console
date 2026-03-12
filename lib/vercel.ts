// lib/vercel.ts — Vercel REST API wrapper
// Returns null when VERCEL_API_TOKEN / VERCEL_TEAM_ID are not configured
export interface VercelUsage {
  bandwidthBytes: number;
  functionInvocations: number;
  buildMinutes: number;
}

export async function getVercelUsage(): Promise<VercelUsage | null> {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return null;

  try {
    const res = await fetch(`https://api.vercel.com/v2/teams/${teamId}/usage`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }, // 5-minute cache
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      bandwidthBytes: data.bandwidth?.used ?? 0,
      functionInvocations: data.serverlessFunctionExecution?.used ?? 0,
      buildMinutes: data.buildExecutionUnits?.used ?? 0,
    };
  } catch {
    return null;
  }
}
