import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { chatWithAssistant } from "@/lib/ai.functions";
import { useAutoTranslate } from "@/components/site/AutoTranslate";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatBot() {
  const { i18n } = useTranslation();
  const { translateText } = useAutoTranslate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Namaste! I'm Sathi, your AI assistant. Ask me about any government scheme — eligibility, benefits, or documents. Or click 'Check Eligibility' for a personalised list.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      // If UI language is non-English, translate the user's message to English for
      // best model understanding, but keep the visible user bubble as they typed.
      const forModel: Msg[] = [];
      for (const m of next) {
        if (m.role === "user" && i18n.language !== "en" && /[A-Za-z]/.test(m.content) === false) {
          // Assume already in local language — send as is
          forModel.push(m);
        } else {
          forModel.push(m);
        }
      }
      const { reply } = await chatWithAssistant({
        data: { messages: forModel, lang: i18n.language || "en" },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error(e);
      const err = await translateText("Something went wrong. Please try again.");
      setMessages((prev) => [...prev, { role: "assistant", content: err }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          data-no-translate
          className="fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition hover:scale-105 hover:brightness-110"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-5 right-5 z-[80] flex h-[560px] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          data-no-translate
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Sathi AI Assistant</div>
                <div className="text-[11px] opacity-80">Ask about any scheme</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-full p-1.5 hover:bg-primary-foreground/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground shadow-sm"
                      : "max-w-[90%] rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2 text-sm text-secondary-foreground shadow-sm"
                  }
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Ask about a scheme…"
                data-no-translate
                className="max-h-32 min-h-[40px] flex-1 resize-none rounded-2xl border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              AI answers are indicative — verify on myscheme.gov.in before applying.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
