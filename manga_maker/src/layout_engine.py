from typing import Dict, List, Tuple

# Canvas Specs
CANVAS_WIDTH = 1240
CANVAS_HEIGHT = 1754
BORDER_WIDTH = 5

def calculate_layout(layout_type: str) -> List[Dict[str, int]]:
    """
    Translates layout type into panel coordinates.
    Returns a list of dictionaries, each containing x, y, width, height for a panel.
    """
    layout_type = layout_type.lower()
    panels = []

    # Define margins/padding
    margin = 50
    gap = 20

    available_width = CANVAS_WIDTH - (2 * margin)
    available_height = CANVAS_HEIGHT - (2 * margin)

    if layout_type == "splash":
        # One massive panel
        panels.append({
            "x": margin,
            "y": margin,
            "width": available_width,
            "height": available_height,
            "id": 1
        })

    elif layout_type == "grid":
        # 2x2 Grid
        # Width of one panel
        p_width = (available_width - gap) // 2
        p_height = (available_height - gap) // 2

        # Panel 1 (Top Left)
        panels.append({"x": margin, "y": margin, "width": p_width, "height": p_height, "id": 1})
        # Panel 2 (Top Right)
        panels.append({"x": margin + p_width + gap, "y": margin, "width": p_width, "height": p_height, "id": 2})
        # Panel 3 (Bottom Left)
        panels.append({"x": margin, "y": margin + p_height + gap, "width": p_width, "height": p_height, "id": 3})
        # Panel 4 (Bottom Right)
        panels.append({"x": margin + p_width + gap, "y": margin + p_height + gap, "width": p_width, "height": p_height, "id": 4})

    elif layout_type == "cinematic":
        # Three wide, stacked panels
        p_width = available_width
        p_height = (available_height - (2 * gap)) // 3

        # Panel 1 (Top)
        panels.append({"x": margin, "y": margin, "width": p_width, "height": p_height, "id": 1})
        # Panel 2 (Middle)
        panels.append({"x": margin, "y": margin + p_height + gap, "width": p_width, "height": p_height, "id": 2})
        # Panel 3 (Bottom)
        panels.append({"x": margin, "y": margin + 2 * (p_height + gap), "width": p_width, "height": p_height, "id": 3})

    else:
        # Default to Splash if unknown
        print(f"Unknown layout '{layout_type}', defaulting to Splash.")
        return calculate_layout("splash")

    return panels
