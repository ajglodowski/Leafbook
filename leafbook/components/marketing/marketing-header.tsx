import Link from "next/link";

import { LeafbookIcon } from "@/components/LeafbookIcon";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight"
        >
          <LeafbookIcon size={40} className="text-primary" />
          <span className="text-primary">Leafbook</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/about">
            <Button variant="ghost" size="sm">
              About
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
