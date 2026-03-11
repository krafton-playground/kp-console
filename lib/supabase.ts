import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface ProjectFeatures {
  hosting?: string | null;
  database?: string | null;
  sso?: boolean;
  custom_domain?: string | null;
  [key: string]: unknown;
}

export interface Project {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  template: string;
  owner_email: string;
  github_repo: string | null;
  status: string;
  features?: ProjectFeatures | null;
  created_at: string;
  updated_at: string;
}

export interface Deployment {
  id: string;
  project_id: string;
  triggered_by_email: string;
  trigger_type: string;
  status: string;
  branch: string | null;
  deploy_url: string | null;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
  projects?: { name: string; display_name: string | null };
}

export async function getProjects(
  userEmail: string,
  admin: boolean,
  tenant?: string,
): Promise<Project[]> {
  const effective = resolveEffectiveTenant(userEmail, admin, tenant);
  let query = supabase
    .from("projects")
    .select("id,name,display_name,description,template,owner_email,github_repo,status,created_at,updated_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (effective !== "all") {
    query = query.eq("owner_email", effective);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRecentDeployments(
  userEmail: string,
  admin: boolean,
  limit = 5,
  tenant?: string,
): Promise<Deployment[]> {
  const effective = resolveEffectiveTenant(userEmail, admin, tenant);

  let query = supabase
    .from("deployments")
    .select("id,project_id,triggered_by_email,trigger_type,status,branch,deploy_url,started_at,finished_at,error_message,projects(name,display_name)")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (effective !== "all") {
    const { data: ownProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_email", effective)
      .is("deleted_at", null);
    const ids = (ownProjects ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return [];
    query = query.in("project_id", ids);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Deployment[];
}

export async function getProject(
  projectName: string,
  userEmail: string,
  admin: boolean,
): Promise<Project | null> {
  // Try with features column first; fall back if column doesn't exist yet
  let result = await supabase
    .from("projects")
    .select("id,name,display_name,description,template,owner_email,github_repo,status,features,created_at,updated_at")
    .eq("name", projectName)
    .is("deleted_at", null)
    .single();

  if (result.error?.message?.includes("features")) {
    result = await supabase
      .from("projects")
      .select("id,name,display_name,description,template,owner_email,github_repo,status,created_at,updated_at")
      .eq("name", projectName)
      .is("deleted_at", null)
      .single();
  }

  if (result.error || !result.data) return null;
  const data = result.data as Record<string, unknown>;
  if (!admin && data.owner_email !== userEmail) return null;
  return { ...data, features: (data.features as ProjectFeatures | null) ?? null } as Project;
}

export async function isAdmin(userEmail: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("email", userEmail)
    .single();
  return data?.role === "admin";
}

export interface Tenant {
  id: string;
  label: string;
}

export async function getTenants(userEmail: string, admin: boolean): Promise<Tenant[]> {
  if (!admin) {
    const label = userEmail.split("@")[0];
    return [{ id: userEmail, label }];
  }
  const { data } = await supabase
    .from("projects")
    .select("owner_email")
    .is("deleted_at", null);
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const r of (data ?? []) as { owner_email: string }[]) {
    if (!seen.has(r.owner_email)) { seen.add(r.owner_email); emails.push(r.owner_email); }
  }
  return emails.map((email) => ({ id: email, label: email.split("@")[0] }));
}

export async function getAllDeployments(
  userEmail: string,
  admin: boolean,
  tenant?: string,
  limit = 20,
): Promise<Deployment[]> {
  const effectiveTenant = resolveEffectiveTenant(userEmail, admin, tenant);

  let query = supabase
    .from("deployments")
    .select("id,project_id,triggered_by_email,trigger_type,status,branch,deploy_url,started_at,finished_at,error_message,projects(name,display_name)")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (effectiveTenant !== "all") {
    const { data: ownProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_email", effectiveTenant)
      .is("deleted_at", null);
    const ids = (ownProjects ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return [];
    query = query.in("project_id", ids);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Deployment[];
}

export interface DeploymentStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
  dailyTrend: { date: string; success: number; failed: number }[];
}

export async function getDeploymentStats(
  userEmail: string,
  admin: boolean,
  tenant?: string,
  days = 7,
): Promise<DeploymentStats> {
  const effectiveTenant = resolveEffectiveTenant(userEmail, admin, tenant);

  let projectIds: string[] | null = null;
  if (effectiveTenant !== "all") {
    const { data: ownProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_email", effectiveTenant)
      .is("deleted_at", null);
    projectIds = (ownProjects ?? []).map((p: { id: string }) => p.id);
    if (projectIds.length === 0) {
      return { total: 0, success: 0, failed: 0, successRate: 0, dailyTrend: [] };
    }
  }

  let query = supabase
    .from("deployments")
    .select("status,started_at")
    .gte("started_at", new Date(Date.now() - days * 86400000).toISOString());

  if (projectIds) query = query.in("project_id", projectIds);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const total = rows.length;
  const success = rows.filter((r: { status: string }) => r.status === "live").length;
  const failed = rows.filter((r: { status: string }) => r.status === "failed").length;

  // Build daily trend
  const byDate: Record<string, { success: number; failed: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    byDate[d] = { success: 0, failed: 0 };
  }
  for (const r of rows as { status: string; started_at: string }[]) {
    const d = r.started_at.slice(0, 10);
    if (byDate[d]) {
      if (r.status === "live") byDate[d].success++;
      if (r.status === "failed") byDate[d].failed++;
    }
  }

  return {
    total,
    success,
    failed,
    successRate: total > 0 ? success / total : 0,
    dailyTrend: Object.entries(byDate).map(([date, v]) => ({ date, ...v })),
  };
}

function resolveEffectiveTenant(userEmail: string, admin: boolean, tenant?: string): string {
  if (!tenant) return admin ? "all" : userEmail;
  if (tenant === "all" && !admin) return userEmail;
  if (tenant !== userEmail && !admin) return userEmail;
  return tenant;
}
