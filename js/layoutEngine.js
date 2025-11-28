// Layout Engine
const CANVAS_WIDTH = 1240;
const CANVAS_HEIGHT = 1754;

/**
 * Global canvas specifications for A4 manga pages.
 * @type {Object}
 * @property {number} width - The width of the canvas in pixels.
 * @property {number} height - The height of the canvas in pixels.
 */
export const CanvasSpecs = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT
};

/**
 * Calculates the panel coordinates and dimensions based on the requested layout type.
 *
 * @param {string} layoutType - The type of layout to generate. Options: "splash", "grid", "cinematic".
 * @returns {Array<{id: number, x: number, y: number, width: number, height: number}>}
 *          - An array of panel objects containing position (x, y) and dimensions (width, height).
 *          Returns a "splash" layout by default if the layout type is unknown.
 */
export function calculateLayout(layoutType) {
    const type = layoutType.toLowerCase();
    const panels = [];
    const margin = 50;
    const gap = 20;

    const availableWidth = CANVAS_WIDTH - (2 * margin);
    const availableHeight = CANVAS_HEIGHT - (2 * margin);

    if (type === "splash") {
        panels.push({
            id: 1,
            x: margin,
            y: margin,
            width: availableWidth,
            height: availableHeight
        });
    } else if (type === "grid") {
        const pWidth = Math.floor((availableWidth - gap) / 2);
        const pHeight = Math.floor((availableHeight - gap) / 2);

        // Panel 1 (Top Left)
        panels.push({ id: 1, x: margin, y: margin, width: pWidth, height: pHeight });
        // Panel 2 (Top Right)
        panels.push({ id: 2, x: margin + pWidth + gap, y: margin, width: pWidth, height: pHeight });
        // Panel 3 (Bottom Left)
        panels.push({ id: 3, x: margin, y: margin + pHeight + gap, width: pWidth, height: pHeight });
        // Panel 4 (Bottom Right)
        panels.push({ id: 4, x: margin + pWidth + gap, y: margin + pHeight + gap, width: pWidth, height: pHeight });
    } else if (type === "cinematic") {
        const pWidth = availableWidth;
        const pHeight = Math.floor((availableHeight - (2 * gap)) / 3);

        // Panel 1 (Top)
        panels.push({ id: 1, x: margin, y: margin, width: pWidth, height: pHeight });
        // Panel 2 (Middle)
        panels.push({ id: 2, x: margin, y: margin + pHeight + gap, width: pWidth, height: pHeight });
        // Panel 3 (Bottom)
        panels.push({ id: 3, x: margin, y: margin + 2 * (pHeight + gap), width: pWidth, height: pHeight });
    } else {
        // Fallback
        console.warn(`Unknown layout '${type}', defaulting to Splash.`);
        return calculateLayout("splash");
    }

    return panels;
}
