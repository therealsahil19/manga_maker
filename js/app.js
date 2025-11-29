// Main Controller
import { generateBlueprint } from './architect.js';
import { runProductionLoop } from './production.js';
import { createPageElement } from './typesetter.js';
import { ContextManager } from './contextManager.js';
import JSZip from 'jszip';

/**
 * References to DOM elements used in the application.
 * @type {Object}
 * @property {HTMLInputElement} apiKey - The input field for the Google AI API key.
 * @property {HTMLInputElement} chapterNum - The input field for the current chapter number.
 * @property {HTMLInputElement} contextFile - The file input for loading existing context JSON.
 * @property {HTMLTextAreaElement} sceneText - The textarea for entering the scene description.
 * @property {HTMLButtonElement} generateBtn - The button to trigger the generation process.
 * @property {HTMLDivElement} statusLog - The container for displaying status messages.
 * @property {HTMLDivElement} pagesContainer - The container where generated manga pages are appended.
 * @property {HTMLDivElement} progressBarContainer - The container for the progress bar.
 * @property {HTMLDivElement} progressBar - The progress bar element itself.
 */
const DOM = {
    apiKey: document.getElementById('google-key'),
    chapterNum: document.getElementById('chapter-num'),
    contextFile: document.getElementById('context-file'),
    sceneText: document.getElementById('scene-text'),
    generateBtn: document.getElementById('generate-btn'),
    statusLog: document.getElementById('status-log'),
    pagesContainer: document.getElementById('pages-container'),
    progressBarContainer: document.getElementById('progress-bar-container'),
    progressBar: document.getElementById('progress-bar')
};

/**
 * The context manager instance responsible for tracking story state.
 * @type {ContextManager}
 */
const contextManager = new ContextManager();

/**
 * Appends a message to the status log in the UI.
 *
 * @param {string} message - The message to display.
 */
function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    DOM.statusLog.textContent += `[${timestamp}] ${message}\n`;
    DOM.statusLog.scrollTop = DOM.statusLog.scrollHeight;
}

/**
 * Updates the visual progress bar.
 *
 * @param {number} percent - The percentage of completion (0-100).
 */
function updateProgress(percent) {
    DOM.progressBar.style.width = `${percent}%`;
}

/**
 * Validates the required user inputs before starting generation.
 *
 * @returns {string|null} - An error message if validation fails, or null if valid.
 */
function validateInputs() {
    if (!DOM.apiKey.value) return "Missing Google API Key";
    if (!DOM.sceneText.value.trim()) return "Missing Scene Text";
    return null;
}

// Context Loading
/**
 * Event listener for loading context files.
 * Parses the uploaded JSON file and loads it into the ContextManager.
 * If successful, updates the chapter number input based on the loaded context.
 */
DOM.contextFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target.result);
            contextManager.loadContext(json);
            if (contextManager.context.currentChapter) {
                DOM.chapterNum.value = contextManager.context.currentChapter + 1;
            }
            log("Context loaded successfully.");
        } catch (err) {
            log("Error parsing context file.");
        }
    };
    reader.readAsText(file);
});

// Main Generation Logic
/**
 * Event listener for the Generate button.
 * Orchestrates the entire manga generation pipeline:
 * 1. Validates inputs.
 * 2. Initializes UI for generation.
 * 3. Calls Architect to generate the blueprint.
 * 4. Updates context.
 * 5. Calls Production Loop to generate images and pages.
 * 6. Packages results into a ZIP file for download.
 */
DOM.generateBtn.addEventListener('click', async () => {
    const error = validateInputs();
    if (error) { log(`Error: ${error}`); return; }

    DOM.generateBtn.disabled = true;
    DOM.pagesContainer.innerHTML = '';
    DOM.statusLog.textContent = "";
    DOM.progressBarContainer.style.display = "block";
    updateProgress(0);

    log("Starting Production Pipeline...");

    try {
        const apiKey = DOM.apiKey.value;
        const chapterText = DOM.sceneText.value;
        const currentContext = contextManager.getContextData(); // Get full object

        // 1. Architect Phase
        log("Phase 1: Architect (Blueprint Generation)...");
        const blueprint = await generateBlueprint(apiKey, chapterText, currentContext, log);

        log(`Blueprint created: ${blueprint.pages.length} pages planned.`);

        // Update Context immediately in memory
        if (blueprint.new_global_context) {
            // We'll update the internal manager but save to ZIP later
             // Assuming simple append or replace logic in manager
             // For now we just trust the Architect's output string as the summary
             contextManager.updateContext(DOM.chapterNum.value, blueprint.new_global_context);
        }

        // 2. Production Phase
        const zip = new JSZip();

        // Add updated context to ZIP
        const newContextData = contextManager.getContextData();
        zip.file(`context_updated_ch${DOM.chapterNum.value}.json`, JSON.stringify(newContextData, null, 2));

        log("Phase 2: Production (Image Generation)...");

        let pagesCompleted = 0;
        const totalPages = blueprint.pages.length;

        await runProductionLoop(
            blueprint,
            apiKey,
            zip,
            log,
            async (pageData, pageImages) => {
                // On Page Complete (Typesetter)
                log(`  > Assembling Page ${pageData.page_number} preview...`);
                const pageEl = await createPageElement(pageData, pageImages);
                DOM.pagesContainer.appendChild(pageEl);

                pagesCompleted++;
                updateProgress((pagesCompleted / totalPages) * 100);
            }
        );

        // 3. Finalize
        log("Phase 3: Packaging...");
        const content = await zip.generateAsync({ type: "blob" });

        // Trigger Download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `Manga_Chapter_${DOM.chapterNum.value}.zip`;
        link.click();

        log("Done! Download started.");
        alert("Chapter Generation Complete! Check your downloads.");

    } catch (err) {
        console.error(err);
        log(`CRITICAL ERROR: ${err.message}`);
    } finally {
        DOM.generateBtn.disabled = false;
    }
});
