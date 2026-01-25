import { Leaf } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight text-primary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
          <span>Leafbook</span>
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
