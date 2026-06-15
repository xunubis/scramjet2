import { createFileRoute, Link } from "@tanstack/react-router";

const GAMES = [
  { name: "Slope", url: "https://slope-game.com" },
  { name: "Cookie Clicker", url: "https://orteil.dashnet.org/cookieclicker/" },
  { name: "2048", url: "https://play2048.co" },
  { name: "Tetris", url: "https://tetris.com/play-tetris" },
  { name: "Krunker", url: "https://krunker.io" },
  { name: "Shell Shockers", url: "https://shellshock.io" },
  { name: "Agar.io", url: "https://agar.io" },
  { name: "Diep.io", url: "https://diep.io" },
  { name: "Snake", url: "https://playsnake.org" },
  { name: "1v1.LOL", url: "https://1v1.lol" },
  { name: "Bloxd.io", url: "https://bloxd.io" },
  { name: "Paper.io 2", url: "https://paperio2.online" },
];

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [{ title: "Games — Prism" }, { name: "robots", content: "noindex" }],
  }),
  component: GamesPage,
});

function GamesPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Games</h1>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← back</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {GAMES.map((g) => (
            <Link
              key={g.url}
              to="/"
              search={{ go: g.url }}
              className="group rounded-xl border border-white/5 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(g.url).hostname}&sz=64`}
                alt=""
                className="mb-3 h-8 w-8 rounded"
                loading="lazy"
              />
              <div className="font-medium">{g.name}</div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{new URL(g.url).hostname}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
