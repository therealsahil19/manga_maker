import json
import os
import datetime
from typing import Dict, Any

CONTEXT_FILE = "context.json"

def initialize_context(title: str = "My Manga Story"):
    """Initializes context.json if it doesn't exist."""
    if not os.path.exists(CONTEXT_FILE):
        context_data = {
            "title": title,
            "current_page": 1,
            "story_logs": []
        }
        save_context(context_data)
        print(f"Initialized {CONTEXT_FILE} for '{title}'")
    else:
        print(f"Loaded existing {CONTEXT_FILE}")

def load_context() -> Dict[str, Any]:
    """Loads the current context."""
    if not os.path.exists(CONTEXT_FILE):
        initialize_context()

    with open(CONTEXT_FILE, 'r') as f:
        return json.load(f)

def save_context(context_data: Dict[str, Any]):
    """Saves the context data."""
    with open(CONTEXT_FILE, 'w') as f:
        json.dump(context_data, f, indent=4)

def update_context(page_number: int, scene_snippet: str):
    """Updates the context with the processed page info."""
    context = load_context()
    context["current_page"] = page_number + 1  # Increment for next

    # Log the scene
    log_entry = {
        "page": page_number,
        "scene_snippet": scene_snippet[:50] + "..." if len(scene_snippet) > 50 else scene_snippet,
        "timestamp": datetime.datetime.now().isoformat()
    }
    context["story_logs"].append(log_entry)

    save_context(context)
    print(f"Context updated: Page {page_number} complete.")

def get_current_page() -> int:
    """Returns the current page number."""
    context = load_context()
    return context.get("current_page", 1)
