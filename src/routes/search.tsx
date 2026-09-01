import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Favicon } from "@/components/Favicon";
import { FilterBar, type ResultTab, type TimeRange } from "@/components/FilterBar";
import { AnswerCard } from "@/components/AnswerCard";
import { DidYouMean } from "@/components/DidYouMean";
import { RelatedSearches } from "@/components/RelatedSearches";
import { ImageResults } from "@/components/ImageResults";
import { webSearch, imageSearch } from "@/lib/search.functions";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int(), 1).default(1),
  tab: fallback(z.enum(["web", "images"]), "web").default("web"),
  time: fallback(z.enum(["any", "day", "week", "month", "year"]), "any").default("any"),
  region: fallback(z.string(), "any").default("any"),
  safe: fallback(z.boolean(), true).default(true),
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
  const { q, page, tab, time, region, safe } = Route.useSearch();
  const navigate = useNavigate();
  const term = q.slice(0, 300);
  const safePage = Math.max(1, Math.min(20, page));
  const runWeb = useServerFn(webSearch);
  const runImages = useServerFn(imageSearch);

  const webQuery = useQuery({
    queryKey: ["search", term, safePage, time, region, safe],
    queryFn: () =>
      runWeb({
        data: { q: term, page: safePage, timeRange: time, region, safeSearch: safe },
      }),
    enabled: term.length > 0 && tab === "web",
    staleTime: 60_000,
  });

  const imagesQuery = useQuery({
    queryKey: ["images", term, time, region, safe],
    queryFn: () => runImages({ data: { q: term, timeRange: time, region, safeSearch: safe } }),
    enabled: term.length > 0 && tab === "images",
    staleTime: 60_000,
  });

  const isPending = tab === "web" ? webQuery.isPending : imagesQuery.isPending;
  const isError = tab === "web" ? webQuery.isError : imagesQuery.isError;
  const resultCount =
    tab === "web" ? (webQuery.data?.results.length ?? 0) : (imagesQuery.data?.images.length ?? 0);
  const tookMs = tab === "web" ? webQuery.data?.tookMs : imagesQuery.data?.tookMs;

  function goToQuery(newTerm: string) {
    navigate({ to: "/search", search: (prev) => ({ ...prev, q: newTerm, page: 1 }) });
  }

  function updateFilters(
    patch: Partial<{ tab: ResultTab; time: TimeRange; region: string; safe: boolean }>,
  ) {
    navigate({ to: "/search", search: (prev) => ({ ...prev, page: 1, ...patch }) });
  }

  const answerBox = tab === "web" ? (webQuery.data?.answerBox ?? null) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
          <Link
            to="/"
            className="font-display text-lg font-semibold tracking-tight text-foreground"
          >
            veilo<span className="text-accent">.</span>
          </Link>
          <div className="flex-1">
            <SearchBar initialQuery={term} size="compact" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
        {!term && (
          <p className="text-sm text-muted-foreground">
            Type something above to search the web privately.
          </p>
        )}

        {term && (
          <>
            <FilterBar
              tab={tab}
              time={time}
              region={region}
              safeSearch={safe}
              onTabChange={(v) => updateFilters({ tab: v })}
              onTimeChange={(v) => updateFilters({ time: v })}
              onRegionChange={(v) => updateFilters({ region: v })}
              onSafeSearchChange={(v) => updateFilters({ safe: v })}
            />

            <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5 text-accent" aria-hidden />
              {isPending
                ? "Searching anonymously…"
                : `${resultCount} results in ${tookMs ?? 0} ms — your query was not logged`}
            </p>

            {isError && (
              <p className="mt-8 text-sm text-destructive">
                Something went wrong fetching results. Try again.
              </p>
            )}

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                {tab === "web" && answerBox && (
                  <div className="mb-6 lg:hidden">
                    <AnswerCard answer={answerBox} />
                  </div>
                )}

                {tab === "web" && webQuery.data?.didYouMean && (
                  <div className="mb-4">
                    <DidYouMean suggestion={webQuery.data.didYouMean} onSelect={goToQuery} />
                  </div>
                )}

                {tab === "web" && isPending && (
                  <ul className="space-y-7">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <li key={i} className="space-y-2">
                        <div className="h-3 w-40 animate-pulse rounded bg-secondary" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                        <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                      </li>
                    ))}
                  </ul>
                )}

                {tab === "web" && webQuery.data && webQuery.data.results.length === 0 && (
                  <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                    <p className="font-display text-base font-semibold text-foreground">
                      No results found
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Try different keywords or fewer terms.
                    </p>
                  </div>
                )}

                {tab === "web" && webQuery.data && webQuery.data.results.length > 0 && (
                  <ol className="space-y-7">
                    {webQuery.data.results.map((r) => (
                      <li key={r.url} className="group">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="block"
                        >
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Favicon source={r.source} />
                            <span className="truncate">{r.source}</span>
                          </span>
                          <h2 className="mt-0.5 font-display text-lg leading-snug text-link underline-offset-4 group-hover:underline">
                            {r.title}
                          </h2>
                        </a>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {r.snippet}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}

                {tab === "web" && webQuery.data && (
                  <RelatedSearches items={webQuery.data.relatedSearches} onSelect={goToQuery} />
                )}

                {tab === "web" && webQuery.data && (
                  <nav className="mt-12 flex items-center justify-between" aria-label="Pagination">
                    {safePage > 1 ? (
                      <Link
                        to="/search"
                        search={(prev) => ({ ...prev, page: safePage - 1 })}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-ring"
                      >
                        <ChevronLeft className="size-4" /> Previous
                      </Link>
                    ) : (
                      <span />
                    )}
                    {webQuery.data.results.length > 0 && (
                      <Link
                        to="/search"
                        search={(prev) => ({ ...prev, page: safePage + 1 })}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-ring"
                      >
                        Next <ChevronRight className="size-4" />
                      </Link>
                    )}
                  </nav>
                )}

                {tab === "images" && imagesQuery.isPending && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square animate-pulse rounded-xl bg-secondary"
                      />
                    ))}
                  </div>
                )}

                {tab === "images" && imagesQuery.data && (
                  <ImageResults images={imagesQuery.data.images} />
                )}
              </div>

              {tab === "web" && answerBox && (
                <aside className="hidden lg:block">
                  <div className="sticky top-24">
                    <AnswerCard answer={answerBox} />
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
