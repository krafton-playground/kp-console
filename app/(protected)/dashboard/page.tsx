import { auth } from "@/lib/auth";
import { getProjects, getRecentDeployments, isAdmin as checkIsAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SKIP_AUTH = process.env.SKIP_AUTH === "1";
const MOCK_EMAIL = "jaejun.lee@krafton.com";

function deploymentStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "live": return "default";
    case "building":
    case "deploying": return "secondary";
    case "failed":
    case "cancelled": return "destructive";
    default: return "outline";
  }
}

export default async function DashboardPage() {
  let userEmail = MOCK_EMAIL;
  let admin = true;

  if (!SKIP_AUTH) {
    const session = await auth();
    userEmail = session?.user?.email ?? session?.user?.name ?? MOCK_EMAIL;
    admin = await checkIsAdmin(userEmail);
  }

  const [projects, recentDeployments] = await Promise.all([
    getProjects(userEmail, admin),
    getRecentDeployments(userEmail, admin, 5),
  ]);

  const total = projects.length;
  const active = projects.filter((p) => p.status === "active").length;
  const activeProjects = projects.filter((p) => p.status === "active").slice(0, 5);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Stats */}
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{recentDeployments.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deployments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Deployments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDeployments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deployments yet.</p>
            ) : (
              recentDeployments.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {d.projects?.display_name ?? d.projects?.name ?? d.project_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.branch ? `${d.branch} · ` : ""}{d.trigger_type} ·{" "}
                      {new Date(d.started_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={deploymentStatusVariant(d.status)} className="shrink-0">
                    {d.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active projects.</p>
            ) : (
              activeProjects.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.display_name ?? p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.description ?? p.template}
                    </p>
                  </div>
                  {p.github_repo && (
                    <a
                      href={`https://github.com/${p.github_repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                    >
                      GitHub ↗
                    </a>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
