// Architect Agent

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

const SYSTEM_PROMPT = `You are 'The Architect', an expert manga layout strategist.
Your goal is to analyze a story segment and determine the best page layout and panel visual descriptions.

You must output a strictly valid JSON object. Do not include markdown formatting like \`\`\`json ... \`\`\`.

Analyze the provided text and choose ONE of the following layouts:
1. "splash": Use for major reveals, climactic moments, or establishing shots. (1 panel)
2. "grid": Use for fast-paced action, fight scenes, or conversations. (4 panels)
3. "cinematic": Use for tense dialogue, wide shots, or dramatic pacing. (3 panels)

Output structure:
{
  "layout": "splash" | "grid" | "cinematic",
  "reasoning": "Brief explanation of why this layout fits the tone.",
  "panels": [
    {
      "id": 1,
      "description": "Visual description of the panel. Focus on composition, subject, action, and lighting. Do not include text bubbles."
    },
    ...
  ]
}

Ensure the number of panels matches the layout:
- splash: 1 panel
- grid: 4 panels
- cinematic: 3 panels
`;

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

export async function getBlueprint(sceneText, apiKey) {
    const payload = {
        model: MODEL,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Analyze this scene:\n\n${sceneText}` }
        ],
        temperature: 0.7
    };

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.href, // OpenRouter requirement
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

    if (!blueprint) {
        console.warn("Using fallback grid layout due to parsing error.");
        return {
            layout: "grid",
            reasoning: "Fallback due to AI error.",
            panels: [
                { id: 1, description: "A generic scene visualization." },
                { id: 2, description: "A generic scene visualization." },
                { id: 3, description: "A generic scene visualization." },
                { id: 4, description: "A generic scene visualization." }
            ]
        };
    }

    return blueprint;
}
