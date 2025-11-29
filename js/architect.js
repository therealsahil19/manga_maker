// Architect Agent
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retryOperation } from './utils.js';

/**
 * The specific Google Gemini model used for blueprint generation.
 * @constant {string}
 */
const MODEL_NAME = "gemini-2.5-pro";

/**
 * Orchestrates the creation of a chapter blueprint using an LLM.
 * This function communicates with the Google Generative AI to parse the story text,
 * update the global context, define style guides, and layout the manga pages.
 *
 * @param {string} apiKey - The Google AI API key for authentication.
 * @param {string} chapterText - The full text content of the chapter to be adapted into manga format.
 * @param {Object} globalContext - The current global context object containing story history and summaries.
 * @param {Function} [logCallback] - Optional callback function for logging status messages and progress updates.
 * @returns {Promise<Object>} - A promise that resolves to the detailed chapter blueprint object.
 *                              The object includes `new_global_context`, `local_style_guide`, and an array of `pages`.
 * @throws {Error} - Throws an error if the generation fails after retries or if the response cannot be parsed.
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
