// Architect Agent

import { retryOperation } from './utils.js';

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "tngtech/tng-r1t-chimera:free";
const FALLBACK_MODEL = "google/gemini-2.0-flash-lite-preview-02-05:free";

const SYSTEM_PROMPT = `You are 'The Architect', an expert manga layout strategist.
Your goal is to analyze a full chapter text and split it into multiple manga pages (AT LEAST 8 PAGES).
You must also provide a short summary of the chapter events for future context.

You must output a strictly valid JSON object. Do not include markdown formatting like \`\`\`json ... \`\`\`.

Layout Options for each page:
1. "splash": Major reveals, climactic moments. (1 panel)
2. "grid": Action, fights, conversations. (4 panels)
3. "cinematic": Tense dialogue, wide shots. (3 panels)

Output structure:
{
  "chapterSummary": "A concise summary of the events in this chapter.",
  "pages": [
    {
      "pageId": 1,
      "layout": "splash" | "grid" | "cinematic",
      "panels": [
        {
          "id": 1,
          "description": "Visual description only. Focus on composition, subject, action, lighting. No text bubbles."
        }
      ]
    },
    ...
  ]
}

CRITICAL RULES:
1. You MUST generate at least 8 pages.
2. Maintain story continuity.
3. Ensure panel counts match the layout (splash=1, grid=4, cinematic=3).
`;

/**
 * Parses and cleans the JSON response from the LLM.
 * Attempts to extract JSON if the response is wrapped in text or markdown.
 *
 * @param {string} responseText - The raw text response from the LLM.
 * @returns {Object|null} - The parsed JSON object, or null if parsing fails.
 */
function janitor(responseText) {
    try {
        return JSON.parse(responseText);
    } catch (e) {
        // Try to find JSON block
        const start = responseText.indexOf('{');
        const end = responseText.lastIndexOf('}') + 1;
        if (start !== -1 && end !== -1) {
            try {
                return JSON.parse(responseText.substring(start, end));
            } catch (e2) {
                console.error("Janitor failed to clean response", e2);
                return null;
            }
        }
        return null;
    }
}

/**
 * Orchestrates the creation of a chapter blueprint using an LLM.
 * Sends the chapter text and context to the LLM to generate page layouts and panel descriptions.
 * Includes retry logic for API stability and model fallback.
 *
 * @param {string} chapterText - The full text of the chapter to be adapted.
 * @param {string} contextSummary - A summary of previous chapters to maintain context.
 * @param {string} apiKey - The OpenRouter API key.
 * @param {Function} [logCallback] - Optional callback for logging status messages.
 * @returns {Promise<Object>} - A promise that resolves to the chapter blueprint object containing pages and panels.
 *                              Returns a fallback blueprint in case of errors.
 */
export async function getChapterBlueprint(chapterText, contextSummary, apiKey, logCallback) {
    const prompt = `
Context from previous chapters:
${contextSummary}

Current Chapter Text:
${chapterText}

Analyze this text, break it down into at least 8 manga pages, and provide a blueprint.
`;

    // 1. Try Primary Model (TNG Chimera)
    const fetchPrimary = async () => {
        const payload = {
            model: PRIMARY_MODEL,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.href,
                "X-Title": "Manga Maker V9 Web"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Architect Primary API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const content = result.choices[0].message.content;
        const blueprint = janitor(content);

        if (!blueprint || !blueprint.pages) {
            throw new Error("Parsing error or invalid format (Primary).");
        }
        return blueprint;
    };

    // 2. Try Fallback Model (Google Gemini) - merging system prompt
    const fetchFallback = async () => {
        // Merge system prompt into user prompt to avoid 400 errors on some models
        const mergedPrompt = `${SYSTEM_PROMPT}\n\nTask:\n${prompt}`;

        const payload = {
            model: FALLBACK_MODEL,
            messages: [
                { role: "user", content: mergedPrompt }
            ],
            temperature: 0.7
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.href,
                "X-Title": "Manga Maker V9 Web"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Architect Fallback API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const content = result.choices[0].message.content;
        const blueprint = janitor(content);

        if (!blueprint || !blueprint.pages) {
            throw new Error("Parsing error or invalid format (Fallback).");
        }
        return blueprint;
    };

    try {
        if (logCallback) logCallback("Architect: Analysing chapter with primary model...");
        return await retryOperation(fetchPrimary, 2, 2000, logCallback);
    } catch (primaryError) {
        if (logCallback) logCallback(`Architect: Primary model failed (${primaryError.message}). Switching to fallback...`);

        try {
            return await retryOperation(fetchFallback, 2, 2000, logCallback);
        } catch (fallbackError) {
            if (logCallback) {
                logCallback(`CRITICAL ARCHITECT ERROR: ${fallbackError.message}. Switching to simplified manual blueprint.`);
            } else {
                console.error("Architect failed", fallbackError);
            }

            // Ultimate Fallback blueprint
            return {
                chapterSummary: "Error processing chapter - Manual Fallback.",
                pages: [
                    {
                        pageId: 1,
                        layout: "grid",
                        panels: [
                            { id: 1, description: "Scene start (Fallback)." },
                            { id: 2, description: "Scene continues (Fallback)." },
                            { id: 3, description: "Scene action (Fallback)." },
                            { id: 4, description: "Scene end (Fallback)." }
                        ]
                    }
                ]
            };
        }
    }
}
