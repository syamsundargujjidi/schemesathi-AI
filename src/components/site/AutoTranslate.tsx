import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { translateBatch } from "@/lib/ai.functions";

/**
 * Auto-translates visible text nodes and form input values whenever the
 * active i18next language changes. Uses Lovable AI gateway server function.
 * Results are cached in-memory + localStorage keyed by (lang|originalText).
 */

type Ctx = {
  translating: boolean;
  translateText: (text: string) => Promise<string>;
};
const AutoTranslateCtx = createContext<Ctx>({
  translating: false,
  translateText: async (t) => t,
});

export const useAutoTranslate = () => useContext(AutoTranslateCtx);

const CACHE_PREFIX = "ssa-tr:";
const cache = new Map<string, string>();

function cacheGet(lang: string, text: string): string | undefined {
  const k = `${lang}|${text}`;
  if (cache.has(k)) return cache.get(k);
  if (typeof window === "undefined") return undefined;
  try {
    const v = window.localStorage.getItem(CACHE_PREFIX + k);
    if (v != null) {
      cache.set(k, v);
      return v;
    }
  } catch {}
  return undefined;
}
function cacheSet(lang: string, text: string, tr: string) {
  const k = `${lang}|${text}`;
  cache.set(k, tr);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_PREFIX + k, tr);
  } catch {}
}

function shouldSkipNode(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  const tag = parent.tagName;
  if (["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"].includes(tag)) return true;
  if (parent.closest("[data-no-translate]")) return true;
  return false;
}

function collectTextNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      if (shouldSkipNode(n)) return NodeFilter.FILTER_REJECT;
      const t = n.nodeValue?.trim() ?? "";
      if (t.length < 2) return NodeFilter.FILTER_REJECT;
      // skip pure numbers / punctuation
      if (/^[\d\s.,:;!?\-–—/₹%()#*"'`]+$/.test(t)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const out: Text[] = [];
  let n: Node | null = walker.nextNode();
  while (n) {
    out.push(n as Text);
    n = walker.nextNode();
  }
  return out;
}

async function batchedTranslate(texts: string[], lang: string): Promise<string[]> {
  if (texts.length === 0) return [];
  const CHUNK = 40;
  const out: string[] = [];
  for (let i = 0; i < texts.length; i += CHUNK) {
    const slice = texts.slice(i, i + CHUNK);
    try {
      const res = await translateBatch({ data: { texts: slice, targetLang: lang } });
      out.push(...res.translations);
    } catch (e) {
      console.error("translateBatch failed", e);
      out.push(...slice);
    }
  }
  return out;
}

export function AutoTranslateProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "en";
  const [translating, setTranslating] = useState(false);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const runId = ++runIdRef.current;

    // Restore any originals first (revert previous translations if we tagged them)
    document.querySelectorAll<HTMLElement>("[data-tr-orig]").forEach((el) => {
      const orig = el.getAttribute("data-tr-orig");
      if (orig != null) el.textContent = orig;
      el.removeAttribute("data-tr-orig");
    });

    if (lang === "en") return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setTranslating(true);
      try {
        const nodes = collectTextNodes(document.body);
        // Group unique original texts
        const uniqueMap = new Map<string, Text[]>();
        for (const n of nodes) {
          const t = n.nodeValue!.trim();
          const arr = uniqueMap.get(t) ?? [];
          arr.push(n);
          uniqueMap.set(t, arr);
        }
        const uniqueTexts = Array.from(uniqueMap.keys());
        const uncached: string[] = [];
        for (const t of uniqueTexts) if (cacheGet(lang, t) == null) uncached.push(t);

        if (uncached.length > 0) {
          const results = await batchedTranslate(uncached, lang);
          uncached.forEach((src, i) => cacheSet(lang, src, results[i] ?? src));
        }
        if (cancelled || runIdRef.current !== runId) return;

        for (const [orig, textNodes] of uniqueMap) {
          const tr = cacheGet(lang, orig) ?? orig;
          for (const node of textNodes) {
            const parent = node.parentElement;
            if (!parent) continue;
            if (!parent.hasAttribute("data-tr-orig")) {
              parent.setAttribute("data-tr-orig", node.nodeValue ?? orig);
            }
            // Preserve leading/trailing whitespace of the original
            const raw = node.nodeValue ?? "";
            const leading = raw.match(/^\s*/)?.[0] ?? "";
            const trailing = raw.match(/\s*$/)?.[0] ?? "";
            node.nodeValue = leading + tr + trailing;
          }
        }
      } finally {
        if (!cancelled && runIdRef.current === runId) setTranslating(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [lang]);

  // Translate input/textarea values on blur when language != en
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (lang === "en") return;
    const handler = async (ev: FocusEvent) => {
      const el = ev.target as HTMLElement | null;
      if (!el) return;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
      if (el.dataset.noTranslate === "true") return;
      if (el.type && ["password", "email", "number", "url", "tel", "hidden"].includes(el.type)) return;
      const val = el.value?.trim();
      if (!val || val.length < 2) return;
      // Only translate if it looks like Latin/English text
      if (!/[A-Za-z]/.test(val)) return;
      try {
        const cached = cacheGet(lang, val);
        if (cached) {
          el.value = cached;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          return;
        }
        const { translations } = await translateBatch({
          data: { texts: [val], targetLang: lang },
        });
        const out = translations[0] ?? val;
        cacheSet(lang, val, out);
        el.value = out;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } catch (e) {
        console.warn("input translate failed", e);
      }
    };
    document.addEventListener("blur", handler, true);
    return () => document.removeEventListener("blur", handler, true);
  }, [lang]);

  const ctx: Ctx = {
    translating,
    translateText: async (text) => {
      if (lang === "en" || !text.trim()) return text;
      const cached = cacheGet(lang, text);
      if (cached) return cached;
      try {
        const { translations } = await translateBatch({
          data: { texts: [text], targetLang: lang },
        });
        const out = translations[0] ?? text;
        cacheSet(lang, text, out);
        return out;
      } catch {
        return text;
      }
    },
  };

  return (
    <AutoTranslateCtx.Provider value={ctx}>
      {children}
      {translating && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-foreground/90 px-3 py-1.5 text-xs font-medium text-background shadow-lg">
          Translating…
        </div>
      )}
    </AutoTranslateCtx.Provider>
  );
}
