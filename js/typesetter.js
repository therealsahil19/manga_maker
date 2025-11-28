// Typesetter Agent

import { CanvasSpecs } from './layoutEngine.js';

const BORDER_WIDTH = 5;

export async function assemblePage(layoutCoords, panelImages) {
    const canvas = document.createElement('canvas');
    canvas.width = CanvasSpecs.width;
    canvas.height = CanvasSpecs.height;
    const ctx = canvas.getContext('2d');

    // Fill white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const panel of layoutCoords) {
        const img = panelImages[panel.id];
        if (!img) {
            console.warn(`Missing image for panel ${panel.id}`);
            continue;
        }

        // Calculate aspect ratio fit (cover)
        // Source dimensions
        const sw = img.width;
        const sh = img.height;
        // Target dimensions
        const tw = panel.width;
        const th = panel.height;

        const sRatio = sw / sh;
        const tRatio = tw / th;

        let sx, sy, sWidth, sHeight;

        if (sRatio > tRatio) {
            // Source is wider than target: Crop width
            sHeight = sh;
            sWidth = sh * tRatio;
            sx = (sw - sWidth) / 2;
            sy = 0;
        } else {
            // Source is taller than target: Crop height
            sWidth = sw;
            sHeight = sw / tRatio;
            sx = 0;
            sy = (sh - sHeight) / 2;
        }

        // Draw Image
        ctx.drawImage(img, sx, sy, sWidth, sHeight, panel.x, panel.y, tw, th);

        // Draw Border
        ctx.strokeStyle = "black";
        ctx.lineWidth = BORDER_WIDTH;
        ctx.strokeRect(panel.x, panel.y, tw, th);
    }

    return canvas;
}
