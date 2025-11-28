// Artist Agent

import { critiqueImage } from './editor.js';

const STYLE_SUFFIX = ", Seinen style, heavy cross-hatching, dramatic high contrast shadows, intricate details, manga aesthetic, black and white, masterpiece by Kentaro Miura, ink drawing";

fix/generation-stability
// Helper: Sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Retry Operation
async function retryOperation(fn, retries = 3, delayMs = 2000, logCallback) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (logCallback) logCallback(`    > Attempt ${i + 1} failed: ${error.message}. Retrying in ${delayMs/1000}s...`);
            await sleep(delayMs);
            delayMs *= 2; // Exponential backoff
        }
    }
    throw lastError;
}

=======
  main
/**
 * Generates an image using Cloudflare Workers AI.
 * @param {string} prompt
 * @param {string} accountId
 * @param {string} apiToken
 */
async function generateWithCloudflare(prompt, accountId, apiToken) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            prompt: prompt + STYLE_SUFFIX,
            num_steps: 20 // Default reasonable step count
        })
    });

    if (!response.ok) {
        throw new Error(`Cloudflare Error: ${response.status} ${response.statusText}`);
    }

    // Cloudflare returns binary image data directly for this model
    return await response.blob();
}

/**
 * Generates an image using Pollinations.ai (Fallback).
 * @param {string} prompt
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
 * Generates a panel, critiques it, and retries if necessary.
 */
async function generatePanelWithRetry(panelDesc, cfAccountId, cfApiToken, orKey, logCallback) {
    let currentPrompt = panelDesc;
    let imageBlob = null;
    let source = "";

    // 1. Generation Phase
    try {
        if (cfAccountId && cfApiToken) {
            logCallback("  > Artist: Trying Cloudflare...");
fix/generation-stability
            // Wrap in retry
            imageBlob = await retryOperation(
                () => generateWithCloudflare(currentPrompt, cfAccountId, cfApiToken),
                3, 2000, logCallback
            );
=======
            imageBlob = await generateWithCloudflare(currentPrompt, cfAccountId, cfApiToken);
main
            source = "Cloudflare";
        } else {
            throw new Error("Missing Cloudflare Credentials");
        }
    } catch (cfErr) {
        logCallback(`  > Cloudflare failed (${cfErr.message}). Switching to Pollinations...`);
        try {
fix/generation-stability
            // Wrap in retry
            imageBlob = await retryOperation(
                () => generateWithPollinations(currentPrompt),
                3, 3000, logCallback
            );
=======
            imageBlob = await generateWithPollinations(currentPrompt);
main
            source = "Pollinations";
        } catch (pollErr) {
            throw new Error(`All generation methods failed. CF: ${cfErr.message}, Poll: ${pollErr.message}`);
        }
    }

    logCallback(`  > Artist: Image generated via ${source}.`);

    // 2. Critique Phase (if OpenRouter Key is present)
    if (orKey) {
        logCallback("  > Editor: Critiquing image...");
 fix/generation-stability
        // Critique doesn't strictly need retries as it's an LLM call, but could benefit.
        // For now, let's keep it simple to save tokens.
        try {
            const decision = await critiqueImage(imageBlob, panelDesc, orKey);

            if (!decision.pass && decision.improved_prompt) {
                logCallback(`  > Editor: REJECTED. Reason: ${decision.reason}`);
                logCallback("  > Artist: Retrying with improved prompt...");

                try {
                    // Retry generation with improved prompt (single attempt path for simplicity, or we could recurse)
                    // Let's use the retry wrapper again but just 1-2 times.
                    if (cfAccountId && cfApiToken) {
                        imageBlob = await retryOperation(() => generateWithCloudflare(decision.improved_prompt, cfAccountId, cfApiToken), 2, 2000);
                    } else {
                        imageBlob = await retryOperation(() => generateWithPollinations(decision.improved_prompt), 2, 3000);
                    }
                    logCallback("  > Artist: Retry successful.");
                } catch (retryErr) {
                    logCallback(`  > Retry failed: ${retryErr.message}. Using original.`);
                }
            } else {
                logCallback("  > Editor: APPROVED.");
            }
        } catch (editorErr) {
            logCallback(`  > Editor failed to respond: ${editorErr.message}. Proceeding.`);
=======
        const decision = await critiqueImage(imageBlob, panelDesc, orKey);

        if (!decision.pass && decision.improved_prompt) {
            logCallback(`  > Editor: REJECTED. Reason: ${decision.reason}`);
            logCallback("  > Artist: Retrying with improved prompt...");

            try {
                // Retry generation (same logic as above)
                if (cfAccountId && cfApiToken) {
                    imageBlob = await generateWithCloudflare(decision.improved_prompt, cfAccountId, cfApiToken);
                } else {
                    imageBlob = await generateWithPollinations(decision.improved_prompt);
                }
                logCallback("  > Artist: Retry successful.");
            } catch (retryErr) {
                logCallback(`  > Retry failed: ${retryErr.message}. Using original.`);
            }
        } else {
            logCallback("  > Editor: APPROVED.");
main
        }
    }

    return imageBlob;
}

export async function generatePagePanels(panelsData, cfAccountId, cfApiToken, orKey, logCallback) {
    const results = {};

    // Process sequentially
    for (const panel of panelsData) {
        try {
            logCallback(`Generating Panel ${panel.id}...`);
            const blob = await generatePanelWithRetry(panel.description, cfAccountId, cfApiToken, orKey, logCallback);
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
          fix/generation-stability
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

=======
            ctx.fillStyle = "black"; ctx.fillText("Error", 10, 50);
            results[panel.id] = canvas;
        }
    }
 main
    return results;
}
