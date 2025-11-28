// Typesetter Agent

import { CanvasSpecs } from './layoutEngine.js';

const BORDER_WIDTH = 5;

/**
 * Assembles a complete manga page by drawing generated panel images onto a canvas based on the layout coordinates.
 * Handles cropping (aspect ratio fit) and drawing borders for each panel.
 *
 * @param {Array<{id: number, x: number, y: number, width: number, height: number}>} layoutCoords
 *          - Array of objects defining the position and size of each panel.
 * @param {Object.<number, ImageBitmap|HTMLCanvasElement>} panelImages
 *          - A map of panel IDs to their corresponding image objects (ImageBitmap or Canvas).
 * @returns {Promise<HTMLCanvasElement>}
 *          - A promise that resolves to the assembled HTMLCanvasElement containing the full manga page.
 */
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
