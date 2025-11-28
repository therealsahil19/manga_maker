// Architect Agent

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

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
 *
 * @param {string} chapterText - The full text of the chapter to be adapted.
 * @param {string} contextSummary - A summary of previous chapters to maintain context.
 * @param {string} apiKey - The OpenRouter API key.
 * @returns {Promise<Object>} - A promise that resolves to the chapter blueprint object containing pages and panels.
 *                              Returns a fallback blueprint in case of parsing errors.
 * @throws {Error} - Throws an error if the API request fails.
 */
export async function getChapterBlueprint(chapterText, contextSummary, apiKey) {
    const prompt = `
Context from previous chapters:
${contextSummary}

Current Chapter Text:
${chapterText}

Analyze this text, break it down into at least 8 manga pages, and provide a blueprint.
`;

    const payload = {
        model: MODEL,
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
        throw new Error(`Architect API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    const blueprint = janitor(content);

    if (!blueprint || !blueprint.pages) {
        console.warn("Parsing error or invalid format. Returning fallback.");
        return {
            chapterSummary: "Error processing chapter.",
            pages: [
                {
                    pageId: 1,
                    layout: "grid",
                    panels: [
                        { id: 1, description: "Scene start." },
                        { id: 2, description: "Scene continues." },
                        { id: 3, description: "Scene action." },
                        { id: 4, description: "Scene end." }
                    ]
                }
            ]
        };
    }

    return blueprint;
}
