// Artist Agent
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retryOperation } from './utils.js';

const MODEL_NAME = "gemini-2.5-flash-image";

/**
 * Generates an image using Google's Gemini 2.5 Flash Image model.
 *
 * @param {string} apiKey - The Google AI API key.
 * @param {string} prompt - The prompt describing the image.
 * @returns {Promise<Blob>} - A promise that resolves to the generated image as a Blob.
 */
async function generateImage(apiKey, prompt) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent(prompt);
    const response = result.response;

    // Check for inline data (Base64)
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || "image/png";

                // Convert Base64 to Blob
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray], { type: mimeType });
            }
        }
    }

    throw new Error("No image data found in response.");
}

/**
 * Generates a panel image with retry logic.
 *
 * @param {string} apiKey - The Google AI API key.
 * @param {string} fullPrompt - The complete prompt including style guide.
 * @param {Function} logCallback - Callback for logging.
 * @returns {Promise<Blob>} - The generated image Blob.
 */
export async function generatePanelImage(apiKey, fullPrompt, logCallback) {
    // Retry wrapper
    return await retryOperation(
        () => generateImage(apiKey, fullPrompt),
        3,
        2000,
        logCallback
    );
}
