from PIL import Image, ImageOps
import os

CANVAS_WIDTH = 1240
CANVAS_HEIGHT = 1754
BORDER_WIDTH = 5

def assemble_page(layout_coords: list, panel_images: dict, page_number: int, return_image_obj: bool = False):
    """
    Assembles the final page image.
    layout_coords: List of dicts with x, y, width, height, id.
    panel_images: Dict mapping id to PIL Image.
    page_number: The page number for saving.
    return_image_obj: If True, returns (filepath, canvas_image). Otherwise returns filepath.

    Returns the path to the saved image (or tuple if requested).
    """
    # Create blank white canvas
    canvas = Image.new("RGB", (CANVAS_WIDTH, CANVAS_HEIGHT), "white")

    for panel_info in layout_coords:
        p_id = panel_info['id']
        if p_id not in panel_images:
            print(f"Warning: Image for panel {p_id} missing.")
            continue

        original_img = panel_images[p_id]

        # Target dimensions
        t_w = panel_info['width']
        t_h = panel_info['height']

        # Resize/Crop image to fit target dimensions while maintaining aspect ratio or filling
        # For simplicity, we'll use ImageOps.fit which centers and crops
        resized_img = ImageOps.fit(original_img, (t_w, t_h), method=Image.Resampling.LANCZOS)

        # Add border
        # We can draw the image then draw a rectangle border on top,
        # or expand the image with a border.
        # Let's paste the image then draw border.

        x = panel_info['x']
        y = panel_info['y']

        canvas.paste(resized_img, (x, y))

        # Draw border
        # Since PIL drawing is a bit manual, an easier way to get a border is
        # to paste the image into a slightly larger black rectangle?
        # No, the spec says "draw a 5px black border around each".
        # We can use ImageOps.expand if we were pasting on top, but we need exact coords.

        # Let's just create a black rectangle slightly larger?
        # Actually, simpler: paste the image, then if we want a border *around* it,
        # we effectively want the image to be inside a black box.
        # Or we can draw lines.

        # Let's try drawing lines on the canvas using ImageDraw
        from PIL import ImageDraw
        draw = ImageDraw.Draw(canvas)

        # Coordinates for the rectangle
        # x, y is top left.
        x1 = x
        y1 = y
        x2 = x + t_w
        y2 = y + t_h

        draw.rectangle([x1, y1, x2, y2], outline="black", width=BORDER_WIDTH)

    # Save
    output_dir = os.path.join("manga_maker", "output")
    os.makedirs(output_dir, exist_ok=True)
    filename = f"Page_{page_number:02d}.png"
    filepath = os.path.join(output_dir, filename)

    canvas.save(filepath)
    print(f"Saved: {filepath}")

    if return_image_obj:
        return filepath, canvas
    return filepath
