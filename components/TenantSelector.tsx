"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Globe } from "lucide-react";

export interface Tenant {
  id: string;
  label: string;
}

interface TenantSelectorProps {
  tenants: Tenant[];
  defaultTenant: string;
  isAdmin: boolean;
}

export function TenantSelector({ tenants, defaultTenant, isAdmin }: TenantSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTenant = searchParams.get("tenant") ?? defaultTenant;

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tenant", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/50 text-sm">
        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="truncate text-muted-foreground font-medium">
          {tenants[0]?.label ?? currentTenant}
        </span>
      </div>
    );
  }

  const allOptions: Tenant[] = [
    { id: "all", label: "All Projects" },
    ...tenants,
  ];

  return (
    <Select value={currentTenant} onValueChange={handleChange}>
      <SelectTrigger className="w-full h-9 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          {currentTenant === "all" ? (
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {allOptions.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            <div className="flex items-center gap-2">
              {t.id === "all" ? (
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {t.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
