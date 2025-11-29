// Typesetter Agent
import { CanvasSpecs, calculateLayout } from './layoutEngine.js';

/**
 * Creates an HTML preview of the manga page with text bubbles.
 *
 * @param {Object} pageData - The page object from the blueprint (layout, panels).
 * @param {Object} panelImages - Map of panel_id -> Blob.
 * @returns {HTMLElement} - The DOM element representing the page.
 */
export async function createPageElement(pageData, panelImages) {
    const layoutCoords = calculateLayout(pageData.layout);

    // Container
    const pageDiv = document.createElement('div');
    pageDiv.className = 'manga-page';

    // Helper to find panel data by index or id
    // layoutEngine returns simple array 0..3
    // blueprint has panel_id "p1" etc.
    // We assume blueprint panels are in order matching layout slots.

    layoutCoords.forEach((coord, index) => {
        const panelInfo = pageData.panels[index]; // Assuming strict order
        if (!panelInfo) return;

        const blob = panelImages[panelInfo.panel_id];

        // Panel Container
        const panelDiv = document.createElement('div');
        panelDiv.className = 'panel-container';

        // Convert coords to % for responsiveness
        const leftPct = (coord.x / CanvasSpecs.width) * 100;
        const topPct = (coord.y / CanvasSpecs.height) * 100;
        const widthPct = (coord.width / CanvasSpecs.width) * 100;
        const heightPct = (coord.height / CanvasSpecs.height) * 100;

        panelDiv.style.left = `${leftPct}%`;
        panelDiv.style.top = `${topPct}%`;
        panelDiv.style.width = `${widthPct}%`;
        panelDiv.style.height = `${heightPct}%`;

        // Image
        if (blob) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            panelDiv.appendChild(img);
        } else {
            panelDiv.style.background = "#ccc";
            panelDiv.textContent = "Error";
        }

        // Bubbles
        if (panelInfo.dialogue_bubbles) {
            panelInfo.dialogue_bubbles.forEach(bubble => {
                const bubbleDiv = document.createElement('div');
                bubbleDiv.className = 'bubble';
                bubbleDiv.textContent = bubble.text;

                // Position logic
                // Simple mapping: top_left -> top: 10%, left: 10%
                switch (bubble.position) {
                    case 'top_left':
                        bubbleDiv.style.top = '5%'; bubbleDiv.style.left = '5%'; break;
                    case 'top_right':
                        bubbleDiv.style.top = '5%'; bubbleDiv.style.right = '5%'; break;
                    case 'bottom_left':
                        bubbleDiv.style.bottom = '5%'; bubbleDiv.style.left = '5%'; break;
                    case 'bottom_right':
                        bubbleDiv.style.bottom = '5%'; bubbleDiv.style.right = '5%'; break;
                    case 'center':
                        bubbleDiv.style.top = '50%'; bubbleDiv.style.left = '50%';
                        bubbleDiv.style.transform = 'translate(-50%, -50%)';
                        break;
                    default:
                        bubbleDiv.style.top = '10%'; bubbleDiv.style.left = '10%';
                }

                // Append bubble to the *Page* (so it can overlay borders) or *Panel*?
                // Usually bubbles can break borders.
                // But relative positioning is easier inside panel.
                // Let's put inside panel for now to stick to the image.
                panelDiv.appendChild(bubbleDiv);
            });
        }

        pageDiv.appendChild(panelDiv);
    });

    return pageDiv;
}
