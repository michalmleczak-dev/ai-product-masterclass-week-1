export type MoodCategory =
  | "Positive"
  | "Calm"
  | "Low"
  | "Difficult"
  | "Intense";

export type MoodFace = "happy" | "neutral" | "sad" | "angry";

export interface MoodCategoryDef {
  category: MoodCategory;
  labels: string[];
  bg: string;
  text: string;
  face: MoodFace;
  recommendation: string;
}

export const MOOD_CATEGORIES: MoodCategoryDef[] = [
  {
    category: "Positive",
    labels: ["Joyful", "Cheerful", "Content", "Excited", "Grateful"],
    bg: "#F5C842",
    text: "#1A1A1A",
    face: "happy",
    recommendation:
      "You're in a great headspace. Use this energy — reach out to someone, start that task, or simply enjoy the moment.",
  },
  {
    category: "Calm",
    labels: ["Peaceful", "Relaxed", "Focused", "Reflective"],
    bg: "#A8D5BA",
    text: "#1A1A1A",
    face: "happy",
    recommendation:
      "Steady and clear. A good time to reflect, plan, or do deep work.",
  },
  {
    category: "Low",
    labels: ["Tired", "Bored", "Indifferent", "Drained"],
    bg: "#C9C9D3",
    text: "#1A1A1A",
    face: "neutral",
    recommendation:
      "Low energy is a signal, not a flaw. Rest, a short walk, or a change of scene can shift things.",
  },
  {
    category: "Difficult",
    labels: ["Anxious", "Sad", "Frustrated", "Overwhelmed"],
    bg: "#E8856A",
    text: "#FFFFFF",
    face: "sad",
    recommendation:
      "Something's weighing on you. Writing it out is already a step. Be kind to yourself today.",
  },
  {
    category: "Intense",
    labels: ["Angry", "Despairing", "Heartbroken", "Devastated"],
    bg: "#C0392B",
    text: "#FFFFFF",
    face: "angry",
    recommendation:
      "This is a hard moment. Take a breath. You don't have to solve everything right now — just get through today.",
  },
];

const LABEL_TO_DEF = new Map<string, MoodCategoryDef>(
  MOOD_CATEGORIES.flatMap((def) =>
    def.labels.map((label) => [label, def] as const)
  )
);

export function getMoodDef(label: string): MoodCategoryDef | undefined {
  return LABEL_TO_DEF.get(label);
}

export function getMoodDefByCategory(
  category: MoodCategory
): MoodCategoryDef | undefined {
  return MOOD_CATEGORIES.find((def) => def.category === category);
}

export const ALL_LABELS: string[] = MOOD_CATEGORIES.flatMap((d) => d.labels);
