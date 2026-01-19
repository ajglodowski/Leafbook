"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Leaf,
  BookOpen,
  Heart,
  Library,
  Settings,
  LogOut,
  Shield,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Today", icon: CalendarCheck },
  { href: "/plants", label: "Plants", icon: Leaf },
  { href: "/plant-types", label: "Catalog", icon: Library },
  { href: "/pots", label: "Pots", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/journal", label: "Journal", icon: BookOpen },
];

export function AppShell({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const isAdminSection = pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center px-4 md:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight text-primary mr-6"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden sm:inline">Leafbook</span>
          </Link>

          {/* Main nav */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-1.5",
                      isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-1">
            {isAdmin && (
              <>
                <Link href="/admin">
                  <Button
                    variant={isAdminSection ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-1.5",
                      isAdminSection && "bg-amber-500/10 text-amber-600 hover:bg-amber-500/15"
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Button>
                </Link>
                <Separator orientation="vertical" className="mx-1 h-6" />
              </>
            )}
            <ThemeSwitcher />
            <Link href="/pots">
              <Button 
                variant={pathname === "/pots" ? "secondary" : "ghost"} 
                size="icon-sm" 
                title="Pot inventory"
                className={cn(
                  pathname === "/pots" && "bg-orange-500/10 text-orange-600 hover:bg-orange-500/15"
                )}
              >
                <Package className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon-sm">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="container max-w-5xl px-4 py-6 md:px-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container max-w-5xl px-4 md:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <p>Leafbook — A warm, modern plant journal</p>
          <p className="hidden sm:block">Made with care for plant lovers</p>
        </div>
      </footer>
    </div>
  );
}
