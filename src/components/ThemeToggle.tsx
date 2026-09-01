import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        mounted ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"
      }
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
    >
      {mounted ? (
        theme === "dark" ? (
          <Sun className="size-4" aria-hidden />
        ) : (
          <Moon className="size-4" aria-hidden />
        )
      ) : (
        <span className="size-4" aria-hidden />
      )}
    </button>
  );
}
