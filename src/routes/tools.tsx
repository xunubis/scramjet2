import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [{ title: "Tools — Prism" }, { name: "robots", content: "noindex" }],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [mode, setMode] = useState<"b64enc" | "b64dec" | "urlenc" | "urldec" | "xor">("b64enc");

  function run() {
    try {
      switch (mode) {
        case "b64enc": setOut(btoa(unescape(encodeURIComponent(text)))); break;
        case "b64dec": setOut(decodeURIComponent(escape(atob(text)))); break;
        case "urlenc": setOut(encodeURIComponent(text)); break;
        case "urldec": setOut(decodeURIComponent(text)); break;
        case "xor": {
          const k = "prism";
          const r: string[] = [];
          for (let i = 0; i < text.length; i++) {
            r.push(String.fromCharCode(text.charCodeAt(i) ^ k.charCodeAt(i % k.length)));
          }
          setOut(btoa(r.join("")));
          break;
        }
      }
    } catch (e) {
      setOut("error: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Tools</h1>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← back</Link>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {(["b64enc", "b64dec", "urlenc", "urldec", "xor"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  "rounded-md border px-3 py-1.5 text-xs " +
                  (mode === m ? "border-primary bg-primary/15" : "border-white/10 text-muted-foreground hover:text-foreground")
                }
              >
                {m}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-32 w-full rounded-md border border-white/10 bg-background/60 p-3 font-mono text-sm outline-none"
            placeholder="input…"
          />
          <button onClick={run} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Run
          </button>
          <pre className="mt-4 max-h-64 overflow-auto rounded-md border border-white/10 bg-background/60 p-3 text-xs">
            {out || "—"}
          </pre>
        </div>
      </div>
    </div>
  );
}
