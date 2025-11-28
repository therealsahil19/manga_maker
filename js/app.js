// Main Controller

import { getChapterBlueprint } from './architect.js';
import { calculateLayout } from './layoutEngine.js';
import { generatePagePanels } from './artist.js';
import { assemblePage } from './typesetter.js';
import { ContextManager } from './contextManager.js';

/**
 * DOM Elements Cache
 * @type {Object.<string, HTMLElement>}
 */
const DOM = {
    orKey: document.getElementById('openrouter-key'),
    cfAccount: document.getElementById('cf-account'),
    cfToken: document.getElementById('cf-token'),
    chapterNum: document.getElementById('chapter-num'),
    contextFile: document.getElementById('context-file'),
    downloadContextBtn: document.getElementById('download-context-btn'),
    sceneText: document.getElementById('scene-text'),
    generateBtn: document.getElementById('generate-btn'),
    statusLog: document.getElementById('status-log'),
    pagesContainer: document.getElementById('pages-container'),
    progressBarContainer: document.getElementById('progress-bar-container'),
    progressBar: document.getElementById('progress-bar')
};

const contextManager = new ContextManager();

/**
 * Appends a message to the status log with a timestamp.
 * @param {string} message - The message to log.
 */
function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    DOM.statusLog.textContent += `[${timestamp}] ${message}\n`;
    DOM.statusLog.scrollTop = DOM.statusLog.scrollHeight;
}

/**
 * Updates the progress bar width.
 * @param {number} percent - The percentage (0-100) of progress.
 */
function updateProgress(percent) {
    DOM.progressBar.style.width = `${percent}%`;
}

/**
 * Validates the required inputs before generation.
 * @returns {string|null} - Returns an error message string if invalid, or null if valid.
 */
function validateInputs() {
    if (!DOM.orKey.value) return "Missing OpenRouter API Key";
    // Cloudflare is optional (fallback to Pollinations)
    if (!DOM.sceneText.value.trim()) return "Missing Scene Text";
    return null;
}

// Event: Load Context
DOM.contextFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target.result);
            contextManager.loadContext(json);

            // Auto-update chapter number
            if (contextManager.context.currentChapter) {
                DOM.chapterNum.value = contextManager.context.currentChapter + 1;
            }

            log("Context loaded successfully.");
        } catch (err) {
            log("Error parsing context file.");
            console.error(err);
        }
    };
    reader.readAsText(file);
});

// Event: Download Context
DOM.downloadContextBtn.addEventListener('click', () => {
    const data = contextManager.getContextData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `story_context_ch${data.currentChapter}.json`;
    link.click();
});

// Event: Generate
DOM.generateBtn.addEventListener('click', async () => {
    const error = validateInputs();
    if (error) {
        log(`Error: ${error}`);
        return;
    }

    DOM.generateBtn.disabled = true;
    DOM.pagesContainer.innerHTML = ''; // Clear previous pages
    DOM.statusLog.textContent = "";
    DOM.progressBarContainer.style.display = "block";
    updateProgress(0);

    log("Starting Chapter Generation...");

    try {
        const contextSummary = contextManager.getContextSummary();
        const chapterText = DOM.sceneText.value;
        const currentChapter = DOM.chapterNum.value;

        // 1. Architect: Get Blueprint
        log("Architect: Analyzing chapter and designing pages...");
        const blueprint = await getChapterBlueprint(chapterText, contextSummary, DOM.orKey.value, (msg) => log(msg));

        const pageCount = blueprint.pages.length;
        log(`Architect: Planned ${pageCount} pages.`);

        // 2. Loop through pages
        for (let i = 0; i < pageCount; i++) {
            const pageData = blueprint.pages[i];
            log(`\n--- Processing Page ${pageData.pageId} / ${pageCount} ---`);
            log(`Layout: ${pageData.layout}`);

            // Layout Engine
            const layoutCoords = calculateLayout(pageData.layout);

            // Merge descriptions
            const panelsData = layoutCoords.map(coord => {
                const panelDesc = pageData.panels.find(p => p.id === coord.id);
                return {
                    ...coord,
                    description: panelDesc ? panelDesc.description : "A generic scene."
                };
            });

            // Artist (Generate Panels)
            const panelImages = await generatePagePanels(
                panelsData,
                DOM.cfAccount.value,
                DOM.cfToken.value,
                DOM.orKey.value,
                (msg) => log(msg)
            );

            // Typesetter (Assemble)
            log("Typesetter: Assembling page...");
            const canvas = await assemblePage(panelsData, panelImages);

            // Add to DOM
            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'page-wrapper';
            pageWrapper.style.marginBottom = '20px';

            const title = document.createElement('h3');
            title.textContent = `Page ${pageData.pageId}`;
            pageWrapper.appendChild(title);

            pageWrapper.appendChild(canvas);

            // Download Button for this page
            const btn = document.createElement('button');
            btn.textContent = "Download Page";
            btn.className = "secondary-btn";
            btn.style.marginTop = "10px";
            btn.onclick = () => {
                const link = document.createElement('a');
                link.download = `chapter_${currentChapter}_page_${pageData.pageId}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            };
            pageWrapper.appendChild(btn);

            DOM.pagesContainer.appendChild(pageWrapper);

            // Update Progress
            updateProgress(((i + 1) / pageCount) * 100);
        }

        // 3. Update Context
        log("\nUpdating Story Context...");
        contextManager.updateContext(currentChapter, blueprint.chapterSummary);
        DOM.downloadContextBtn.disabled = false;

        log("Chapter Complete! Don't forget to download the updated context.");
        alert("Generation Complete. Please download your updated context file.");

    } catch (err) {
        console.error(err);
        log(`CRITICAL ERROR: ${err.message}`);
    } finally {
        DOM.generateBtn.disabled = false;
    }
});
