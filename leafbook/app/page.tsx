import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

// Force dynamic rendering since we check auth state
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Authenticated users go straight to Today
  if (data?.user) {
    redirect("/today");
  }

  // Simple landing for unauthenticated users (full marketing page comes later)
  return (
    <div className="flex min-h-screen flex-col">
      {/* Simple header */}
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <span>Leafbook</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/auth/login" />}>
              Sign in
            </Button>
            <Button size="sm" render={<Link href="/auth/sign-up" />}>
              Get started
            </Button>
          </div>
        </div>
      </header>

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
          <Button size="lg" render={<Link href="/auth/sign-up" />}>
            Create your journal
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/auth/login" />}>
            Sign in
          </Button>
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
