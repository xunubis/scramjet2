import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

const GAMES_LIST_URL =
  "https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@latest/game.js";
const GAME_FILE_BASE =
  "https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/";

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [{ title: "Games — Prism" }, { name: "robots", content: "noindex" }],
  }),
  component: GamesPage,
});

/**
 * Parse the UGS `game.js` file. It's plain JS that declares
 * `let files = [ "cl1", "cl2", ... ];` — we extract the array contents
 * with a regex (no eval) so we never execute remote code.
 */
function parseGamesList(js: string): string[] {
  const m = js.match(/files\s*=\s*\[([\s\S]*?)\]/);
  if (!m) return [];
  return Array.from(m[1].matchAll(/"([^"\\]*)"/g)).map((x) => x[1]);
}

function prettyName(file: string): string {
  let n = file;
  if (n.toLowerCase().startsWith("cl")) n = n.slice(2);
  n = n.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  return n || file;
}

function bucketFor(file: string): string {
  if (!file.toLowerCase().startsWith("cl")) return "#";
  const c = file.slice(2, 3).toUpperCase();
  if (c >= "A" && c <= "Z") return c;
  if (c >= "0" && c <= "9") return c;
  return "#";
}

async function launchGame(file: string) {
  const normalized = file.includes(".") && file.lastIndexOf(".") > 0
    ? file
    : file + ".html";
  const url = `${GAME_FILE_BASE}${encodeURIComponent(normalized)}?t=${Date.now()}`;
  const win = window.open("about:blank", "_blank");
  if (!win) {
    alert("Pop-up blocked. Allow pop-ups for this site to launch games.");
    return;
  }
  try {
    const res = await fetch(url);
    const html = await res.text();
    win.document.open();
    win.document.write(html);
    win.document.close();
  } catch (err) {
    win.document.body.innerText = "Failed to load game: " + String(err);
  }
}

function GamesPage() {
  const [files, setFiles] = useState<string[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let alive = true;
    fetch(GAMES_LIST_URL)
      .then((r) => r.text())
      .then((t) => {
        if (!alive) return;
        const list = parseGamesList(t);
        if (list.length === 0) throw new Error("Could not parse game list.");
        setFiles(list);
      })
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    CHARS.forEach((c) => (map[c] = []));
    (files ?? []).forEach((f) => {
      const b = bucketFor(f);
      (map[b] ??= []).push(f);
    });
    const needle = q.trim().toLowerCase();
    if (!needle) return map;
    const filtered: Record<string, string[]> = {};
    for (const c of CHARS) {
      filtered[c] = map[c].filter((f) => prettyName(f).toLowerCase().includes(needle));
    }
    return filtered;
  }, [files, q]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar A–Z nav */}
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-14 flex-col gap-1 overflow-y-auto border-r border-white/5 bg-black/30 px-1.5 py-3 backdrop-blur sm:flex">
        {CHARS.map((c) => {
          const count = grouped[c]?.length ?? 0;
          return (
            <button
              key={c}
              disabled={count === 0}
              onClick={() =>
                sectionRefs.current[c]?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className={
                "rounded-md py-1.5 text-sm font-semibold transition " +
                (count === 0
                  ? "cursor-default text-muted-foreground/30"
                  : "text-muted-foreground hover:bg-primary/15 hover:text-foreground")
              }
              title={count ? `${count} game${count === 1 ? "" : "s"}` : "empty"}
            >
              {c}
            </button>
          );
        })}
      </aside>

      <div className="px-5 py-8 sm:ml-14 sm:px-10">
        <header className="mx-auto mb-8 flex max-w-5xl flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Games</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {files
                ? `${files.length.toLocaleString()} games · powered by the UGS file mirror`
                : err
                  ? "Failed to load library"
                  : "Loading library…"}
            </p>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search games"
              className="w-full max-w-xs rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm outline-none focus:border-primary/50"
            />
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← back
            </Link>
          </div>
        </header>

        {err && (
          <div className="mx-auto max-w-5xl rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {err}
          </div>
        )}

        {!files && !err && (
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="prism-skeleton h-12 rounded-lg" />
            ))}
          </div>
        )}

        {files && (
          <div className="mx-auto max-w-5xl space-y-10">
            {CHARS.map((c) => {
              const list = grouped[c];
              if (!list || list.length === 0) return null;
              return (
                <section
                  key={c}
                  ref={(el: HTMLElement | null) => {
                    sectionRefs.current[c] = el as HTMLDivElement | null;
                  }}
                  id={`section-${c}`}
                >
                  <h2 className="mb-3 border-b border-white/10 pb-2 text-2xl font-bold tracking-tight">
                    {c}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {list.length}
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((f) => (
                      <button
                        key={f}
                        onClick={() => launchGame(f)}
                        className="prism-smooth truncate rounded-lg border border-white/5 bg-white/[0.03] px-4 py-2.5 text-left text-sm hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10"
                      >
                        {prettyName(f)}
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
