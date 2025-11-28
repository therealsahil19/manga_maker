// Artist Agent

const DEFAULT_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";
const STYLE_SUFFIX = ", Seinen style, heavy cross-hatching, dramatic high contrast shadows, intricate details, manga aesthetic, black and white, masterpiece by Kentaro Miura, ink drawing";

async function generatePanel(prompt, apiKey, modelId) {
    const model = modelId || DEFAULT_MODEL;
    const fullPrompt = prompt + STYLE_SUFFIX;
    const url = `https://api-inference.huggingface.co/models/${model}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: fullPrompt })
    });

    if (response.status === 503) {
        throw new Error(`Model ${model} is currently loading. Please try again in a moment.`);
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Artist API Error (${response.status}): ${errorText}`);
    }

    // HF returns a Blob (image)
    return await response.blob();
}

export async function generatePagePanels(panelsData, apiKey, modelId, logCallback) {
    const results = {};
    const promises = panelsData.map(async (panel) => {
        try {
            logCallback(`Generating Panel ${panel.id}...`);
            const blob = await generatePanel(panel.description, apiKey, modelId);
            // Convert Blob to ImageBitmap or URL for Canvas
            const imgBitmap = await createImageBitmap(blob);
            results[panel.id] = imgBitmap;
            logCallback(`Panel ${panel.id} ready.`);
        } catch (e) {
            logCallback(`Error generating Panel ${panel.id}: ${e.message}`);
            // Return placeholder or rethrow?
            // Let's rethrow to stop process or use a placeholder?
            // Python code stops.
            throw e;
        }
    });

    await Promise.all(promises);
    return results;
}
