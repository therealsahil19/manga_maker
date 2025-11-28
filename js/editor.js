// Editor Agent (Vision)

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const VISION_MODEL = "meta-llama/llama-3.2-11b-vision-instruct:free";

/**
 * Converts a Blob to a Base64 string.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function janitor(responseText) {
    try {
        return JSON.parse(responseText);
    } catch (e) {
        const start = responseText.indexOf('{');
        const end = responseText.lastIndexOf('}') + 1;
        if (start !== -1 && end !== -1) {
            try {
                return JSON.parse(responseText.substring(start, end));
            } catch (e2) {
                return null;
            }
        }
        return null;
    }
}

/**
 * Critiques an image and suggests a better prompt if needed.
 * @param {Blob} imageBlob
 * @param {string} originalPrompt
 * @param {string} apiKey
 */
export async function critiqueImage(imageBlob, originalPrompt, apiKey) {
    try {
        const base64Image = await blobToBase64(imageBlob);

        const systemPrompt = `
You are 'The Editor', an expert manga art director.
Your goal is to critique a generated manga panel against its description.
If the image looks broken, low quality, or completely ignores the description, you must REJECT it and provide a better prompt.
If it is acceptable, APPROVE it.

Output JSON only:
{
  "pass": true | false,
  "reason": "Why it passed or failed.",
  "improved_prompt": "If failed, provide a significantly better prompt to fix the issues. If passed, return null."
}
`;

        const userContent = [
            { type: "text", text: `Original Description: "${originalPrompt}"\n\nDoes this image match the description and high-quality manga standards?` },
            { type: "image_url", image_url: { url: base64Image } }
        ];

        const payload = {
            model: VISION_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            temperature: 0.5
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.href,
                "X-Title": "Manga Maker V9 Web"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.warn(`Editor API Error: ${response.status}`);
            return { pass: true, reason: "API Error, skipping critique." }; // Fail open
        }

        const result = await response.json();
        const content = result.choices[0].message.content;
        const critique = janitor(content);

        if (!critique) {
            return { pass: true, reason: "Parsing error, skipping critique." };
        }

        return critique;

    } catch (err) {
        console.error("Editor Exception:", err);
        return { pass: true, reason: "Exception, skipping critique." };
    }
}
