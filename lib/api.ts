const KP_API_URL = process.env.KP_API_URL ?? "";

export interface Project {
  name: string;
  status: string;
  owner_email: string;
  created_at: string;
}

export async function listProjects(accessToken: string): Promise<Project[]> {
  const res = await fetch(`${KP_API_URL}/console/projects`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  const data = await res.json() as { projects: Project[] };
  return data.projects;
}

export async function getProject(accessToken: string, name: string): Promise<Project> {
  const res = await fetch(`${KP_API_URL}/console/projects/${name}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
  const data = await res.json() as { project: Project };
  return data.project;
}
