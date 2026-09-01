import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const filterInput = z.object({
  timeRange: z.enum(["any", "day", "week", "month", "year"]).default("any"),
  safeSearch: z.boolean().default(true),
  region: z.string().max(10).default("any"),
});

const searchInput = z
  .object({
    q: z.string().max(300),
    page: z.number().int().min(1).max(20).default(1),
  })
  .merge(filterInput);

const imageSearchInput = z
  .object({
    q: z.string().max(300),
  })
  .merge(filterInput);

export const webSearch = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => searchInput.parse(data))
  .handler(async ({ data }) => {
    const { runSearch } = await import("./search.server");
    return runSearch(data.q, data.page, {
      timeRange: data.timeRange,
      safeSearch: data.safeSearch,
      region: data.region,
    });
  });

export const imageSearch = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => imageSearchInput.parse(data))
  .handler(async ({ data }) => {
    const { runImageSearch } = await import("./search.server");
    return runImageSearch(data.q, {
      timeRange: data.timeRange,
      safeSearch: data.safeSearch,
      region: data.region,
    });
  });

export const suggest = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ q: z.string().max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { runSuggest } = await import("./search.server");
    return runSuggest(data.q);
  });
