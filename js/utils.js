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
            if (logCallback) {
                logCallback(`    > Attempt ${i + 1} failed: ${error.message}. Retrying in ${delayMs / 1000}s...`);
            }
            await sleep(delayMs);
            delayMs *= 2; // Exponential backoff
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
    const markdownMatch = text.match(/\!\[.*?\]\((.*?)\)/);
    if (markdownMatch) {
        imageUrl = markdownMatch[1];
    } else {
        // 2. Try raw URL (http...)
        const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            imageUrl = urlMatch[1];
        }
    }

    if (imageUrl) {
        // Clean trailing punctuation that might have been captured (.,;!?)
        // Also handle closing parenthesis/bracket if it wasn't part of markdown
        return imageUrl.replace(/[.,;!?\])]+$/, "");
    }

    return null;
}
