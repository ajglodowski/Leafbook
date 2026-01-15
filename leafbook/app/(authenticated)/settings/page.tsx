import { Settings } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Empty state */}
      <EmptyState
        icon={Settings}
        title="Settings coming soon"
        description="Account settings, notification preferences, and more will appear here."
      />
    </div>
  );
}
