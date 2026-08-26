import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { webSearch } from "@/lib/search.functions";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Search results — Veilo private search" },
      {
        name: "description",
        content:
          "Private web search results on Veilo. No tracking, no profiling, no ad targeting — just relevant links.",
      },
      { property: "og:title", content: "Search results — Veilo private search" },
      {
        property: "og:description",
        content: "Private web results with no tracking or profiling.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, page } = Route.useSearch();
  const term = q.slice(0, 300);
  const safePage = Math.max(1, Math.min(20, page));
  const run = useServerFn(webSearch);

  const { data, isPending, isError } = useQuery({
    queryKey: ["search", term, safePage],
    queryFn: () => run({ data: { q: term, page: safePage } }),
    enabled: term.length > 0,
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
          <Link
            to="/"
            className="font-display text-lg font-semibold tracking-tight text-foreground"
          >
            veilo<span className="text-accent">.</span>
          </Link>
          <div className="flex-1">
            <SearchBar initialQuery={term} size="compact" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6">
        {!term && (
          <p className="text-sm text-muted-foreground">
            Type something above to search the web privately.
          </p>
        )}

        {term && (
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5 text-accent" aria-hidden />
            {isPending
              ? "Searching anonymously…"
              : `${data?.results.length ?? 0} results in ${data?.tookMs ?? 0} ms — your query was not logged`}
          </p>
        )}

        {isError && (
          <p className="mt-8 text-sm text-destructive">
            Something went wrong fetching results. Try again.
          </p>
        )}

        {isPending && term && (
          <ul className="mt-6 space-y-7">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="space-y-2">
                <div className="h-3 w-40 animate-pulse rounded bg-secondary" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-full animate-pulse rounded bg-secondary" />
              </li>
            ))}
          </ul>
        )}

        {data && data.results.length === 0 && term && (
          <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
            <p className="font-display text-base font-semibold text-foreground">No results found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try different keywords or fewer terms.
            </p>
          </div>
        )}

        {data && data.results.length > 0 && (
          <ol className="mt-6 space-y-7">
            {data.results.map((r) => (
              <li key={r.url} className="group">
                <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" className="block">
                  <span className="block truncate text-xs text-muted-foreground">{r.source}</span>
                  <h2 className="mt-0.5 font-display text-lg leading-snug text-link underline-offset-4 group-hover:underline">
                    {r.title}
                  </h2>
                </a>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.snippet}</p>
              </li>
            ))}
          </ol>
        )}

        {term && data && (
          <nav className="mt-12 flex items-center justify-between" aria-label="Pagination">
            {safePage > 1 ? (
              <Link
                to="/search"
                search={{ q: term, page: safePage - 1 }}
                className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-ring"
              >
                <ChevronLeft className="size-4" /> Previous
              </Link>
            ) : (
              <span />
            )}
            {data.results.length > 0 && (
              <Link
                to="/search"
                search={{ q: term, page: safePage + 1 }}
                className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-ring"
              >
                Next <ChevronRight className="size-4" />
              </Link>
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
