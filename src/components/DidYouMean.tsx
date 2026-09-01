export function DidYouMean({
  suggestion,
  onSelect,
}: {
  suggestion: string;
  onSelect: (term: string) => void;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      Did you mean{" "}
      <button
        type="button"
        onClick={() => onSelect(suggestion)}
        className="font-medium text-link underline-offset-4 hover:underline"
      >
        {suggestion}
      </button>
      ?
    </p>
  );
}
