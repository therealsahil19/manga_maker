// Artist Agent

import { critiqueImage } from './editor.js';

const STYLE_SUFFIX = ", Seinen style, heavy cross-hatching, dramatic high contrast shadows, intricate details, manga aesthetic, black and white, masterpiece by Kentaro Miura, ink drawing";

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
            imageBlob = await generateWithCloudflare(currentPrompt, cfAccountId, cfApiToken);
            source = "Cloudflare";
        } else {
            throw new Error("Missing Cloudflare Credentials");
        }
    } catch (cfErr) {
        logCallback(`  > Cloudflare failed (${cfErr.message}). Switching to Pollinations...`);
        try {
            imageBlob = await generateWithPollinations(currentPrompt);
            source = "Pollinations";
        } catch (pollErr) {
            throw new Error(`All generation methods failed. CF: ${cfErr.message}, Poll: ${pollErr.message}`);
        }
    }

    logCallback(`  > Artist: Image generated via ${source}.`);

    // 2. Critique Phase (if OpenRouter Key is present)
    if (orKey) {
        logCallback("  > Editor: Critiquing image...");
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
            ctx.fillStyle = "black"; ctx.fillText("Error", 10, 50);
            results[panel.id] = canvas;
        }
    }

    return results;
}
