
import { calculateLayout } from '../../js/layoutEngine.js';

console.log("Running layoutEngine robustness test...");
try {
    const result = calculateLayout(undefined);
    console.log("Result for undefined:", result);
} catch (e) {
    console.error("Crash detected with undefined input:", e.message);
    process.exit(1);
}

try {
    const result = calculateLayout(null);
    console.log("Result for null:", result);
} catch (e) {
    console.error("Crash detected with null input:", e.message);
    process.exit(1);
}

console.log("SUCCESS: layoutEngine handled invalid inputs gracefully.");
