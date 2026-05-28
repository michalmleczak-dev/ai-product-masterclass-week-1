import type { MoodCategory } from "./moods";

export const STORAGE_KEY = "mood_journal_entries";

export interface Entry {
  id: string;
  date: string;
  moodLabel: string;
  moodCategory: MoodCategory;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export function loadEntries(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Entry[];
  } catch {
    return [];
  }
}

export function saveEntries(entries: Entry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota or serialization issue — silently ignore in Phase 1.
  }
}
