import { Link } from "@tanstack/react-router";
import { ShieldCheck, Bookmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "@/components/site/LanguageSelector";

export function Header() {
  const { user } = useAuth();
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            Scheme Sathi AI
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/" className="hover:text-foreground" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>{t("nav.home")}</Link>
          <Link to="/schemes" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>{t("nav.browse")}</Link>
          <Link to="/questionnaire" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>{t("nav.check")}</Link>
          <Link to="/about" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>{t("nav.about")}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          {user ? (
            <Link
              to="/profile"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 sm:px-4"
            >
              <Bookmark className="h-4 w-4" /> <span className="hidden sm:inline">{t("nav.profile")}</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
            >
              {t("nav.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
