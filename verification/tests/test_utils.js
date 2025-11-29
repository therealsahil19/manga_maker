/**
 * @fileoverview Unit tests for the `js/utils.js` module.
 * This file contains a comprehensive suite of test cases to verify the robustness
 * of utility functions, primarily focusing on `extractImageUrl`.
 */

import { extractImageUrl } from '../../js/utils.js';

/**
 * Runs a suite of unit tests for the `extractImageUrl` utility function.
 * Verifies that the function correctly parses URLs from various text formats,
 * including Markdown, raw URLs, and nested parentheses, while handling edge cases
 * like trailing punctuation and wrapped characters.
 *
 * @async
 * @returns {Promise<void>} - A promise that resolves when all tests have been executed.
 */
async function runTest() {
    let passed = true;
    console.log("Running extractImageUrl tests...");

    /**
     * @typedef {Object} TestCase
     * @property {string} name - The name/description of the test case.
     * @property {string} input - The input string containing a URL.
     * @property {string} expected - The expected extracted URL.
     */

    /**
     * Array of test cases covering standard and edge scenarios.
     * @type {TestCase[]}
     */
    const testCases = [
        {
            name: "Raw URL without parentheses",
            input: "http://example.com/image.png",
            expected: "http://example.com/image.png"
        },
        {
            name: "Markdown URL",
            input: "![alt](http://example.com/image.png)",
            expected: "http://example.com/image.png"
        },
        {
            name: "Raw URL ending with ')'",
            input: "http://example.com/image(1)",
            expected: "http://example.com/image(1)"
        },
        {
            name: "Markdown URL ending with ')'",
            input: "![alt](http://example.com/image(1))",
            expected: "http://example.com/image(1)"
        },
        {
            name: "Raw URL inside parentheses",
            input: "(See: http://example.com/image)",
            expected: "http://example.com/image"
        },
        {
            name: "Raw URL inside parentheses ending with '.'",
            input: "(See: http://example.com/image.)",
            expected: "http://example.com/image"
        },
        {
            name: "Markdown with URL containing nested parens",
            input: "![alt](http://example.com/image(1)foo(2))",
            expected: "http://example.com/image(1)foo(2)"
        },
        {
            name: "Raw URL with trailing punctuation",
            input: "Check this: http://example.com/image.png.",
            expected: "http://example.com/image.png"
        },
        {
            name: "URL in angle brackets",
            input: "Here is the link: <http://example.com/image.png>",
            expected: "http://example.com/image.png"
        },
        {
            name: "URL in quotes",
            input: 'Here is the link: "http://example.com/image.png"',
            expected: "http://example.com/image.png"
        }
    ];

    for (const test of testCases) {
        const result = extractImageUrl(test.input);
        if (result !== test.expected) {
            console.error(`[FAIL] ${test.name}`);
            console.error(`  Input:    ${test.input}`);
            console.error(`  Expected: ${test.expected}`);
            console.error(`  Got:      ${result}`);
            passed = false;
        } else {
            console.log(`[PASS] ${test.name}`);
        }
    }

    if (passed) {
        console.log("\nAll tests passed!");
    } else {
        console.log("\nSome tests failed.");
        process.exit(1);
    }
}

runTest();
