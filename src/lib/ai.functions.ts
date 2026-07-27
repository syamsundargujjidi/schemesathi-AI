import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callGateway(body: unknown): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  bn: "Bengali",
  gu: "Gujarati",
  or: "Odia",
};

export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        texts: z.array(z.string()).min(1).max(200),
        targetLang: z.string().min(2).max(5),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const target = LANG_NAMES[data.targetLang] ?? data.targetLang;
    if (data.targetLang === "en") return { translations: data.texts };

    const system = `You are a professional translator. Translate every JSON array element to ${target}. Preserve numbers, punctuation, brand names (Scheme Sathi AI, PM-KISAN, Ayushman, MyScheme, etc.), URLs, and emoji as-is. Return ONLY a JSON array of the translated strings, same length and order. No commentary.`;
    const user = JSON.stringify(data.texts);

    const content = await callGateway({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
    });

    // Extract JSON array from response.
    let translations: string[] = data.texts;
    try {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as unknown;
        if (
          Array.isArray(parsed) &&
          parsed.length === data.texts.length &&
          parsed.every((x) => typeof x === "string")
        ) {
          translations = parsed as string[];
        }
      }
    } catch {
      // fall back to originals
    }
    return { translations };
  });

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(4000),
            }),
          )
          .min(1)
          .max(30),
        lang: z.string().default("en"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const langName = LANG_NAMES[data.lang] ?? "English";
    const system = `You are "Sathi", the AI assistant for Scheme Sathi AI — a free portal helping Indian citizens discover Central and State government welfare schemes.

Rules:
- Answer ONLY in ${langName}.
- Be concise (2-6 short sentences or a compact bullet list).
- Guide users to use the Check Eligibility questionnaire for personalised results.
- When mentioning schemes (PM-KISAN, Ayushman Bharat, PMAY, MGNREGA, Ujjwala, Sukanya Samriddhi, Jan Dhan, MUDRA, PM-SVANidhi, state schemes like Ladki Bahin, Gruha Lakshmi, Mahtari Vandan, Orunodoi, etc.) briefly say who is eligible and the key benefit.
- Never invent schemes or URLs. If unsure, tell the user to verify on myscheme.gov.in.
- Do not collect sensitive data (Aadhaar, bank, OTP). Politely refuse.`;

    const content = await callGateway({
      model: MODEL,
      messages: [{ role: "system", content: system }, ...data.messages],
      temperature: 0.6,
    });
    return { reply: content || "Sorry, I couldn't generate a reply. Please try again." };
  });
