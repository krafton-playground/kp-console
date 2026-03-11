import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const SKIP_AUTH = process.env.SKIP_AUTH === "1";

export async function Header() {
  let displayEmail = "jaejun.lee@krafton.com (dev)";

  if (!SKIP_AUTH) {
    const session = await auth();
    displayEmail = session?.user?.email ?? session?.user?.name ?? "Unknown";
  }

  return (
    <header className="border-b px-8 py-3 flex items-center justify-between">
      <nav className="flex items-center gap-6 text-sm font-medium">
        <a href="/dashboard" className="hover:text-foreground/70 transition-colors">
          Dashboard
        </a>
        <a href="/projects" className="hover:text-foreground/70 transition-colors">
          Projects
        </a>
      </nav>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">{displayEmail}</span>
        {!SKIP_AUTH && (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}
