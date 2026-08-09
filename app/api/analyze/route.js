// Simple in-memory rate limiter — protects against abuse/cost spikes if the
// deployed link gets shared widely. Not perfect (resets on cold start on
// serverless), but combined with "no billing enabled" on the Google project,
// it's a solid extra layer: worst case is requests get rejected, never billed.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // per IP per window
const requestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return false;
}

const SYSTEM_PROMPT = `You are RightsRadar, an assistant that helps everyday people understand legal documents before they sign them.

Given a piece of legal text (a clause, contract excerpt, or notice), respond with a JSON object in exactly this shape:

{
  "plainSummary": "A 2-4 sentence plain-English summary of what this text means, written for someone with no legal background.",
  "riskLevel": "Low" | "Medium" | "High",
  "riskyClauses": [
    {
      "clause": "A short paraphrase (under 20 words) of the specific risky part",
      "explanation": "Why this could be a problem for the person signing, in plain language",
      "recommendation": "One concrete, specific action they could take about it"
    }
  ],
  "actionSteps": [
    "A short, concrete next step the person can take right now"
  ]
}

Rules:
- riskyClauses should only include genuinely notable issues (unusual, one-sided, or unclear terms). If the text is standard and fair, return an empty array and set riskLevel to "Low".
- Never claim certainty about legal validity — use language like "this may not be enforceable in some regions" rather than definitive legal conclusions.
- Include at most 4 riskyClauses and at most 4 actionSteps, prioritizing the most important ones.
- Always include at least one actionStep, even for low-risk text (e.g. "This looks standard, but keep a signed copy for your records.").
- Keep everything concise and in plain, non-legal language.`;

// If this model name 404s, check https://ai.google.dev/gemini-api/docs/models
// for the current free-tier model list and swap it in below.
const GEMINI_MODEL = 'gemini-3.5-flash';

export async function POST(request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    if (isRateLimited(ip)) {
      return Response.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const text = body?.text;
    const language = body?.language || 'english';

    if (!text || typeof text !== 'string' || !text.trim()) {
      return Response.json({ error: 'Please paste some text to scan.' }, { status: 400 });
    }

    const rawApiKeys = process.env.GEMINI_API_KEY;
    if (!rawApiKeys) {
      return Response.json(
        { error: 'Server is missing GEMINI_API_KEY. Add it to your .env.local or deployment environment variables.' },
        { status: 500 }
      );
    }

    const apiKeys = rawApiKeys.split(',').map(key => key.trim()).filter(Boolean);
    if (apiKeys.length === 0) {
      return Response.json(
        { error: 'No valid API keys found in GEMINI_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const languageInstruction = language === 'hindi'
      ? '\n\nCRITICAL: You MUST write all string values in Hindi (हिन्दी). Do not translate JSON keys.'
      : '\n\nCRITICAL: You MUST write all string values in English.';

    const systemPromptCombined = SYSTEM_PROMPT + languageInstruction;

    let response = null;
    let lastErrorStatus = null;
    let lastErrorText = null;

    // Try keys sequentially until one succeeds
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPromptCombined }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: text.slice(0, 6000) }],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                maxOutputTokens: 8192,
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    plainSummary: {
                      type: 'STRING',
                      description: 'A 2-4 sentence plain-language summary of what this text means, written for someone with no legal background.'
                    },
                    riskLevel: {
                      type: 'STRING',
                      enum: ['Low', 'Medium', 'High']
                    },
                    riskyClauses: {
                      type: 'ARRAY',
                      items: {
                        type: 'OBJECT',
                        properties: {
                          clause: {
                            type: 'STRING',
                            description: 'A short paraphrase (under 20 words) of the specific risky part'
                          },
                          explanation: {
                            type: 'STRING',
                            description: 'Why this could be a problem for the person signing, in plain language'
                          },
                          recommendation: {
                            type: 'STRING',
                            description: 'One concrete, specific action they could take about it'
                          }
                        },
                        required: ['clause', 'explanation', 'recommendation']
                      }
                    },
                    actionSteps: {
                      type: 'ARRAY',
                      items: {
                        type: 'STRING'
                      }
                    }
                  },
                  required: ['plainSummary', 'riskLevel', 'riskyClauses', 'actionSteps']
                }
              },
            }),
          }
        );

        if (response.ok) {
          // Success! Break out of the loop
          break;
        }

        // If rate limited (429) or unauthorized/bad credentials, try next key
        lastErrorStatus = response.status;
        lastErrorText = await response.text();
        console.warn(`API Key index ${i} failed with status ${lastErrorStatus}. Error: ${lastErrorText}`);

        if (i < apiKeys.length - 1) {
          console.warn('Attempting rotation: switching to the next API key...');
        }
      } catch (err) {
        lastErrorStatus = 500;
        lastErrorText = err.message;
        console.error(`Unexpected fetch error using key index ${i}:`, err);
        if (i < apiKeys.length - 1) {
          console.warn('Attempting rotation: switching to the next API key...');
        }
      }
    }

    if (!response || !response.ok) {
      // All keys failed, return the final captured error
      console.error('All Gemini API keys in rotation failed.');
      if (lastErrorStatus === 429) {
        return Response.json(
          { error: 'Free quota reached for all active API keys. Please try again in a minute.' },
          { status: 429 }
        );
      }
      return Response.json(
        { error: `The AI request failed. Status: ${lastErrorStatus}. Please try again.` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';

    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI response:', rawText);
      return Response.json({ error: 'Could not parse the AI response. Please try again.' }, { status: 502 });
    }

    return Response.json(parsed, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in /api/analyze:', err);
    return Response.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
