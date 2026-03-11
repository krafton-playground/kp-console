import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function Header() {
  const session = await auth();
  const email = session?.user?.email ?? session?.user?.name ?? "Unknown";

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
        <span className="text-muted-foreground">{email}</span>
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
      </div>
    </header>
  );
}
