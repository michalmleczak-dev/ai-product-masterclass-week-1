"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type NavItem = { id: string; label: string; method: "GET" | "POST"; path: string };

type NavSection = { title: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    title: "Create",
    items: [
      { id: "create-entry", label: "Create entry", method: "POST", path: "/api/entries" },
      { id: "create-transcribe", label: "Transcribe audio", method: "POST", path: "/api/transcribe" },
    ],
  },
  {
    title: "Ask",
    items: [
      { id: "ask-agent", label: "Ask agent", method: "POST", path: "/api/agent" },
      { id: "ask-therapist", label: "Therapist chat (stream)", method: "POST", path: "/api/therapist/chat" },
    ],
  },
  {
    title: "Read",
    items: [
      { id: "read-entry", label: "Get entry by date", method: "GET", path: "/api/entries/{date}" },
    ],
  },
];

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  const color =
    method === "GET"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-blue-50 text-blue-700 ring-blue-200";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset ${color}`}
    >
      {method}
    </span>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12.5px] text-zinc-800">
      {children}
    </code>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-[12.5px] leading-relaxed text-zinc-100">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

function Endpoint({
  id,
  method,
  path,
  children,
}: {
  id: string;
  method: "GET" | "POST";
  path: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-zinc-200 pb-12 pt-2">
      <div className="mb-4 flex items-center gap-2">
        <MethodBadge method={method} />
        <code className="font-mono text-[14px] text-zinc-900">{path}</code>
      </div>
      {children}
    </section>
  );
}

export default function DocsPage() {
  const [active, setActive] = useState<string>("create-entry");
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ids = NAV.flatMap((s) => s.items.map((i) => i.id));
    const handler = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - 120 <= 0) current = id;
      }
      setActive(current);
    };
    handler();
    // On desktop the scroll container is <main>; on mobile it's the window.
    const mainEl = mainRef.current;
    window.addEventListener("scroll", handler, { passive: true });
    mainEl?.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      mainEl?.removeEventListener("scroll", handler);
    };
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 24;

    const findScroller = (node: HTMLElement | null): HTMLElement | null => {
      let n: HTMLElement | null = node?.parentElement ?? null;
      while (n && n !== document.body) {
        const cs = window.getComputedStyle(n);
        const oy = cs.overflowY;
        if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) {
          return n;
        }
        n = n.parentElement;
      }
      return null;
    };

    const scroller = findScroller(el);
    if (scroller) {
      const containerRect = scroller.getBoundingClientRect();
      const top =
        scroller.scrollTop + el.getBoundingClientRect().top - containerRect.top - offset;
      scroller.scrollTo({ top, behavior: "smooth" });
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setActive(id);
  }, []);

  return (
    <div className="bg-white">
      <div className="flex min-h-dvh flex-col md:flex-row">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 md:hidden">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Mood Journal
          </Link>
          <span className="text-xs text-zinc-500">Docs</span>
        </header>

        {/* Left nav */}
        <aside className="border-b border-zinc-200 bg-white px-5 py-6 md:sticky md:top-0 md:h-dvh md:w-72 md:flex-none md:overflow-y-auto md:border-b-0 md:border-r md:px-6 md:py-8">
          <div className="mb-6 hidden md:block">
            <Link href="/" className="text-[15px] font-semibold tracking-tight text-zinc-900">
              Mood Journal
            </Link>
            <p className="mt-0.5 text-xs text-zinc-500">API Documentation</p>
          </div>

          <nav className="space-y-6">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                API
              </p>
              <ul className="space-y-5">
                {NAV.map((section) => (
                  <li key={section.title}>
                    <p className="mb-1.5 text-[12px] font-semibold text-zinc-900">
                      {section.title}
                    </p>
                    <ul className="space-y-0.5 border-l border-zinc-200">
                      {section.items.map((item) => {
                        const isActive = active === item.id;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => scrollToSection(item.id)}
                              className={`-ml-px flex w-full items-center gap-2 border-l py-1 pl-3 text-left text-[13px] transition-colors ${
                                isActive
                                  ? "border-zinc-900 font-medium text-zinc-900"
                                  : "border-transparent text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                              }`}
                            >
                              <span>{item.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main ref={mainRef} className="flex-1 bg-white">
          <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-10 md:py-14">
            <div className="mb-10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                API Reference
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                Mood Journal API
              </h1>
              <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-zinc-600">
                The Mood Journal API lets you create entries, read past entries by date,
                and talk to the in-app AI therapist. All endpoints (except where noted)
                are scoped to the authenticated user and return JSON.
              </p>

              <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-zinc-600">
                  Authentication
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-700">
                  All <Code>/api/*</Code> endpoints (except <Code>/api/transcribe</Code>)
                  require a Supabase access token sent as a Bearer header:
                </p>
                <Pre>{`Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`}</Pre>
              </div>
            </div>

            {/* --- Create section --- */}
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Create
            </h2>

            <Endpoint id="create-entry" method="POST" path="/api/entries">
              <h3 className="mb-2 text-xl font-semibold text-zinc-900">Create or update an entry</h3>
              <p className="mb-4 text-[14px] leading-relaxed text-zinc-700">
                Creates a journal entry for a given date, or replaces text + mood on the
                existing one (upserted by <Code>user_id + date</Code>). If <Code>mood</Code>{" "}
                is omitted, the mood score (1–5) is inferred from <Code>text</Code> by the
                Claude-backed mood inferrer.
              </p>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Body</h4>
              <Pre>{`{
  "text": "string (required)",
  "date": "YYYY-MM-DD (optional, defaults to today)",
  "mood": "integer 1..5 (optional, otherwise inferred)"
}`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Example</h4>
              <Pre>{`curl -X POST https://your-app.vercel.app/api/entries \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "text": "Great walk in the park today.", "date": "2026-06-07" }'`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Response · 201</h4>
              <Pre>{`{
  "entry": {
    "id": "uuid",
    "date": "2026-06-07",
    "moodLabel": "Happy",
    "moodCategory": "Positive",
    "text": "Great walk in the park today.",
    "createdAt": "2026-06-07T12:34:56.000Z",
    "updatedAt": "2026-06-07T12:34:56.000Z"
  }
}`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Errors</h4>
              <ul className="space-y-1 text-[13.5px] text-zinc-700">
                <li><Code>400</Code> — invalid JSON, missing <Code>text</Code>, bad date or mood.</li>
                <li><Code>401</Code> — missing or invalid Bearer token.</li>
                <li><Code>500</Code> — database error.</li>
                <li><Code>502</Code> — mood inference upstream failed.</li>
              </ul>
            </Endpoint>

            <Endpoint id="create-transcribe" method="POST" path="/api/transcribe">
              <h3 className="mb-2 text-xl font-semibold text-zinc-900">Transcribe audio</h3>
              <p className="mb-4 text-[14px] leading-relaxed text-zinc-700">
                Forwards an audio file to Groq&apos;s Whisper&nbsp;v3 endpoint and returns
                the transcript. Polish (<Code>pl</Code>) is the active language. Max upload
                size: <Code>25&nbsp;MB</Code>. This endpoint does not require auth.
              </p>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Body</h4>
              <p className="mb-2 text-[13.5px] text-zinc-700">
                <Code>multipart/form-data</Code> with a single <Code>file</Code> field
                containing the audio blob (e.g. <Code>audio/webm</Code>).
              </p>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Example</h4>
              <Pre>{`curl -X POST https://your-app.vercel.app/api/transcribe \\
  -F "file=@recording.webm"`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Response · 200</h4>
              <Pre>{`{ "text": "transcribed speech goes here" }`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Errors</h4>
              <ul className="space-y-1 text-[13.5px] text-zinc-700">
                <li><Code>400</Code> — invalid form data, missing or empty <Code>file</Code>.</li>
                <li><Code>413</Code> — file exceeds 25 MB.</li>
                <li><Code>500</Code> — server misconfigured (missing <Code>GROQ_API_KEY</Code>).</li>
                <li><Code>502</Code> — Groq upstream error.</li>
              </ul>
            </Endpoint>

            {/* --- Ask section --- */}
            <h2 className="mb-6 mt-14 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ask
            </h2>

            <Endpoint id="ask-agent" method="POST" path="/api/agent">
              <h3 className="mb-2 text-xl font-semibold text-zinc-900">Ask the agent (non-streaming)</h3>
              <p className="mb-4 text-[14px] leading-relaxed text-zinc-700">
                Runs the in-app Claude agent over a chat history and returns the full reply
                in a single response. Pass an optional <Code>date</Code> so the agent has
                the corresponding journal entry as context.
              </p>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Body</h4>
              <Pre>{`{
  "messages": [
    { "role": "user" | "assistant", "content": "string" }
  ],                                     // must end with a user message
  "date": "YYYY-MM-DD (optional)"        // entry on that date is loaded as context
}`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Example</h4>
              <Pre>{`curl -X POST https://your-app.vercel.app/api/agent \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Why have I felt low this week?" }
    ],
    "date": "2026-06-07"
  }'`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Response · 200</h4>
              <Pre>{`{
  "reply": "Looking at your entries this week ...",
  "toolCalls": [ /* tool invocations the agent made */ ],
  "crisis": false
}`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Errors</h4>
              <ul className="space-y-1 text-[13.5px] text-zinc-700">
                <li><Code>400</Code> — invalid JSON, bad <Code>messages</Code>, or bad <Code>date</Code>.</li>
                <li><Code>401</Code> — missing or invalid Bearer token.</li>
                <li><Code>500</Code> — database or internal error.</li>
              </ul>
            </Endpoint>

            <Endpoint id="ask-therapist" method="POST" path="/api/therapist/chat">
              <h3 className="mb-2 text-xl font-semibold text-zinc-900">Therapist chat (streaming)</h3>
              <p className="mb-4 text-[14px] leading-relaxed text-zinc-700">
                Same agent as <Code>/api/agent</Code>, but streamed as Server-Sent Events.
                Use this for the in-app therapist panel to render the reply token-by-token.
              </p>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Body</h4>
              <Pre>{`{
  "messages": [
    { "role": "user" | "assistant", "content": "string" }
  ],
  "currentEntryId": "uuid (optional) — entry to load as context"
}`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Response · 200 · text/event-stream</h4>
              <p className="mb-2 text-[13.5px] text-zinc-700">
                Events emitted as SSE frames (<Code>event:</Code> + <Code>data:</Code>):
              </p>
              <ul className="mb-3 space-y-1 text-[13.5px] text-zinc-700">
                <li><Code>token</Code> — <Code>{`{ "text": "partial..." }`}</Code></li>
                <li><Code>tool_call</Code> — agent invoked a tool</li>
                <li><Code>crisis</Code> — <Code>{`{ "helpline": "116 123" }`}</Code> if a crisis signal is detected</li>
                <li><Code>done</Code> — stream finished</li>
                <li><Code>error</Code> — <Code>{`{ "message": "..." }`}</Code></li>
              </ul>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Errors</h4>
              <ul className="space-y-1 text-[13.5px] text-zinc-700">
                <li><Code>400</Code> — invalid JSON or empty <Code>messages</Code>.</li>
                <li><Code>401</Code> — missing or invalid Bearer token.</li>
              </ul>
            </Endpoint>

            {/* --- Read section --- */}
            <h2 className="mb-6 mt-14 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Read
            </h2>

            <Endpoint id="read-entry" method="GET" path="/api/entries/{date}">
              <h3 className="mb-2 text-xl font-semibold text-zinc-900">Get entry by date</h3>
              <p className="mb-4 text-[14px] leading-relaxed text-zinc-700">
                Returns the authenticated user&apos;s entry for the given date, if any.
              </p>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Path parameter</h4>
              <ul className="space-y-1 text-[13.5px] text-zinc-700">
                <li><Code>date</Code> — ISO date in <Code>YYYY-MM-DD</Code> format.</li>
              </ul>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Example</h4>
              <Pre>{`curl https://your-app.vercel.app/api/entries/2026-06-07 \\
  -H "Authorization: Bearer $TOKEN"`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Response · 200</h4>
              <Pre>{`{
  "entry": {
    "id": "uuid",
    "date": "2026-06-07",
    "moodLabel": "Happy",
    "moodCategory": "Positive",
    "text": "Great walk in the park today.",
    "createdAt": "2026-06-07T12:34:56.000Z",
    "updatedAt": "2026-06-07T12:34:56.000Z"
  }
}`}</Pre>

              <h4 className="mb-2 mt-6 text-[13px] font-semibold text-zinc-900">Errors</h4>
              <ul className="space-y-1 text-[13.5px] text-zinc-700">
                <li><Code>400</Code> — date not in <Code>YYYY-MM-DD</Code> format.</li>
                <li><Code>401</Code> — missing or invalid Bearer token.</li>
                <li><Code>404</Code> — no entry exists for that date.</li>
                <li><Code>500</Code> — database error.</li>
              </ul>
            </Endpoint>

            <p className="mt-12 text-xs text-zinc-500">
              Need to test locally? Open the app, sign in, and grab the access token from
              your Supabase session.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
