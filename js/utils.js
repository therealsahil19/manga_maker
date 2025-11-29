/**
 * Delays execution for a specified number of milliseconds.
 *
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} - A promise that resolves after the specified delay.
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an asynchronous operation with exponential backoff.
 *
 * @param {Function} fn - The async function to execute.
 * @param {number} [retries=3] - The maximum number of retry attempts.
 * @param {number} [delayMs=2000] - The initial delay in milliseconds before the first retry.
 * @param {Function} [logCallback] - Optional callback function for logging retry attempts.
 * @returns {Promise<*>} - The result of the successful operation.
 * @throws {Error} - Throws the last error encountered if all retries fail.
 */
export async function retryOperation(fn, retries = 3, delayMs = 2000, logCallback) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            // Only sleep if this is NOT the last attempt
            if (i < retries - 1) {
                if (logCallback) {
                    logCallback(`    > Attempt ${i + 1} failed: ${error.message}. Retrying in ${delayMs / 1000}s...`);
                }
                await sleep(delayMs);
                delayMs *= 2; // Exponential backoff
            } else {
                 if (logCallback) {
                    logCallback(`    > Attempt ${i + 1} failed: ${error.message}. Giving up.`);
                }
            }
        }
    }
    throw lastError;
}

/**
 * Extracts a clean Image URL from a text response.
 * Handles Markdown links and raw URLs, and cleans trailing punctuation.
 *
 * @param {string} text - The text to search for a URL.
 * @returns {string|null} - The extracted URL or null if not found.
 */
export function extractImageUrl(text) {
    if (!text) return null;

    let imageUrl = null;

    // 1. Try Markdown Image: ![alt](url)
    // We manually parse to handle nested parentheses (e.g. in filenames) which regex struggles with.
    const markdownStart = text.match(/\!\[.*?\]\(/);
    if (markdownStart) {
        const startIndex = markdownStart.index + markdownStart[0].length;
        let depth = 1;
        let endIndex = -1;

        for (let i = startIndex; i < text.length; i++) {
            if (text[i] === '(') depth++;
            else if (text[i] === ')') depth--;

            if (depth === 0) {
                endIndex = i;
                break;
            }
        }

        if (endIndex !== -1) {
            imageUrl = text.substring(startIndex, endIndex);
        }
    }

    if (!imageUrl) {
        // 2. Try raw URL (http...)
        const urlMatch = text.match(/(https?:\/\/[^\s"<>]+)/);
        if (urlMatch) {
            imageUrl = urlMatch[1];
        }
    }

    if (imageUrl) {
        let cleanUrl = imageUrl;

        // Loop to clean tail of URL from punctuation and unbalanced parens/brackets
        // We loop because removing a char might expose a new tail (e.g. ".)")
        while (true) {
            const oldUrl = cleanUrl;

            // 1. Strip standard trailing punctuation (.,;!?)
            cleanUrl = cleanUrl.replace(/[.,;!?]+$/, "");

            // 2. Handle trailing parentheses/brackets responsibly
            const lastChar = cleanUrl.slice(-1);
            if (lastChar === ')') {
                const open = (cleanUrl.match(/\(/g) || []).length;
                const close = (cleanUrl.match(/\)/g) || []).length;
                // If we have more closing than opening, the last one is likely surrounding punctuation
                if (close > open) {
                    cleanUrl = cleanUrl.slice(0, -1);
                }
            } else if (lastChar === ']') {
                const open = (cleanUrl.match(/\[/g) || []).length;
                const close = (cleanUrl.match(/\]/g) || []).length;
                if (close > open) {
                    cleanUrl = cleanUrl.slice(0, -1);
                }
            }

            // If nothing changed in this iteration, we are done
            if (cleanUrl === oldUrl) break;
        }

        return cleanUrl;
    }

    return null;
}
