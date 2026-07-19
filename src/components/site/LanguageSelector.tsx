import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LANGUAGES, setLanguage } from "@/i18n";

export function LanguageSelector() {
  const { i18n } = useTranslation();
  return (
    <label className="relative inline-flex items-center">
      <Globe className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
      <select
        aria-label="Language"
        value={i18n.language}
        onChange={(e) => setLanguage(e.target.value)}
        className="appearance-none rounded-full border border-input bg-background py-1.5 pl-8 pr-3 text-xs font-medium focus:border-ring focus:outline-none"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
}
