
import { extractImageUrl } from '../../js/utils.js';

async function runTest() {
    let passed = true;
    console.log("Running extractImageUrl tests...");

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
