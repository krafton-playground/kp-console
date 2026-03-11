import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Project {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  template: string;
  owner_email: string;
  github_repo: string | null;
  status: string;
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

export async function getProjects(userEmail: string, isAdmin: boolean): Promise<Project[]> {
  let query = supabase
    .from("projects")
    .select("id,name,display_name,description,template,owner_email,github_repo,status,created_at,updated_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("owner_email", userEmail);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRecentDeployments(
  userEmail: string,
  isAdmin: boolean,
  limit = 5,
): Promise<Deployment[]> {
  let query = supabase
    .from("deployments")
    .select("id,project_id,triggered_by_email,trigger_type,status,branch,deploy_url,started_at,finished_at,error_message,projects(name,display_name)")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (!isAdmin) {
    const { data: ownProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_email", userEmail)
      .is("deleted_at", null);
    const ids = (ownProjects ?? []).map((p) => p.id);
    if (ids.length === 0) return [];
    query = query.in("project_id", ids);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Deployment[];
}

export async function isAdmin(userEmail: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("email", userEmail)
    .single();
  return data?.role === "admin";
}
