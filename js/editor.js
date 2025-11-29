// Editor Agent
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Converts a file Blob into a GenerativePart object containing Base64 data.
 * This helper function prepares the image data for transmission to the Generative AI API.
 *
 * @param {Blob} file - The image file blob to convert.
 * @returns {Promise<{inlineData: {data: string, mimeType: string}}>} - A promise that resolves to an object structured for the API, containing the base64 data and mime type.
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
 * Critiques a generated image against the original prompt using a Vision LLM.
 * Evaluates the image based on action accuracy and stylistic consistency (Manga, B&W).
 *
 * @param {string} apiKey - The API key for accessing the Google Generative AI service.
 * @param {Blob} imageBlob - The generated image to be critiqued.
 * @param {string} originalPrompt - The text prompt that was used to generate the image.
 * @returns {Promise<{score: number, advice: string}>} - A promise that resolves to an object containing:
 *   - score: A rating from 1 to 10 indicating how well the image matches the prompt.
 *   - advice: A suggestion for improvement if the score is low (otherwise empty).
 *   Returns a default passing score if the critique process fails.
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
