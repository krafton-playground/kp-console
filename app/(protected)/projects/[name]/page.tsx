import { auth } from "@/lib/auth";
import {
  getProject,
  getRecentDeployments,
  isAdmin as checkIsAdmin,
  type ProjectFeatures,
} from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Globe,
  Database,
  Shield,
  Server,
  ExternalLink,
  GitBranch,
  Clock,
} from "lucide-react";

const SKIP_AUTH = process.env.SKIP_AUTH === "1";
const MOCK_EMAIL = "jaejun.lee@krafton.com";

function deploymentStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "live":
      return "default";
    case "building":
    case "deploying":
    case "pending":
      return "secondary";
    case "failed":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function projectStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active": return "default";
    case "suspended": return "secondary";
    case "deleting":
    case "deleted": return "destructive";
    default: return "outline";
  }
}

interface FeatureBadgeProps {
  icon: React.ElementType;
  label: string;
  value: string | boolean | null | undefined;
  active?: boolean;
}

function FeatureBadge({ icon: Icon, label, value, active }: FeatureBadgeProps) {
  const isActive = active ?? (value !== null && value !== undefined && value !== false);
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isActive ? "border-border bg-background" : "border-dashed bg-muted/30 opacity-50"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-semibold truncate ${isActive ? "" : "text-muted-foreground"}`}>
          {value === true
            ? "Enabled"
            : value === false || value === null || value === undefined
            ? "Not configured"
            : String(value)}
        </p>
      </div>
    </div>
  );
}

function FeaturesCard({ features }: { features: ProjectFeatures | null }) {
  const f = features ?? {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Features & Integrations</CardTitle>
      </CardHeader>
      <CardContent>
        {!features ? (
          <p className="text-sm text-muted-foreground">
            Feature data not available. Run migration{" "}
            <code className="bg-muted px-1 rounded text-xs">002_features_column.sql</code> to enable.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureBadge
              icon={Server}
              label="Hosting"
              value={f.hosting}
            />
            <FeatureBadge
              icon={Database}
              label="Database"
              value={f.database}
            />
            <FeatureBadge
              icon={Shield}
              label="SSO / Auth"
              value={f.sso ? "Azure AD SSO" : false}
              active={!!f.sso}
            />
            <FeatureBadge
              icon={Globe}
              label="Custom Domain"
              value={f.custom_domain}
            />
            {/* Render any extra unknown features */}
            {Object.entries(f)
              .filter(([k]) => !["hosting", "database", "sso", "custom_domain"].includes(k))
              .map(([key, val]) => (
                <FeatureBadge
                  key={key}
                  icon={Globe}
                  label={key.replace(/_/g, " ")}
                  value={String(val)}
                />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { name: string };
}) {
  let userEmail = MOCK_EMAIL;
  let admin = true;

  if (!SKIP_AUTH) {
    const session = await auth();
    userEmail = session?.user?.email ?? session?.user?.name ?? MOCK_EMAIL;
    admin = await checkIsAdmin(userEmail);
  }

  const project = await getProject(params.name, userEmail, admin);
  if (!project) notFound();

  const deployments = await getRecentDeployments(userEmail, admin, 5);
  const projectDeployments = deployments.filter((d) => d.project_id === project.id);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              {project.display_name ?? project.name}
            </h1>
            {project.display_name && (
              <p className="text-sm text-muted-foreground mt-0.5 font-mono">{project.name}</p>
            )}
            {project.description && (
              <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
          <Badge variant={projectStatusVariant(project.status)} className="mt-1 shrink-0">
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border rounded-lg p-4">
        <div className="flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">Template:</span>
          <span>{project.template}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">Owner:</span>
          <span>{project.owner_email}</span>
        </div>
        {project.github_repo && (
          <a
            href={`https://github.com/${project.github_repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>{project.github_repo}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Features card */}
      <FeaturesCard features={project.features ?? null} />

      {/* Recent deployments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Deployments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projectDeployments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deployments yet.</p>
          ) : (
            projectDeployments.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {d.branch ?? "main"} ·{" "}
                    <span className="text-muted-foreground capitalize">{d.trigger_type}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.started_at).toLocaleString()}
                    {d.deploy_url && (
                      <>
                        {" · "}
                        <a
                          href={d.deploy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground"
                        >
                          View ↗
                        </a>
                      </>
                    )}
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
    </div>
  );
}
