"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Rocket,
  BarChart2,
  Settings,
  Users,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Deployments", href: "/deployments", icon: Rocket },
  { label: "Monitoring", href: "/monitoring", icon: BarChart2 },
  { label: "Settings", href: "/settings", icon: Settings, disabled: true },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Users", href: "/admin/users", icon: Users, adminOnly: true },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText, adminOnly: true },
];

interface SidebarNavProps {
  isAdmin: boolean;
}

export function SidebarNav({ isAdmin }: SidebarNavProps) {
  const pathname = usePathname();

  function NavLink({ item }: { item: NavItem }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

    if (item.disabled) {
      return (
        <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground/50 cursor-not-allowed select-none">
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
          <span className="ml-auto text-[10px] font-medium bg-muted text-muted-foreground/60 px-1.5 py-0.5 rounded">
            Soon
          </span>
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <nav className="space-y-1">
      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Workspace
      </p>
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}

      {isAdmin && (
        <>
          <div className="pt-4">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Admin
            </p>
          </div>
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </>
      )}
    </nav>
  );
}
