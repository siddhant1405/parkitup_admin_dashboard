"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_ITEMS } from "@/lib/nav";
import { useSites } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: sites } = useSites();
  const pendingCount = sites?.filter((site) => site.status === "submitted").length ?? 0;

  function handleLogout() {
    document.cookie = "parkitup_admin_session=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- static local vector logo, no raster optimization needed */}
        <img src="/logo.svg" alt="ParkItUp" className="size-5" />
        <span className="font-semibold tracking-tight">ParkItUp Admin</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const badgeCount = item.badgeKey === "pending" ? pendingCount : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <item.icon className="size-4" />
                {item.label}
              </span>
              {!!badgeCount && (
                <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5">
                  {badgeCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
