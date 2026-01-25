import { ArrowLeft, Library, Loader2,Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/supabase/server";

async function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage catalog and settings</p>
          </div>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Button>
        </Link>
      </div>

      {/* Admin navigation */}
      <nav className="flex gap-2">
        <Link href="/admin/plant-types">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Library className="h-4 w-4" />
            Plant Types
          </Button>
        </Link>
      </nav>

      {/* Content */}
      {children}
    </div>
  );
}

function AdminLayoutLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminLayoutLoading />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
