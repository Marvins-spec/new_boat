"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Receipt,
  ChefHat,
  UtensilsCrossed,
  Package,
  Calculator,
  Settings,
  Anchor,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Cashier", icon: Receipt },
  { href: "/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/serving", label: "Serving", icon: UtensilsCrossed },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/calculator", label: "Cost Calculator", icon: Calculator },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Anchor className="h-5 w-5 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                The Boat House
              </h1>
              <p className="text-xs text-muted-foreground">Restaurant POS</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
