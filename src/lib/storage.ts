import type { MoodCategory } from "./moods";
import { supabase, type EntryRow } from "./supabase";

export interface Entry {
  id: string;
  date: string;
  moodLabel: string;
  moodCategory: MoodCategory;
  text: string;
  createdAt: string;
  updatedAt: string;
}

function fromRow(row: EntryRow): Entry {
  return {
    id: row.id,
    date: row.date,
    moodLabel: row.mood_label,
    moodCategory: row.mood_category as MoodCategory,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(e: Entry): EntryRow {
  return {
    id: e.id,
    date: e.date,
    mood_label: e.moodLabel,
    mood_category: e.moodCategory,
    text: e.text,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

export async function loadEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("date", { ascending: false });
  if (error) {
    console.error("[storage] loadEntries failed", error);
    return [];
  }
  return (data ?? []).map(fromRow);
}

export async function upsertEntry(entry: Entry): Promise<Entry> {
  const { data, error } = await supabase
    .from("entries")
    .upsert(toRow(entry), { onConflict: "user_id,date" })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return fromRow(data as EntryRow);
}

export async function upsertEntries(entries: Entry[]): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await supabase
    .from("entries")
    .upsert(entries.map(toRow), { onConflict: "user_id,date" });
  if (error) {
    console.error("[storage] upsertEntries failed", error);
  }
}
