/**
 * @fileoverview Reproduction test for issue involving double nested parentheses in URLs.
 * This script serves as a regression test to ensure that the `extractImageUrl` utility
 * correctly handles complex Markdown link structures that may appear in LLM outputs.
 */

import { extractImageUrl } from '../../js/utils.js';

/**
 * Runs the reproduction test case.
 * It simulates a scenario where an LLM generates a Markdown image link where the URL
 * itself contains parentheses (e.g., from a filename like `image((1)).jpg`).
 *
 * @async
 * @returns {Promise<void>} - Resolves if the test passes, exits the process with 1 if it fails.
 */
async function runTest() {
    console.log("Running reproduction test for double nested parentheses...");

    const url = "https://example.com/image((1)).jpg";
    const text = `Here is an image: ![alt](${url})`;

    const extracted = extractImageUrl(text);
    console.log(`Original: ${url}`);
    console.log(`Extracted: ${extracted}`);

    if (extracted === url) {
        console.log("[PASS] Double nested parentheses handled correctly.");
    } else {
        console.error(`[FAIL] Expected ${url}, got ${extracted}`);
        process.exit(1);
    }
}

runTest();
