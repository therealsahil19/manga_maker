
import { extractImageUrl } from '../../js/utils.js';

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
