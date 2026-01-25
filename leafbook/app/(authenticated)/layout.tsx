import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/app/(authenticated)/app-shell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/supabase/server";

async function AuthenticatedLayoutContent({
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const isAdmin = profile?.role === "admin";

  return <AppShell isAdmin={isAdmin}>{children}</AppShell>;
}

function AuthenticatedLayoutLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthenticatedLayoutLoading />}>
      <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
    </Suspense>
  );
}
