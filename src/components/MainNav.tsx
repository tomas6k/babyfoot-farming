"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import { Menu, X, User, Home, PlusCircle, History } from "lucide-react";

const routes = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
  },
  {
    href: "/match/new",
    label: "Nouveau match",
  },
  {
    href: "/match/history",
    label: "Historique",
  },
];

const mobileRoutes = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: Home,
  },
  {
    href: "/match/new",
    label: "Nouveau match",
    icon: PlusCircle,
  },
  {
    href: "/match/history",
    label: "Historique",
    icon: History,
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Nav du haut (desktop/tablette) */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="text-lg font-pixel whitespace-nowrap">
          Vancelian Babyfoot Kingdom
        </Link>
        <nav className="flex items-center space-x-6 ml-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === route.href
                  ? "text-black dark:text-white"
                  : "text-muted-foreground"
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
      {/* Nav du bas (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex justify-around items-center h-16 md:hidden">
        {mobileRoutes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center justify-center text-xs gap-1 px-2 py-1 transition-colors text-center w-full",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
              )}
              aria-label={route.label}
            >
              <Icon className={cn("h-6 w-6 mx-auto", isActive ? "stroke-2" : "stroke-1.5")}/>
              <span className="text-[10px] leading-none w-full text-center">{route.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
} 