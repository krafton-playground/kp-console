import { auth } from "@/lib/auth";
import { listProjects } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/api";

export default async function DashboardPage() {
  const session = await auth();
  const projects: Project[] = session?.accessToken
    ? await listProjects(session.accessToken).catch(() => [])
    : [];

  const total = projects.length;
  const active = projects.filter((p) => p.status === "active").length;
  const recent = projects
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 1)[0];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Deployment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold truncate">{recent?.name ?? "—"}</p>
            {recent && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(recent.created_at).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
