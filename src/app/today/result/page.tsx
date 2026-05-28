"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { MoodBlob } from "@/components/MoodBlob";
import { useJournal } from "@/hooks/useJournal";
import { getMoodDef } from "@/lib/moods";
import { stripHtml, truncate } from "@/lib/html";

export default function ResultPage() {
  const router = useRouter();
  const { todayEntry, ready } = useJournal();

  useEffect(() => {
    if (ready && !todayEntry) {
      router.replace("/today");
    }
  }, [ready, todayEntry, router]);

  if (!todayEntry) {
    return (
      <main className="px-5 py-10 text-sm text-muted-foreground">Loading…</main>
    );
  }

  const def = getMoodDef(todayEntry.moodLabel);
  if (!def) {
    return (
      <main className="px-5 py-10 text-sm text-muted-foreground">
        Unknown mood label.
      </main>
    );
  }

  const preview = truncate(stripHtml(todayEntry.text), 100);

  return (
    <>
      {/* Full-bleed background that escapes the 390px wrapper */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{ backgroundColor: def.bg }}
      />
      <main
        className="relative flex min-h-dvh flex-col px-5 py-6"
        style={{ color: def.text }}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/today"
            aria-label="Back"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/10 hover:bg-black/20"
            style={{ color: def.text }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-xs uppercase tracking-wider opacity-80">
            {def.category}
          </span>
          <span className="w-9" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <MoodBlob face={def.face} color="rgba(255,255,255,0.35)" size={180} />
          <h1 className="mt-6 text-4xl font-bold tracking-tight">
            {todayEntry.moodLabel}
          </h1>
          <p className="mt-4 max-w-[300px] text-sm leading-relaxed opacity-90">
            {def.recommendation}
          </p>
          {preview && (
            <p className="mt-6 max-w-[300px] text-sm italic opacity-80">
              &ldquo;{preview}&rdquo;
            </p>
          )}
        </div>

        <Link
          href="/entries"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-black/10 px-5 py-3 text-sm font-medium hover:bg-black/20"
          style={{ color: def.text }}
        >
          View all entries <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
    </>
  );
}
