import { auth } from "@/lib/auth";
import { isAdmin as checkIsAdmin } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
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

export default async function AdminUsersPage() {
  let userEmail = MOCK_EMAIL;

  if (!SKIP_AUTH) {
    const session = await auth();
    userEmail = session?.user?.email ?? session?.user?.name ?? MOCK_EMAIL;
  }

  const admin = await checkIsAdmin(userEmail);
  if (!admin) redirect("/dashboard");

  const { data: users } = await supabase
    .from("user_roles")
    .select("email,role,assigned_by,assigned_at")
    .order("assigned_at", { ascending: false });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Assigned By</TableHead>
            <TableHead>Assigned At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(users ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            (users ?? []).map((u) => (
              <TableRow key={u.email}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.assigned_by ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.assigned_at ? new Date(u.assigned_at).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
