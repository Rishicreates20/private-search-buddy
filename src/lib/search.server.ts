export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

export type SearchFilters = {
  timeRange: "any" | "day" | "week" | "month" | "year";
  safeSearch: boolean;
  region: string;
};

export const DEFAULT_FILTERS: SearchFilters = {
  timeRange: "any",
  safeSearch: true,
  region: "any",
};

export type AnswerBox = {
  title: string;
  answer: string;
  source: string;
  url: string;
};

export type ImageResult = {
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  link: string;
  source: string;
};

export type SearchResponse = {
  query: string;
  page: number;
  results: SearchResult[];
  provider: "brave" | "serper" | "open";
  tookMs: number;
  totalApprox: number | null;
  answerBox: AnswerBox | null;
  relatedSearches: string[];
  didYouMean: string | null;
};

export type ImageSearchResponse = {
  query: string;
  images: ImageResult[];
  provider: "serper" | "open";
  tookMs: number;
};

const UA = "Mozilla/5.0 (compatible; PrivateSearch/1.0)";

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function stripTags(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// Google/Serper "tbs" recency codes.
function tbsFor(timeRange: SearchFilters["timeRange"]): string | undefined {
  switch (timeRange) {
    case "day":
      return "qdr:d";
    case "week":
      return "qdr:w";
    case "month":
      return "qdr:m";
    case "year":
      return "qdr:y";
    default:
      return undefined;
  }
}

function braveFreshnessFor(timeRange: SearchFilters["timeRange"]): string | undefined {
  switch (timeRange) {
    case "day":
      return "pd";
    case "week":
      return "pw";
    case "month":
      return "pm";
    case "year":
      return "py";
    default:
      return undefined;
  }
}

async function braveSearch(
  q: string,
  page: number,
  key: string,
  filters: SearchFilters,
): Promise<SearchResult[]> {
  const offset = Math.max(0, page - 1);
  const params = new URLSearchParams({
    q,
    count: "20",
    offset: String(offset),
    safesearch: filters.safeSearch ? "moderate" : "off",
  });
  const freshness = braveFreshnessFor(filters.timeRange);
  if (freshness) params.set("freshness", freshness);
  if (filters.region !== "any") params.set("country", filters.region);

  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": key,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brave search failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
  };
  return (data.web?.results ?? []).map((r) => ({
    title: stripTags(r.title ?? ""),
    url: r.url ?? "",
    snippet: stripTags(r.description ?? ""),
    source: hostOf(r.url ?? ""),
  }));
}

type SerperSearchOutcome = {
  results: SearchResult[];
  answerBox: AnswerBox | null;
  relatedSearches: string[];
  didYouMean: string | null;
};

async function serperSearch(
  q: string,
  page: number,
  key: string,
  filters: SearchFilters,
): Promise<SerperSearchOutcome> {
  const tbs = tbsFor(filters.timeRange);
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q,
      page,
      autocorrect: true,
      safe: filters.safeSearch ? "active" : "off",
      ...(filters.region !== "any" ? { gl: filters.region } : {}),
      ...(tbs ? { tbs } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Serper search failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string }>;
    answerBox?: {
      title?: string;
      answer?: string;
      snippet?: string;
      link?: string;
      source?: string;
    };
    relatedSearches?: Array<{ query?: string }>;
    searchParameters?: { q?: string };
  };

  const results = (data.organic ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.link ?? "",
    snippet: r.snippet ?? "",
    source: hostOf(r.link ?? ""),
  }));

  const box = data.answerBox;
  const answerText = box?.answer ?? box?.snippet ?? "";
  const answerBox: AnswerBox | null =
    box && answerText
      ? {
          title: box.title ?? q,
          answer: answerText,
          source: box.source ?? hostOf(box.link ?? ""),
          url: box.link ?? "",
        }
      : null;

  const relatedSearches = (data.relatedSearches ?? [])
    .map((r) => r.query ?? "")
    .filter(Boolean)
    .slice(0, 8);

  const correctedQ = data.searchParameters?.q?.trim();
  const didYouMean =
    correctedQ && correctedQ.toLowerCase() !== q.trim().toLowerCase() ? correctedQ : null;

  return { results, answerBox, relatedSearches, didYouMean };
}

async function serperImageSearch(
  q: string,
  filters: SearchFilters,
  key: string,
): Promise<ImageResult[]> {
  const res = await fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q,
      safe: filters.safeSearch ? "active" : "off",
      ...(filters.region !== "any" ? { gl: filters.region } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Serper image search failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    images?: Array<{
      title?: string;
      imageUrl?: string;
      thumbnailUrl?: string;
      link?: string;
      source?: string;
    }>;
  };
  return (data.images ?? [])
    .map((r) => ({
      title: r.title ?? "",
      imageUrl: r.imageUrl ?? "",
      thumbnailUrl: r.thumbnailUrl ?? r.imageUrl ?? "",
      link: r.link ?? r.imageUrl ?? "",
      source: r.source ?? hostOf(r.link ?? ""),
    }))
    .filter((r) => r.imageUrl);
}

async function openverseImageSearch(q: string): Promise<ImageResult[]> {
  try {
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=24`,
      { headers: { "User-Agent": UA, Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: Array<{
        title?: string;
        url?: string;
        thumbnail?: string;
        foreign_landing_url?: string;
        source?: string;
      }>;
    };
    return (data.results ?? [])
      .map((r) => ({
        title: r.title ?? q,
        imageUrl: r.url ?? "",
        thumbnailUrl: r.thumbnail ?? r.url ?? "",
        link: r.foreign_landing_url ?? r.url ?? "",
        source: r.source ?? hostOf(r.foreign_landing_url ?? ""),
      }))
      .filter((r) => r.imageUrl);
  } catch {
    return [];
  }
}

async function duckInstant(q: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=0`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      Heading?: string;
      AbstractText?: string;
      AbstractURL?: string;
      AbstractSource?: string;
      RelatedTopics?: Array<{
        Text?: string;
        FirstURL?: string;
        Topics?: Array<{ Text?: string; FirstURL?: string }>;
      }>;
    };

    const out: SearchResult[] = [];
    if (data.AbstractText && data.AbstractURL) {
      out.push({
        title: data.Heading || q,
        url: data.AbstractURL,
        snippet: data.AbstractText,
        source: data.AbstractSource || hostOf(data.AbstractURL),
      });
    }
    const flat = (data.RelatedTopics ?? []).flatMap((t) => (t.Topics ? t.Topics : [t]));
    for (const t of flat) {
      if (!t.FirstURL || !t.Text) continue;
      const [head, ...rest] = t.Text.split(" - ");
      out.push({
        title: head ?? t.Text,
        url: t.FirstURL,
        snippet: rest.join(" - ") || t.Text,
        source: hostOf(t.FirstURL),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function wikipediaSearch(q: string, page: number): Promise<SearchResult[]> {
  try {
    const offset = (page - 1) * 10;
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        q,
      )}&srlimit=10&sroffset=${offset}&format=json&origin=*`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      query?: { search?: Array<{ title: string; snippet: string }> };
    };
    return (data.query?.search ?? []).map((r) => ({
      title: r.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
      snippet: stripTags(r.snippet),
      source: "en.wikipedia.org",
    }));
  } catch {
    return [];
  }
}

export async function runSearch(
  q: string,
  page: number,
  filters: SearchFilters = DEFAULT_FILTERS,
): Promise<SearchResponse> {
  const started = Date.now();
  const query = q.trim();
  const empty: SearchResponse = {
    query,
    page,
    results: [],
    provider: "open",
    tookMs: 0,
    totalApprox: 0,
    answerBox: null,
    relatedSearches: [],
    didYouMean: null,
  };
  if (!query) return empty;

  const braveKey = process.env["BRAVE_SEARCH_API_KEY"];
  if (braveKey) {
    try {
      const results = await braveSearch(query, page, braveKey, filters);
      return {
        query,
        page,
        results,
        provider: "brave",
        tookMs: Date.now() - started,
        totalApprox: null,
        answerBox: null,
        relatedSearches: [],
        didYouMean: null,
      };
    } catch (err) {
      console.error("Brave provider failed, falling back:", err);
    }
  }

  const serperKey = process.env["SERPER_API_KEY"];
  if (serperKey) {
    try {
      const { results, answerBox, relatedSearches, didYouMean } = await serperSearch(
        query,
        page,
        serperKey,
        filters,
      );
      return {
        query,
        page,
        results,
        provider: "serper",
        tookMs: Date.now() - started,
        totalApprox: null,
        answerBox,
        relatedSearches,
        didYouMean,
      };
    } catch (err) {
      console.error("Serper provider failed, falling back to open sources:", err);
    }
  }

  const [instant, wiki] = await Promise.all([
    page === 1 ? duckInstant(query) : Promise.resolve([]),
    wikipediaSearch(query, page),
  ]);

  const seen = new Set<string>();
  const results = [...instant, ...wiki].filter((r) => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  return {
    query,
    page,
    results,
    provider: "open",
    tookMs: Date.now() - started,
    totalApprox: null,
    answerBox: null,
    relatedSearches: [],
    didYouMean: null,
  };
}

export async function runImageSearch(
  q: string,
  filters: SearchFilters = DEFAULT_FILTERS,
): Promise<ImageSearchResponse> {
  const started = Date.now();
  const query = q.trim();
  if (!query) return { query, images: [], provider: "open", tookMs: 0 };

  const serperKey = process.env["SERPER_API_KEY"];
  if (serperKey) {
    try {
      const images = await serperImageSearch(query, filters, serperKey);
      return { query, images, provider: "serper", tookMs: Date.now() - started };
    } catch (err) {
      console.error("Serper image provider failed, falling back to Openverse:", err);
    }
  }

  const images = await openverseImageSearch(query);
  return { query, images, provider: "open", tookMs: Date.now() - started };
}

export async function runSuggest(q: string): Promise<string[]> {
  const query = q.trim();
  if (!query) return [];
  try {
    const res = await fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return (data[1] as string[]).slice(0, 8);
    }
    if (Array.isArray(data)) {
      return (data as Array<{ phrase?: string }>)
        .map((d) => d.phrase ?? "")
        .filter(Boolean)
        .slice(0, 8);
    }
    return [];
  } catch {
    return [];
  }
}
