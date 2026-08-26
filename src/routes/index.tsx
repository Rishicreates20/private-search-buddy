import { createFileRoute, Link } from "@tanstack/react-router";
import { EyeOff, ShieldCheck, Zap } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Veilo — Private Search Engine" },
      {
        name: "description",
        content:
          "Veilo is a private search engine: no tracking, no profiles, no ad targeting. Fast, clean web results on any device.",
      },
      { property: "og:title", content: "Veilo — Private Search Engine" },
      {
        property: "og:description",
        content: "Search the web without being tracked. No profiles, no logs, no ad targeting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const perks = [
  { icon: EyeOff, title: "No tracking", text: "Queries are never tied to you or stored in a profile." },
  { icon: ShieldCheck, title: "No ad auction", text: "Results are ranked by relevance, not by bidders." },
  { icon: Zap, title: "Fast & clean", text: "A lightweight interface that works on any screen." },
];

function Index() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-halo" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10">
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          veilo<span className="text-accent">.</span>
        </span>
        <Link
          to="/search"
          search={{ q: "privacy tools", page: 1 }}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground sm:text-sm"
        >
          Try a search
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 pb-24 pt-10 text-center sm:px-8">
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-7xl">
          veilo<span className="text-accent">.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
          The search engine that forgets you the moment you leave.
        </p>

        <div className="mt-9 w-full">
          <SearchBar autoFocus />
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {["open source llms", "how does dns work", "best hiking trails", "quantum computing"].map(
            (term) => (
              <li key={term}>
                <Link
                  to="/search"
                  search={{ q: term, page: 1 }}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                >
                  {term}
                </Link>
              </li>
            ),
          )}
        </ul>

        <div className="mt-16 grid w-full gap-4 text-left sm:grid-cols-3">
          {perks.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <p.icon className="size-5 text-accent" aria-hidden />
              <h2 className="mt-3 font-display text-sm font-semibold text-foreground">{p.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border px-5 py-5 text-center text-xs text-muted-foreground sm:px-10">
        Veilo keeps no search history, no cookies for profiling, and no cross-site identifiers.
      </footer>
    </main>
  );
}
