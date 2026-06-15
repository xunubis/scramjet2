import { createFileRoute } from "@tanstack/react-router";
import { ProxyApp } from "@/components/proxy-app";

interface IndexSearch {
  go?: string;
}

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): IndexSearch => ({
    go: typeof s.go === "string" ? s.go : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Prism" },
      { name: "description", content: "A fast, private web frontend." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProxyApp,
});
