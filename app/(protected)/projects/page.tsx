import { auth } from "@/lib/auth";
import { getProjects, isAdmin as checkIsAdmin } from "@/lib/supabase";
import { ProjectTable } from "@/components/ProjectTable";

const SKIP_AUTH = process.env.SKIP_AUTH === "1";
const MOCK_EMAIL = "jaejun.lee@krafton.com";

export default async function ProjectsPage() {
  let userEmail = MOCK_EMAIL;
  let admin = true;

  if (!SKIP_AUTH) {
    const session = await auth();
    userEmail = session?.user?.email ?? session?.user?.name ?? MOCK_EMAIL;
    admin = await checkIsAdmin(userEmail);
  }

  const projects = await getProjects(userEmail, admin);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Projects</h1>
      <ProjectTable projects={projects} />
    </div>
  );
}
