import { auth } from "@/lib/auth";
import { getAllDeployments, isAdmin as checkIsAdmin } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SKIP_AUTH = process.env.SKIP_AUTH === "1";
const MOCK_EMAIL = "jaejun.lee@krafton.com";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "live": return "default";
    case "building":
    case "deploying":
    case "pending": return "secondary";
    case "failed":
    case "cancelled": return "destructive";
    default: return "outline";
  }
}

export default async function DeploymentsPage({
  searchParams,
}: {
  searchParams: { tenant?: string };
}) {
  let userEmail = MOCK_EMAIL;
  let admin = true;

  if (!SKIP_AUTH) {
    const session = await auth();
    userEmail = session?.user?.email ?? session?.user?.name ?? MOCK_EMAIL;
    admin = await checkIsAdmin(userEmail);
  }

  const deployments = await getAllDeployments(userEmail, admin, searchParams.tenant, 50);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Deployments</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deployments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No deployments found.
              </TableCell>
            </TableRow>
          ) : (
            deployments.map((d) => {
              const duration =
                d.finished_at
                  ? `${Math.round(
                      (new Date(d.finished_at).getTime() - new Date(d.started_at).getTime()) / 1000,
                    )}s`
                  : "—";
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {d.projects?.display_name ?? d.projects?.name ?? d.project_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.branch ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">
                    {d.trigger_type}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(d.started_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{duration}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
