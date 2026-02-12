import Link from "next/link";

import { LeafbookLogo } from "@/components/LeafbookLogo";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  // Simple landing for unauthenticated users (full marketing page comes later)
  return (
    <div className="flex min-h-screen flex-col">
      {/* Simple header */}
      <MarketingHeader />

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6">
          <LeafbookLogo width={120} height={144} />
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
