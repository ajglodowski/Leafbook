import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { TodayDashboard } from "@/components/today-dashboard";
import { MarketingHeader } from "@/components/marketing-header";
import { getCurrentUserId } from "@/lib/supabase/server";

// Force dynamic rendering since we check auth state
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  // Authenticated users see the Today dashboard at root
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const isAdmin = profile?.role === "admin";

    return (
      <AppShell isAdmin={isAdmin}>
        <TodayDashboard userId={userId} />
      </AppShell>
    );
  }

  // Simple landing for unauthenticated users (full marketing page comes later)
  return (
    <div className="flex min-h-screen flex-col">
      {/* Simple header */}
      <MarketingHeader />

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Leaf className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mb-4 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          A warm, modern<br />plant journal
        </h1>
        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          Journal your plants. Track care with one tap. Build a story for every leaf.
        </p>
        <div className="flex gap-3">
          <Link href="/auth/sign-up">
            <Button size="lg">
              Create your journal
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg">
              Sign in
            </Button>
          </Link>
        </div>
      </main>

      {/* Simple footer */}
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Made with care for plant lovers</p>
        </div>
      </footer>
    </div>
  );
}
