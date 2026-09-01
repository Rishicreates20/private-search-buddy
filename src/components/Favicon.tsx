const PALETTE_HUES = [10, 40, 80, 140, 172, 200, 230, 260, 300, 330];

function hueForDomain(domain: string) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash * 31 + domain.charCodeAt(i)) >>> 0;
  }
  return PALETTE_HUES[hash % PALETTE_HUES.length];
}

// Letter avatar derived purely from the domain string — no third-party
// favicon service, so no per-result request ever leaves the browser.
export function Favicon({ source, className }: { source: string; className?: string }) {
  const clean = source.replace(/^www\./, "");
  const letter = (clean[0] ?? "?").toUpperCase();
  const hue = hueForDomain(clean);

  return (
    <span
      aria-hidden
      className={
        className ??
        "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
      }
      style={{ backgroundColor: `oklch(0.62 0.13 ${hue})` }}
    >
      {letter}
    </span>
  );
}
