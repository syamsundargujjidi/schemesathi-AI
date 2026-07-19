import { useEffect, useState } from "react";
import { Accessibility, X, Contrast, Type } from "lucide-react";
import { useTranslation } from "react-i18next";

type FontSize = "sm" | "base" | "lg" | "xl";
const FONT_CLASS: Record<FontSize, string> = {
  sm: "text-[14px]",
  base: "text-[16px]",
  lg: "text-[18px]",
  xl: "text-[20px]",
};

export function AccessibilityWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [font, setFont] = useState<FontSize>("base");
  const [hc, setHc] = useState(false);

  // hydrate from storage
  useEffect(() => {
    try {
      const f = localStorage.getItem("ss:font") as FontSize | null;
      const c = localStorage.getItem("ss:hc") === "1";
      if (f) setFont(f);
      if (c) setHc(true);
    } catch {}
  }, []);

  // apply to <html>
  useEffect(() => {
    const html = document.documentElement;
    (["sm", "base", "lg", "xl"] as FontSize[]).forEach((s) =>
      html.classList.remove(FONT_CLASS[s]),
    );
    html.classList.add(FONT_CLASS[font]);
    try { localStorage.setItem("ss:font", font); } catch {}
  }, [font]);

  useEffect(() => {
    document.documentElement.classList.toggle("hc", hc);
    try { localStorage.setItem("ss:hc", hc ? "1" : "0"); } catch {}
  }, [hc]);

  return (
    <>
      <button
        type="button"
        aria-label={t("a11y.title")}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:brightness-110"
      >
        <Accessibility className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold">{t("a11y.title")}</h3>
            <button aria-label="Close" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Type className="h-3.5 w-3.5" /> {t("a11y.fontSize")}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {(["sm", "base", "lg", "xl"] as FontSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFont(s)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                    font === s ? "border-primary bg-primary/10 text-primary" : "border-input"
                  }`}
                >
                  {s === "sm" ? "A-" : s === "base" ? "A" : s === "lg" ? "A+" : "A++"}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setHc((v) => !v)}
            className={`mt-4 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
              hc ? "border-primary bg-primary/10 text-primary" : "border-input"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Contrast className="h-4 w-4" /> {t("a11y.highContrast")}
            </span>
            <span className="text-xs">{hc ? "ON" : "OFF"}</span>
          </button>
        </div>
      )}
    </>
  );
}
