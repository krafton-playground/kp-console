import { auth } from "@/lib/auth";
import { isAdmin as checkIsAdmin } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
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

export default async function AuditLogPage() {
  let userEmail = MOCK_EMAIL;

  if (!SKIP_AUTH) {
    const session = await auth();
    userEmail = session?.user?.email ?? session?.user?.name ?? MOCK_EMAIL;
  }

  const admin = await checkIsAdmin(userEmail);
  if (!admin) redirect("/dashboard");

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id,actor_email,action,resource_type,resource_id,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Audit Log</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(logs ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No audit logs found.
              </TableCell>
            </TableRow>
          ) : (
            (logs ?? []).map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-sm font-medium">{l.actor_email}</TableCell>
                <TableCell className="text-sm">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{l.action}</code>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{l.resource_type}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                  {l.resource_id}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
