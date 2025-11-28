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
