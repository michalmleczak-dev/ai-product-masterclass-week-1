"use client";

import { useCallback, useEffect, useState } from "react";

import { todayISO } from "@/lib/date";
import { getMoodDef } from "@/lib/moods";
import { Entry, loadEntries, saveEntries } from "@/lib/storage";

export interface UpsertInput {
  moodLabel: string;
  text: string;
}

export interface UseJournalResult {
  entries: Entry[] | null;
  todayEntry: Entry | null;
  upsertToday: (input: UpsertInput) => Entry;
  ready: boolean;
}

export function useJournal(): UseJournalResult {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const upsertToday = useCallback(
    (input: UpsertInput): Entry => {
      const def = getMoodDef(input.moodLabel);
      if (!def) {
        throw new Error(`Unknown mood label: ${input.moodLabel}`);
      }
      const date = todayISO();
      const now = new Date().toISOString();
      const current = entries ?? loadEntries();
      const existingIdx = current.findIndex((e) => e.date === date);

      let next: Entry[];
      let saved: Entry;

      if (existingIdx >= 0) {
        const existing = current[existingIdx];
        saved = {
          ...existing,
          moodLabel: input.moodLabel,
          moodCategory: def.category,
          text: input.text,
          updatedAt: now,
        };
        next = [...current];
        next[existingIdx] = saved;
      } else {
        saved = {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${date}-${Math.random().toString(36).slice(2)}`,
          date,
          moodLabel: input.moodLabel,
          moodCategory: def.category,
          text: input.text,
          createdAt: now,
          updatedAt: now,
        };
        next = [...current, saved];
      }

      saveEntries(next);
      setEntries(next);
      return saved;
    },
    [entries]
  );

  const todayEntry =
    entries === null ? null : entries.find((e) => e.date === todayISO()) ?? null;

  return {
    entries,
    todayEntry,
    upsertToday,
    ready: entries !== null,
  };
}
