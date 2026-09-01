export function RelatedSearches({
  items,
  onSelect,
}: {
  items: string[];
  onSelect: (term: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-10 border-t border-border pt-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Related searches
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((term) => (
          <li key={term}>
            <button
              type="button"
              onClick={() => onSelect(term)}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
            >
              {term}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
