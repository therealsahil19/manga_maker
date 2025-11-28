// Artist Agent

import { critiqueImage } from './editor.js';
import { sleep, retryOperation } from './utils.js';

const STYLE_SUFFIX = ", Seinen style, heavy cross-hatching, dramatic high contrast shadows, intricate details, manga aesthetic, black and white, masterpiece by Kentaro Miura, ink drawing";
const FLUX_MODEL = "black-forest-labs/flux-1-schnell";
const SDXL_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";
// Switched to Chat Completions endpoint for broader model compatibility on OpenRouter
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Generates an image using OpenRouter via the Chat Completions endpoint.
 * This is preferred for many models like Flux on OpenRouter which support
 * image generation via the 'chat' interface or return markdown links.
 *
 * @param {string} prompt - The prompt describing the image to generate.
 * @param {string} model - The model ID to use.
 * @param {string} apiKey - The OpenRouter API key.
 * @returns {Promise<Blob>} - A promise that resolves to the generated image as a Blob.
 * @throws {Error} - Throws an error if the API request fails or no image is found.
 */
async function generateWithOpenRouter(prompt, model, apiKey) {
    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.href,
            "X-Title": "Manga Maker V9 Web"
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "user", content: prompt + STYLE_SUFFIX }
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`OpenRouter Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
         throw new Error("Invalid response format from OpenRouter.");
    }

    const content = data.choices[0].message.content;

    // Extract Image URL
    let imageUrl = null;

    // 1. Try Markdown Image: ![alt](url)
    const markdownMatch = content.match(/\!\[.*?\]\((.*?)\)/);
    if (markdownMatch) {
        imageUrl = markdownMatch[1];
    } else {
        // 2. Try raw URL (http...)
        const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
             imageUrl = urlMatch[1];
        }
    }

    if (!imageUrl) {
        // Check if there is a 'url' property in the delta/message object directly (some providers)
        // or check for 'image_url'
        // But strictly for OpenRouter Chat completion, it's usually in content.
        throw new Error("No image URL found in model response.");
    }

    // Fetch the image from the URL provided
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw new Error("Failed to download generated image.");
    }

    return await imageResponse.blob();
}

/**
 * Generates an image using Pollinations.ai (Fallback).
 *
 * @param {string} prompt - The prompt describing the image to generate.
 * @returns {Promise<Blob>} - A promise that resolves to the generated image as a Blob.
 * @throws {Error} - Throws an error if the API request fails.
 */
async function generateWithPollinations(prompt) {
    const encodedPrompt = encodeURIComponent(prompt + STYLE_SUFFIX);
    // Add random seed to ensure new images on retry
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Pollinations Error: ${response.status}`);
    }

    return await response.blob();
}

/**
 * Generates a panel, critiques it using the Editor agent, and retries generation if necessary.
 *
 * @param {string} panelDesc - The description of the panel to generate.
 * @param {string} orKey - The OpenRouter API key.
 * @param {Function} logCallback - Callback function for logging progress and errors.
 * @returns {Promise<Blob|null>} - A promise that resolves to the generated image Blob, or null if generation fails completely.
 * @throws {Error} - Throws an error if all generation methods fail.
 */
async function generatePanelWithRetry(panelDesc, orKey, logCallback) {
    let currentPrompt = panelDesc;
    let imageBlob = null;
    let source = "";

    // 1. Generation Phase
    try {
        logCallback("  > Artist: Trying Flux (schnell)...");
        // Try Flux
        imageBlob = await retryOperation(
            () => generateWithOpenRouter(currentPrompt, FLUX_MODEL, orKey),
            2, 2000, logCallback
        );
        source = "Flux";
    } catch (fluxErr) {
        logCallback(`  > Flux failed (${fluxErr.message}). Switching to SDXL...`);
        try {
            // Try SDXL
            imageBlob = await retryOperation(
                () => generateWithOpenRouter(currentPrompt, SDXL_MODEL, orKey),
                2, 2000, logCallback
            );
            source = "SDXL";
        } catch (sdxlErr) {
            logCallback(`  > SDXL failed (${sdxlErr.message}). Switching to Pollinations...`);
            try {
                // Fallback to Pollinations
                imageBlob = await retryOperation(
                    () => generateWithPollinations(currentPrompt),
                    3, 3000, logCallback
                );
                source = "Pollinations";
            } catch (pollErr) {
                throw new Error(`All generation methods failed. Flux: ${fluxErr.message}, SDXL: ${sdxlErr.message}, Poll: ${pollErr.message}`);
            }
        }
    }

    logCallback(`  > Artist: Image generated via ${source}.`);

    // 2. Critique Phase (if OpenRouter Key is present)
    if (orKey) {
        logCallback("  > Editor: Critiquing image...");
        try {
            const decision = await critiqueImage(imageBlob, panelDesc, orKey);

            if (!decision.pass && decision.improved_prompt) {
                logCallback(`  > Editor: REJECTED. Reason: ${decision.reason}`);
                logCallback("  > Artist: Retrying with improved prompt...");

                try {
                    // Retry using the same successful source (simplified logic: try Flux/SDXL preference again)
                    // We will just try Flux then SDXL again, or Pollinations if those fail.
                    // To keep it simple, we'll try Flux -> Pollinations for the retry.
                    try {
                        imageBlob = await retryOperation(() => generateWithOpenRouter(decision.improved_prompt, FLUX_MODEL, orKey), 1, 2000);
                        source = "Flux (Retry)";
                    } catch (e) {
                         try {
                            imageBlob = await retryOperation(() => generateWithOpenRouter(decision.improved_prompt, SDXL_MODEL, orKey), 1, 2000);
                            source = "SDXL (Retry)";
                         } catch (e2) {
                            imageBlob = await retryOperation(() => generateWithPollinations(decision.improved_prompt), 1, 3000);
                            source = "Pollinations (Retry)";
                         }
                    }
                    logCallback(`  > Artist: Retry successful via ${source}.`);
                } catch (retryErr) {
                    logCallback(`  > Retry failed: ${retryErr.message}. Using original.`);
                }
            } else {
                logCallback("  > Editor: APPROVED.");
            }
        } catch (editorErr) {
            logCallback(`  > Editor failed to respond: ${editorErr.message}. Proceeding.`);
        }
    }

    return imageBlob;
}

/**
 * Generates images for a list of panels sequentially.
 * Includes throttling to avoid rate limits and error handling for individual panels.
 *
 * @param {Array<Object>} panelsData - Array of panel objects, each containing an `id` and `description`.
 * @param {string} orKey - The OpenRouter API key.
 * @param {Function} logCallback - Callback function for logging progress.
 * @returns {Promise<Object>} - A promise that resolves to an object mapping panel IDs to ImageBitmap objects (or canvas placeholders on error).
 */
export async function generatePagePanels(panelsData, orKey, logCallback) {
    const results = {};

    // Process sequentially
    for (const panel of panelsData) {
        try {
            logCallback(`Generating Panel ${panel.id}...`);
            const blob = await generatePanelWithRetry(panel.description, orKey, logCallback);
            const imgBitmap = await createImageBitmap(blob);
            results[panel.id] = imgBitmap;
            logCallback(`Panel ${panel.id} ready.`);
        } catch (e) {
            logCallback(`Error generating Panel ${panel.id}: ${e.message}`);
            // Fallback: Create a blank white placeholder so the typesetter doesn't crash
            const canvas = document.createElement('canvas');
            canvas.width = 100; canvas.height = 100;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = "#eee"; ctx.fillRect(0,0,100,100);
            ctx.fillStyle = "red"; ctx.font = "12px sans-serif";
            // Wrap text for error
            ctx.fillText("Generation Failed", 5, 20);
            ctx.fillStyle = "black";
            // ctx.fillText(e.message.substring(0, 15) + "...", 5, 40);
            results[panel.id] = canvas;
        }

        // Throttle: Add a meaningful delay between panels to avoid rate limits
        if (panelsData.length > 1) {
             const delayTime = 4000; // 4 seconds
             logCallback(`  > Cooldown: Waiting ${delayTime/1000}s...`);
             await sleep(delayTime);
        }
    }

    return results;
}
