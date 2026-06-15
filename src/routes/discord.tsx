import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/discord")({
  head: () => ({
    meta: [{ title: "Community — Prism" }, { name: "robots", content: "noindex" }],
  }),
  component: DiscordPage,
});

function DiscordPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Community</h1>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← back</Link>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
          <p className="text-muted-foreground">
            Prism doesn't have an official Discord — set yours below or jump to Discord in a tab.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/"
              search={{ go: "https://discord.com/app" }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Open Discord
            </Link>
            <a
              href="https://discord.com/invite/"
              className="rounded-md border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Find a server
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
