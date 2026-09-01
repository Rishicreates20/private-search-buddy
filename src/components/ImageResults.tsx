export type ImageResultData = {
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  link: string;
  source: string;
};

export function ImageResults({ images }: { images: ImageResultData[] }) {
  if (images.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
        <p className="font-display text-base font-semibold text-foreground">No images found</p>
        <p className="mt-2 text-sm text-muted-foreground">Try different keywords.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {images.map((img, i) => (
        <a
          key={`${img.link}-${i}`}
          href={img.link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft"
        >
          <div className="aspect-square overflow-hidden bg-secondary">
            <img
              src={img.thumbnailUrl || img.imageUrl}
              alt={img.title}
              loading="lazy"
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <p className="truncate px-2 py-1.5 text-[11px] text-muted-foreground">{img.source}</p>
        </a>
      ))}
    </div>
  );
}
