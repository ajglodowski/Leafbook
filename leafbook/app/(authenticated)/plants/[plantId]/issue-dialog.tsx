"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  createPlantIssue,
  updatePlantIssue,
  resolvePlantIssue,
  deletePlantIssue,
  type IssueType,
  type IssueSeverity,
} from "./actions";

// Human-friendly labels for issue types
const issueTypeLabels: Record<IssueType, string> = {
  pest: "Pests",
  disease: "Disease",
  overwatering: "Overwatering",
  underwatering: "Underwatering",
  sunburn: "Sunburn",
  etiolation: "Stretching/Etiolation",
  nutrient_deficiency: "Nutrient Deficiency",
  root_rot: "Root Rot",
  dropping_leaves: "Dropping Leaves",
  yellowing: "Yellowing",
  browning: "Browning",
  wilting: "Wilting",
  other: "Other",
};

const issueTypes: IssueType[] = [
  "pest",
  "disease",
  "overwatering",
  "underwatering",
  "sunburn",
  "etiolation",
  "nutrient_deficiency",
  "root_rot",
  "dropping_leaves",
  "yellowing",
  "browning",
  "wilting",
  "other",
];

// Human-friendly labels for severity levels
const severityLabels: Record<IssueSeverity, { label: string; color: string }> = {
  low: { label: "Low", color: "text-blue-600" },
  medium: { label: "Medium", color: "text-yellow-600" },
  high: { label: "High", color: "text-orange-600" },
  critical: { label: "Critical", color: "text-red-600" },
};

const severityLevels: IssueSeverity[] = ["low", "medium", "high", "critical"];

interface IssueData {
  id: string;
  issue_type: string;
  severity: string;
  status: string;
  description: string | null;
  started_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

interface IssueDialogProps {
  plantId: string;
  plantName: string;
  issue?: IssueData; // If provided, we're editing; otherwise creating
  trigger?: React.ReactNode;
}

export function IssueDialog({
  plantId,
  plantName,
  issue,
  trigger,
}: IssueDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  const isEditing = !!issue;
  const isResolved = issue?.status === "resolved";

  const [issueType, setIssueType] = useState<IssueType>(
    (issue?.issue_type as IssueType) || "other"
  );
  const [severity, setSeverity] = useState<IssueSeverity>(
    (issue?.severity as IssueSeverity) || "medium"
  );
  const [description, setDescription] = useState(issue?.description || "");
  const [startedAt, setStartedAt] = useState(
    issue?.started_at
      ? issue.started_at.split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIssueType((issue?.issue_type as IssueType) || "other");
      setSeverity((issue?.severity as IssueSeverity) || "medium");
      setDescription(issue?.description || "");
      setStartedAt(
        issue?.started_at
          ? issue.started_at.split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setResolutionNotes("");
      setError(null);
    }
  }, [isOpen, issue]);

  async function handleSubmit() {
    setError(null);

    startTransition(async () => {
      let result;

      if (isEditing && issue) {
        result = await updatePlantIssue(issue.id, {
          issueType,
          severity,
          description: description.trim() || null,
          startedAt,
        });
      } else {
        result = await createPlantIssue(plantId, {
          issueType,
          severity,
          description: description.trim() || null,
          startedAt,
        });
      }

      if (result.success) {
        setIsOpen(false);
        // Reset form for next use
        setIssueType("other");
        setSeverity("medium");
        setDescription("");
        setStartedAt(new Date().toISOString().split("T")[0]);
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  async function handleResolve() {
    if (!issue) return;

    startTransition(async () => {
      const result = await resolvePlantIssue(issue.id, {
        resolutionNotes: resolutionNotes.trim() || null,
      });

      if (result.success) {
        setIsOpen(false);
        setShowResolveDialog(false);
        router.refresh();
      } else {
        setError(result.error || "Could not resolve issue");
        setShowResolveDialog(false);
      }
    });
  }

  async function handleDelete() {
    if (!issue) return;

    startTransition(async () => {
      const result = await deletePlantIssue(issue.id);
      if (result.success) {
        setIsOpen(false);
        setShowDeleteConfirm(false);
        router.refresh();
      } else {
        setError(result.error || "Could not delete issue");
        setShowDeleteConfirm(false);
      }
    });
  }

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        {trigger ? (
          <div onClick={() => setIsOpen(true)} className="cursor-pointer">
            {trigger}
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsOpen(true)} className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Report issue
          </Button>
        )}

        <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl font-semibold">
              {isEditing ? "Edit issue" : "Report an issue"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEditing
                ? `Update this issue for ${plantName}.`
                : `What's wrong with ${plantName}? Tracking issues helps you monitor your plant's health.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Issue type */}
            <div className="space-y-2">
              <Label htmlFor="issue-type">Issue type *</Label>
              <Select
                value={issueType}
                onValueChange={(value) => setIssueType(value as IssueType)}
                disabled={isResolved}
              >
                <SelectTrigger id="issue-type">
                  <span>{issueTypeLabels[issueType]}</span>
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {issueTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={severity}
                onValueChange={(value) => setSeverity(value as IssueSeverity)}
                disabled={isResolved}
              >
                <SelectTrigger id="severity">
                  <span className={severityLabels[severity].color}>
                    {severityLabels[severity].label}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      <span className={severityLabels[level].color}>
                        {severityLabels[level].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description (optional) */}
            <div className="space-y-2">
              <Label htmlFor="issue-description">Notes (optional)</Label>
              <Textarea
                id="issue-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you noticing? Any context that might help track this issue?"
                rows={3}
                disabled={isResolved}
              />
            </div>

            {/* Start date */}
            <div className="space-y-2">
              <Label htmlFor="started-at" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                When did you notice this?
              </Label>
              <Input
                id="started-at"
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                disabled={isResolved}
              />
              <p className="text-xs text-muted-foreground">
                Backdate if you noticed this issue earlier
              </p>
            </div>

            {/* Show resolution info if resolved */}
            {isResolved && issue && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Resolved on {issue.resolved_at?.split("T")[0]}
                </div>
                {issue.resolution_notes && (
                  <p className="text-sm text-muted-foreground">
                    {issue.resolution_notes}
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            {isEditing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-1 sm:mr-auto"
              >
                <Trash2 className="h-4 w-4" />
                Delete issue
              </Button>
            )}
            {isEditing && !isResolved && (
              <Button
                variant="outline"
                onClick={() => setShowResolveDialog(true)}
                className="gap-1.5"
              >
                <CheckCircle className="h-4 w-4" />
                Mark resolved
              </Button>
            )}
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!isResolved && (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? isEditing
                    ? "Saving..."
                    : "Reporting..."
                  : isEditing
                  ? "Save changes"
                  : "Report issue"}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resolve confirmation dialog */}
      <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve this issue?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this {issueTypeLabels[issueType].toLowerCase()} issue as resolved.
              You can optionally add notes about how it was fixed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="resolution-notes">Resolution notes (optional)</Label>
            <Textarea
              id="resolution-notes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="What fixed the issue? Any learnings for next time?"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleResolve} disabled={isPending} className="gap-1.5">
              <CheckCircle className="h-4 w-4" />
              {isPending ? "Resolving..." : "Resolve"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete issue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this issue from {plantName}'s records. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep issue</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
