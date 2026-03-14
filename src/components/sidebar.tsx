"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Upload,
  ArrowLeftRight,
  FileText,
  Scale,
  ShieldCheck,
  Settings,
  BookOpen,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload Statements", icon: Upload },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/rules", label: "Accounting Rules", icon: ShieldCheck },
  { href: "/reports/profit-loss", label: "Profit & Loss", icon: FileText },
  { href: "/reports/balance-sheet", label: "Balance Sheet", icon: Scale },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <BookOpen className="h-6 w-6 text-accent" />
        <span className="text-lg font-semibold text-foreground">
          Bookkeeper
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
            AC
          </div>
          <div className="text-sm">
            <div className="font-medium text-foreground">My Books</div>
            <div className="text-xs text-muted">Personal</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
