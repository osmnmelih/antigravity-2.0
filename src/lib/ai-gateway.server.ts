// Server-only Lovable AI Gateway helper. Used by tasks/hints/reports routes.
// Returns plain text from a single user prompt; callers parse JSON themselves.

const ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface LovableAiOptions {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function lovableAiComplete(
  userPrompt: string,
  opts: LovableAiOptions = {},
): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const messages: Array<{ role: string; content: string }> = [];
  if (opts.systemPrompt) messages.push({ role: "system", content: opts.systemPrompt });
  messages.push({ role: "user", content: userPrompt });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: opts.model ?? "google/gemini-2.5-flash",
        messages,
        max_tokens: opts.maxTokens ?? 600,
        temperature: opts.temperature ?? 0.8,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error(`AI Gateway request failed or timed out: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Lovable AI ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

// Extracts the first balanced JSON object from a model response.
export function extractJson(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");
  return JSON.parse(match[0]);
}
