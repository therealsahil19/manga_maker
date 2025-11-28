// Main Controller

import { getBlueprint } from './architect.js';
import { calculateLayout } from './layoutEngine.js';
import { generatePagePanels } from './artist.js';
import { assemblePage } from './typesetter.js';

const DOM = {
    orKey: document.getElementById('openrouter-key'),
    hfKey: document.getElementById('hf-key'),
    hfModel: document.getElementById('hf-model'),
    sceneText: document.getElementById('scene-text'),
    generateBtn: document.getElementById('generate-btn'),
    downloadBtn: document.getElementById('download-btn'),
    statusLog: document.getElementById('status-log'),
    canvasContainer: document.getElementById('canvas-container')
};

function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    DOM.statusLog.textContent += `[${timestamp}] ${message}\n`;
    DOM.statusLog.scrollTop = DOM.statusLog.scrollHeight;
}

function validateInputs() {
    if (!DOM.orKey.value) return "Missing OpenRouter API Key";
    if (!DOM.hfKey.value) return "Missing HuggingFace API Key";
    if (!DOM.sceneText.value.trim()) return "Missing Scene Text";
    return null;
}

DOM.generateBtn.addEventListener('click', async () => {
    const error = validateInputs();
    if (error) {
        log(`Error: ${error}`);
        return;
    }

    DOM.generateBtn.disabled = true;
    DOM.downloadBtn.disabled = true;
    DOM.statusLog.textContent = ""; // Clear logs
    log("Starting Manga Generation Process...");

    try {
        // 1. Architect: Get Layout Blueprint
        log("Architect: Analyzing scene text...");
        const blueprint = await getBlueprint(DOM.sceneText.value, DOM.orKey.value);
        log(`Architect: Selected layout '${blueprint.layout}'`);

        // 2. Layout Engine: Calculate Coordinates
        log("Layout Engine: Calculating panel coordinates...");
        const layoutCoords = calculateLayout(blueprint.layout);

        // Merge descriptions with coordinates
        const panelsData = layoutCoords.map(coord => {
            const panelDesc = blueprint.panels.find(p => p.id === coord.id);
            return {
                ...coord,
                description: panelDesc ? panelDesc.description : "A generic scene."
            };
        });

        // 3. Artist: Generate Images
        log(`Artist: Generating ${panelsData.length} panels using ${DOM.hfModel.value}...`);
        const panelImages = await generatePagePanels(panelsData, DOM.hfKey.value, DOM.hfModel.value, (msg) => log(msg));
        log("Artist: All panels generated.");

        // 4. Typesetter: Assemble Page
        log("Typesetter: Assembling final page...");
        const canvas = await assemblePage(panelsData, panelImages);

        // Display
        DOM.canvasContainer.innerHTML = '';
        DOM.canvasContainer.appendChild(canvas);

        // Enable Download
        DOM.downloadBtn.disabled = false;
        DOM.downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = 'manga_page.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        log("Process Complete!");

    } catch (err) {
        console.error(err);
        log(`CRITICAL ERROR: ${err.message}`);
    } finally {
        DOM.generateBtn.disabled = false;
    }
});
