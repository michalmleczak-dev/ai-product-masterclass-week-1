"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EntryCard } from "@/components/EntryCard";
import { useJournal } from "@/hooks/useJournal";

export default function EntriesPage() {
  const { entries, ready } = useJournal();

  const sorted = (entries ?? [])
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <main className="px-5 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/today"
          aria-label="Back"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold leading-tight">Your Journal</h1>
      </header>

      {!ready ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <div className="text-4xl" aria-hidden>
            🌱
          </div>
          <div>
            <p className="text-sm font-medium">No entries yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with today.
            </p>
          </div>
          <Button asChild>
            <Link href="/today">Today&apos;s entry</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </main>
  );
}
