export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

export type SearchResponse = {
  query: string;
  page: number;
  results: SearchResult[];
  provider: "brave" | "serper" | "open";
  tookMs: number;
  totalApprox: number | null;
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

async function braveSearch(q: string, page: number, key: string): Promise<SearchResult[]> {
  const offset = Math.max(0, page - 1);
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=20&offset=${offset}`,
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": key,
      },
    },
  );
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

async function serperSearch(q: string, page: number, key: string): Promise<SearchResult[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q, page }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Serper search failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string }>;
  };
  return (data.organic ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.link ?? "",
    snippet: r.snippet ?? "",
    source: hostOf(r.link ?? ""),
  }));
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

export async function runSearch(q: string, page: number): Promise<SearchResponse> {
  const started = Date.now();
  const query = q.trim();
  if (!query) {
    return { query, page, results: [], provider: "open", tookMs: 0, totalApprox: 0 };
  }

  const braveKey = process.env["BRAVE_SEARCH_API_KEY"];
  if (braveKey) {
    try {
      const results = await braveSearch(query, page, braveKey);
      return {
        query,
        page,
        results,
        provider: "brave",
        tookMs: Date.now() - started,
        totalApprox: null,
      };
    } catch (err) {
      console.error("Brave provider failed, falling back:", err);
    }
  }

  const serperKey = process.env["SERPER_API_KEY"];
  if (serperKey) {
    try {
      const results = await serperSearch(query, page, serperKey);
      return {
        query,
        page,
        results,
        provider: "serper",
        tookMs: Date.now() - started,
        totalApprox: null,
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
  };
}

export async function runSuggest(q: string): Promise<string[]> {
  const query = q.trim();
  if (!query) return [];
  try {
    const res = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`,
      { headers: { "User-Agent": UA, Accept: "application/json" } },
    );
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
