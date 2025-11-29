// Architect Agent
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retryOperation } from './utils.js';

const MODEL_NAME = "gemini-2.5-pro";

/**
 * Orchestrates the creation of a chapter blueprint using an LLM.
 *
 * @param {string} apiKey - The Google AI API key.
 * @param {string} chapterText - The full text of the chapter to be adapted.
 * @param {Object} globalContext - The current global context object.
 * @param {Function} [logCallback] - Optional callback for logging status messages.
 * @returns {Promise<Object>} - A promise that resolves to the chapter blueprint object.
 */
export async function generateBlueprint(apiKey, chapterText, globalContext, logCallback) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
             responseMimeType: "application/json"
        }
    });

    const prompt = `
    You are 'The Architect', an expert Manga Director.

    [GLOBAL CONTEXT]: ${JSON.stringify(globalContext)}
    [NEW CHAPTER TEXT]: ${chapterText}

    TASK:
    1. Summarize this new chapter and create a "new_global_context" string (append to history).
    2. Create a "local_style_guide" describing the visual appearance of characters/settings in THIS chapter.
    3. Script the chapter into approx 18-20 pages (or fewer if short, but minimum 8).

    OUTPUT JSON FORMAT:
    {
      "new_global_context": "Updated summary...",
      "local_style_guide": {
        "visual_notes": "Atmosphere, lighting...",
        "characters": { "Name": "Visual description..." }
      },
      "pages": [
        {
          "page_number": 1,
          "layout": "splash" | "grid" | "cinematic",
          "panels": [
            {
              "panel_id": "p1",
              "visual_prompt": "Visual description of the panel...",
              "dialogue_bubbles": [
                 { "speaker": "Name", "text": "Dialogue...", "position": "top_left" | "top_right" | "bottom_left" | "bottom_right" | "center" }
              ]
            }
          ]
        }
      ]
    }
    `;

    const fetchBlueprint = async () => {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Remove potential markdown code blocks if the model ignores MIME type (safety)
        const cleanText = text.replace(/```json|```/g, '');
        return JSON.parse(cleanText);
    };

    if (logCallback) logCallback(`Architect: Designing chapter using ${MODEL_NAME}...`);

    try {
        return await retryOperation(fetchBlueprint, 2, 2000, logCallback);
    } catch (e) {
        throw new Error(`Architect failed: ${e.message}`);
    }
}
