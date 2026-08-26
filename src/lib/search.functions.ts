import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const searchInput = z.object({
  q: z.string().max(300),
  page: z.number().int().min(1).max(20).default(1),
});

export const webSearch = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => searchInput.parse(data))
  .handler(async ({ data }) => {
    const { runSearch } = await import("./search.server");
    return runSearch(data.q, data.page);
  });

export const suggest = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ q: z.string().max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { runSuggest } = await import("./search.server");
    return runSuggest(data.q);
  });
