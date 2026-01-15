"use client";

import { useState, useTransition } from "react";
import { Droplets, Sparkles, Check, ChevronDown, Calendar, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { logCareEvent } from "./actions";

interface CareButtonProps {
  plantId: string;
  eventType: "watered" | "fertilized" | "repotted";
  variant: "water" | "fertilize" | "repot";
}

const variantConfig = {
  water: {
    icon: Droplets,
    label: "Water",
    doneLabel: "Watered!",
    pastLabel: "watered",
    className: "bg-blue-500 hover:bg-blue-600 text-white",
  },
  fertilize: {
    icon: Sparkles,
    label: "Fertilize",
    doneLabel: "Fed!",
    pastLabel: "fertilized",
    className: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  repot: {
    icon: Droplets,
    label: "Repot",
    doneLabel: "Repotted!",
    pastLabel: "repotted",
    className: "bg-orange-500 hover:bg-orange-600 text-white",
  },
};

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDaysAgo(dateString: string): number {
  const selected = new Date(dateString + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diffTime = today.getTime() - selected.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function CareButton({ plantId, eventType, variant }: CareButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
  const config = variantConfig[variant];
  const Icon = config.icon;

  async function handleLog(daysAgo: number = 0) {
    const eventDate = daysAgo > 0 ? getDateDaysAgo(daysAgo) : undefined;
    
    startTransition(async () => {
      const result = await logCareEvent(plantId, eventType, eventDate);
      if (result.success) {
        setDoneMessage(
          daysAgo === 0 
            ? config.doneLabel 
            : daysAgo === 1 
              ? `${config.pastLabel} yesterday` 
              : `${config.pastLabel} ${daysAgo} days ago`
        );
        setIsDone(true);
        setShowDatePicker(false);
        setTimeout(() => {
          setIsDone(false);
          setDoneMessage("");
        }, 2000);
      }
    });
  }

  function handleDateSubmit() {
    const daysAgo = getDaysAgo(selectedDate);
    if (daysAgo < 0) {
      // Don't allow future dates
      return;
    }
    handleLog(daysAgo);
  }

  if (isDone) {
    return (
      <Button size="sm" disabled className="gap-1 bg-green-500 text-white">
        <Check className="h-4 w-4" />
        {doneMessage || config.doneLabel}
      </Button>
    );
  }

  return (
    <>
      <div className="flex">
        <Button
          size="sm"
          onClick={() => handleLog(0)}
          disabled={isPending}
          className={`gap-1 rounded-r-none ${config.className}`}
        >
          <Icon className="h-4 w-4" />
          {isPending ? "..." : config.label}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="sm"
                className={`px-1.5 rounded-l-none border-l border-white/20 ${config.className}`}
                disabled={isPending}
              />
            }
          >
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleLog(0)}>
              <Calendar className="h-4 w-4" />
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLog(1)}>
              Yesterday
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLog(2)}>
              2 days ago
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLog(3)}>
              3 days ago
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleLog(7)}>
              1 week ago
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowDatePicker(true)}>
              <CalendarDays className="h-4 w-4" />
              Pick a date...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <AlertDialogContent className="max-w-xs">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg">
              When did you {config.label.toLowerCase()} this plant?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select the date you {config.pastLabel} this plant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="care-date" className="sr-only">Date</Label>
            <Input
              id="care-date"
              type="date"
              value={selectedDate}
              max={formatDateForInput(new Date())}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleDateSubmit} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
