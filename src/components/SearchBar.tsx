import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { suggest } from "@/lib/search.functions";

type Props = {
  initialQuery?: string;
  size?: "hero" | "compact";
  autoFocus?: boolean;
};

export function SearchBar({ initialQuery = "", size = "hero", autoFocus }: Props) {
  const navigate = useNavigate();
  const getSuggestions = useServerFn(suggest);
  const [value, setValue] = useState(initialQuery);
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setValue(initialQuery), [initialQuery]);

  useEffect(() => {
    const term = value.trim();
    if (!term || term === initialQuery) {
      setItems([]);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await getSuggestions({ data: { q: term } });
        if (alive) setItems(res);
      } catch {
        if (alive) setItems([]);
      }
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [value, initialQuery, getSuggestions]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(term: string) {
    const q = term.trim();
    if (!q) return;
    setOpen(false);
    navigate({ to: "/search", search: { q, page: 1 } });
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
        className={`flex w-full items-center gap-3 rounded-full border border-border bg-card shadow-soft transition-all focus-within:border-ring focus-within:shadow-glow ${
          size === "hero" ? "px-5 py-3.5 sm:px-6 sm:py-4" : "px-4 py-2.5"
        }`}
      >
        <Search
          className={`shrink-0 text-muted-foreground ${size === "hero" ? "size-5" : "size-4"}`}
          aria-hidden
        />
        <input
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search the web privately"
          aria-label="Search query"
          className={`w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none ${
            size === "hero" ? "text-base sm:text-lg" : "text-sm sm:text-base"
          }`}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              setItems([]);
            }}
            className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          className={`shrink-0 rounded-full bg-primary font-medium text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95 ${
            size === "hero" ? "px-5 py-2 text-sm" : "px-3.5 py-1.5 text-xs sm:text-sm"
          }`}
        >
          Search
        </button>
      </form>

      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-soft">
          {items.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={() => go(s)}
                className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm text-popover-foreground transition-colors hover:bg-secondary"
              >
                <Search className="size-3.5 text-muted-foreground" aria-hidden />
                <span className="truncate">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
