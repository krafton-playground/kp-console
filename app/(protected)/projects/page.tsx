import { auth } from "@/lib/auth";
import { listProjects } from "@/lib/api";
import { ProjectTable } from "@/components/ProjectTable";

export default async function ProjectsPage() {
  const session = await auth();
  const projects = session?.accessToken
    ? await listProjects(session.accessToken).catch(() => [])
    : [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Projects</h1>
      <ProjectTable projects={projects} />
    </div>
  );
}
