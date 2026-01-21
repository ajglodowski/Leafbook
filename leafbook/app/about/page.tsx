import { BookOpen, Droplets, Camera, Heart, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing-header";

export const metadata = {
  title: "About | Leafbook",
  description: "Learn about Leafbook — a journaling-first plant care app where tasks don't feel like chores.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <MarketingHeader />

      {/* Main content */}
      <main className="flex-1">
        {/* Hero section */}
        <section className="border-b bg-muted/30 py-20 md:py-32">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-6 font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Plant care that feels like journaling,<br className="hidden sm:inline" /> not chores
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Leafbook is built on a simple philosophy: your relationship with your plants
              should be joyful, not another task on your to-do list.
            </p>
          </div>
        </section>

        {/* Philosophy section */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mx-auto max-w-3xl space-y-16 text-center">
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
                  Our philosophy
                </h2>
                <div className="mx-auto max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  <p>
                    Most plant apps treat care like a chore — red badges, overdue warnings,
                    guilt-inducing notifications. We believe that approach misses the point.
                    Plants aren't tasks to complete. They're living companions with stories
                    worth telling.
                  </p>
                  <p>
                    Leafbook puts journaling first. Yes, we'll gently remind you when your
                    monstera might appreciate some water, but we'll never scold you for being
                    a day late. Instead, we help you build a rich history of each plant's
                    journey — the day you brought it home, its first new leaf, how it survived
                    that winter trip when you forgot to ask anyone to water it.
                  </p>
                </div>
              </div>

              {/* Features grid */}
              <div className="mx-auto grid max-w-3xl gap-10 sm:grid-cols-2 lg:gap-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Journaling first</h3>
                  <p className="max-w-xs leading-relaxed text-muted-foreground">
                    Write about your plants like you would in a diary. Capture moments,
                    observations, and memories that make each plant special.
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10">
                    <Droplets className="h-7 w-7 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Gentle reminders</h3>
                  <p className="max-w-xs leading-relaxed text-muted-foreground">
                    One-tap care logging with no mandatory forms. We suggest when tasks
                    might be due, but we never shame you for the timing.
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10">
                    <Camera className="h-7 w-7 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Visual timeline</h3>
                  <p className="max-w-xs leading-relaxed text-muted-foreground">
                    Watch your plants grow through photos, care events, and journal
                    entries woven together into a beautiful timeline.
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-pink-500/10">
                    <Heart className="h-7 w-7 text-pink-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Your plants, your way</h3>
                  <p className="max-w-xs leading-relaxed text-muted-foreground">
                    Customize care schedules to match your routine. Browse our catalog
                    for guidance, but trust your own observations too.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-xl border-2 border-primary/20 bg-linear-to-b from-muted/50 to-muted/30 p-10 md:p-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                  <Sparkles className="h-8 w-8 text-amber-500" />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="font-serif text-2xl font-semibold md:text-3xl">
                    Ready to start your plant journal?
                  </h3>
                  <p className="mx-auto max-w-md text-muted-foreground">
                    Join plant lovers who've discovered a kinder way to care.
                  </p>
                </div>
                <Link href="/auth/sign-up">
                  <Button size="lg" className="mt-2">
                    Create your journal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>Made with care for plant lovers</p>
        </div>
      </footer>
    </div>
  );
}
