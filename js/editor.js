// Editor Agent
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Converts a Blob to a GenerativePart object (Base64).
 */
async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}

/**
 * Critiques an image against a prompt.
 *
 * @param {string} apiKey - The Google AI API key.
 * @param {Blob} imageBlob - The generated image.
 * @param {string} originalPrompt - The prompt used.
 * @returns {Promise<{score: number, advice: string}>}
 */
export async function critiqueImage(apiKey, imageBlob, originalPrompt) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: { responseMimeType: "application/json" }
        });

        const imagePart = await fileToGenerativePart(imageBlob);

        const prompt = `
        Compare this generated image to the prompt: "${originalPrompt}".
        1. Is the action correct?
        2. Is the style consistent (Manga, B&W)?

        Output JSON: { "score": (1-10), "advice": "Short sentence on how to fix it if score < 7" }
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();
        return JSON.parse(text.replace(/```json|```/g, ''));
    } catch (e) {
        console.warn("Editor critique failed, passing by default.", e);
        return { score: 10, advice: "" }; // Fail open
    }
}
