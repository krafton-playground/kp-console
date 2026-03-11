import { auth, signOut } from "@/lib/auth";
import { isAdmin as checkIsAdmin, getTenants } from "@/lib/supabase";
import { SidebarNav } from "@/components/SidebarNav";
import { TenantSelector } from "@/components/TenantSelector";
import { Button } from "@/components/ui/button";
import { LogOut, Layers } from "lucide-react";
import { Suspense } from "react";

const SKIP_AUTH = process.env.SKIP_AUTH === "1";
const MOCK_EMAIL = "jaejun.lee@krafton.com";

export async function Sidebar() {
  let userEmail = MOCK_EMAIL;
  let admin = true;

  if (!SKIP_AUTH) {
    const session = await auth();
    userEmail = session?.user?.email ?? session?.user?.name ?? MOCK_EMAIL;
    admin = await checkIsAdmin(userEmail);
  }

  const tenants = await getTenants(userEmail, admin);
  const defaultTenant = admin ? "all" : userEmail;

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b">
        <Layers className="h-5 w-5 text-primary shrink-0" />
        <span className="font-semibold text-sm">Krafton Playground</span>
      </div>

      {/* Tenant Selector */}
      <div className="px-3 py-3 border-b">
        <Suspense>
          <TenantSelector
            tenants={tenants}
            defaultTenant={defaultTenant}
            isAdmin={admin}
          />
        </Suspense>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <Suspense>
          <SidebarNav isAdmin={admin} />
        </Suspense>
      </div>

      {/* User footer */}
      <div className="border-t px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{userEmail}</p>
            {admin && (
              <p className="text-[10px] text-muted-foreground">Admin</p>
            )}
          </div>
          {!SKIP_AUTH && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/auth/signin" });
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </aside>
  );
}
