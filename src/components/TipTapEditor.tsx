"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { MicButton } from "@/components/MicButton";

interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TipTapEditor({
  value,
  onChange,
  placeholder = "What's on your mind?",
}: TipTapEditorProps) {
  const recorder = useAudioRecorder();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const abortedRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[160px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. hydration from localStorage)
  // into the editor without re-emitting onUpdate.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", false);
    }
    // We only want this to react to `value` changing externally,
    // so we intentionally omit `editor` from deps to avoid loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Auto-clear transient status messages after 3s
  useEffect(() => {
    if (!statusMessage) return;
    const id = setTimeout(() => setStatusMessage(null), 3000);
    return () => clearTimeout(id);
  }, [statusMessage]);

  // Surface recorder errors as status messages
  useEffect(() => {
    if (recorder.state === "error" && recorder.error) {
      setStatusMessage(recorder.error);
      recorder.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.state, recorder.error]);

  const handleStartRecording = async () => {
    abortedRef.current = false;
    setStatusMessage(null);
    await recorder.start();
  };

  const handleStopRecording = async () => {
    const blob = await recorder.stop();
    if (!blob || blob.size === 0) {
      recorder.reset();
      setStatusMessage("Nagranie jest puste.");
      return;
    }

    recorder.setProcessing();

    try {
      const ext = (recorder.mimeType ?? "audio/webm").includes("mp4")
        ? "mp4"
        : "webm";
      const form = new FormData();
      form.append("file", blob, `voice-note.${ext}`);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      });

      if (abortedRef.current) return;

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 413) {
          setStatusMessage("Nagranie zbyt długie (max ~25 MB).");
        } else {
          setStatusMessage(
            (data as { error?: string })?.error ??
              "Nie udało się przetworzyć — spróbuj ponownie."
          );
        }
        recorder.reset();
        return;
      }

      const { text } = (await res.json()) as { text: string };
      if (!text || !text.trim()) {
        setStatusMessage("Nie rozpoznano mowy.");
        recorder.reset();
        return;
      }

      if (editor && !editor.isDestroyed) {
        editor.chain().focus().insertContent(text.trim() + " ").run();
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
      }
      recorder.reset();
    } catch (err) {
      console.error(err);
      if (!abortedRef.current) {
        setStatusMessage("Błąd sieci — spróbuj ponownie.");
        recorder.reset();
      }
    }
  };

  if (!editor) {
    return (
      <div
        className="min-h-[160px] w-full rounded-md border border-input bg-white"
        aria-hidden
      />
    );
  }

  const btn = (active: boolean) =>
    cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:bg-accent",
      active && "border-input bg-accent text-foreground"
    );

  const micDisabled =
    recorder.state === "processing" || !editor || editor.isDestroyed;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Bold"
          className={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Italic"
          className={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Bullet list"
          className={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Ordered list"
          className={btn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <MicButton
          state={recorder.state}
          durationMs={recorder.durationMs}
          disabled={micDisabled}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
        />
      </div>
      <div
        className={cn(
          "rounded-md transition-colors duration-500",
          flash && "ring-2 ring-green-400 ring-offset-1"
        )}
      >
        <EditorContent editor={editor} />
      </div>
      {statusMessage && (
        <p
          role="status"
          className="text-xs text-muted-foreground"
          data-testid="mic-status"
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
}
