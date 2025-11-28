// Layout Engine
const CANVAS_WIDTH = 1240;
const CANVAS_HEIGHT = 1754;

export const CanvasSpecs = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT
};

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
