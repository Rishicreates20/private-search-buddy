import { Sparkles } from "lucide-react";

export type AnswerBoxData = {
  title: string;
  answer: string;
  source: string;
  url: string;
};

export function AnswerCard({ answer }: { answer: AnswerBoxData }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
        <Sparkles className="size-3.5" aria-hidden />
        Quick answer
      </div>
      <h2 className="mt-2 font-display text-base font-semibold leading-snug text-foreground">
        {answer.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{answer.answer}</p>
      {answer.url && (
        <a
          href={answer.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-3 block truncate text-xs text-link underline-offset-4 hover:underline"
        >
          {answer.source}
        </a>
      )}
    </div>
  );
}
