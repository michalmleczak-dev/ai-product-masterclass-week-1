import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { detectCrisis, getGrokKey, GROK_MODEL, GROK_URL } from "@/lib/therapist/grok-client";
import { buildSystemPrompt } from "@/lib/therapist/system-prompt";
import { runTool, THERAPIST_TOOLS } from "@/lib/therapist/tools";
import type { Entry } from "@/lib/storage";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
}

interface RequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  currentEntryId?: string | null;
}

function sse(event: string, data: unknown): Uint8Array {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(payload);
}

async function loadCurrentEntry(
  accessToken: string,
  entryId: string
): Promise<Entry | null> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  const { data, error } = await sb
    .from("entries")
    .select("*")
    .eq("id", entryId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    date: data.date,
    moodLabel: data.mood_label,
    moodCategory: data.mood_category,
    text: data.text,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function POST(request: Request) {
  const apiKey = getGrokKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing XAI_API_KEY" },
      { status: 500 }
    );
  }

  const auth = request.headers.get("authorization") || "";
  const accessToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const currentEntry = body.currentEntryId
    ? await loadCurrentEntry(accessToken, body.currentEntryId)
    : null;

  const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
  const crisis = lastUser ? detectCrisis(lastUser.content) : false;

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(currentEntry) },
    ...body.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (crisis) {
          controller.enqueue(sse("crisis", { helpline: "116 123" }));
        }

        // Loop until model returns a final assistant message (no more tool calls).
        for (let step = 0; step < 5; step++) {
          const upstream = await fetch(GROK_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: GROK_MODEL,
              messages,
              tools: THERAPIST_TOOLS,
              tool_choice: "auto",
              stream: true,
            }),
          });

          if (!upstream.ok || !upstream.body) {
            const detail = await upstream.text().catch(() => "");
            console.error("[therapist] Grok error", upstream.status, detail);
            controller.enqueue(sse("error", { message: "Upstream error" }));
            break;
          }

          const reader = upstream.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let assistantContent = "";
          const toolCalls = new Map<
            number,
            { id: string; name: string; args: string }
          >();

          let done = false;
          while (!done) {
            const { value, done: rdone } = await reader.read();
            if (rdone) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const raw of lines) {
              const line = raw.trim();
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (data === "[DONE]") {
                done = true;
                break;
              }
              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta;
                if (!delta) continue;
                if (typeof delta.content === "string" && delta.content.length > 0) {
                  assistantContent += delta.content;
                  controller.enqueue(sse("token", { text: delta.content }));
                }
                if (Array.isArray(delta.tool_calls)) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    const slot = toolCalls.get(idx) ?? { id: "", name: "", args: "" };
                    if (tc.id) slot.id = tc.id;
                    if (tc.function?.name) slot.name = tc.function.name;
                    if (tc.function?.arguments) slot.args += tc.function.arguments;
                    toolCalls.set(idx, slot);
                  }
                }
              } catch {
                // ignore malformed chunks
              }
            }
          }

          if (toolCalls.size === 0) {
            controller.enqueue(sse("done", {}));
            controller.close();
            return;
          }

          // Execute tool calls, append results, loop.
          const calls = Array.from(toolCalls.values());
          messages.push({
            role: "assistant",
            content: assistantContent,
            tool_calls: calls.map((c) => ({
              id: c.id,
              type: "function",
              function: { name: c.name, arguments: c.args || "{}" },
            })),
          });

          for (const call of calls) {
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = call.args ? JSON.parse(call.args) : {};
            } catch {
              parsedArgs = {};
            }
            controller.enqueue(
              sse("tool_call", { name: call.name, args: parsedArgs })
            );
            const result = await runTool(call.name, parsedArgs, accessToken);
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify(result),
            });
          }
        }

        controller.enqueue(sse("done", {}));
        controller.close();
      } catch (err) {
        console.error("[therapist] stream error", err);
        try {
          controller.enqueue(sse("error", { message: "Stream error" }));
        } catch {}
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
