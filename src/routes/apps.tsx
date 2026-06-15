import { createFileRoute, Link } from "@tanstack/react-router";

const APPS = [
  { name: "YouTube", url: "https://youtube.com" },
  { name: "Discord", url: "https://discord.com/app" },
  { name: "Spotify", url: "https://open.spotify.com" },
  { name: "Reddit", url: "https://reddit.com" },
  { name: "Twitch", url: "https://twitch.tv" },
  { name: "GitHub", url: "https://github.com" },
  { name: "Notion", url: "https://notion.so" },
  { name: "ChatGPT", url: "https://chat.openai.com" },
  { name: "Wikipedia", url: "https://en.wikipedia.org" },
  { name: "Twitter / X", url: "https://x.com" },
  { name: "Imgur", url: "https://imgur.com" },
  { name: "Pinterest", url: "https://pinterest.com" },
];

export const Route = createFileRoute("/apps")({
  head: () => ({
    meta: [{ title: "Apps — Prism" }, { name: "robots", content: "noindex" }],
  }),
  component: AppsPage,
});

function AppsPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Apps</h1>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← back</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {APPS.map((a) => (
            <Link
              key={a.url}
              to="/"
              search={{ go: a.url }}
              className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(a.url).hostname}&sz=64`}
                alt=""
                className="h-8 w-8 rounded"
                loading="lazy"
              />
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="truncate text-xs text-muted-foreground">{new URL(a.url).hostname}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
