import textwrap
import os
from .logger import initialize_context

INPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "input", "chapter_input.txt")
CHUNK_SIZE = 1500

def load_story_text(filepath: str = INPUT_FILE) -> str:
    """Reads the raw story text from file."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Input file not found at {filepath}")

    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def paginate_story(text: str, chunk_size: int = CHUNK_SIZE) -> list[str]:
    """Chunks the story into scenes."""
    # textwrap.wrap returns a list of lines, we want to group them back into chunks
    # However, textwrap.wrap breaks strictly by width.
    # For a story, we might want to respect paragraphs if possible, but
    # strictly following the prompt: "chunks the story into digestible scenes of approximately 1500 characters using textwrap"

    # We can just use textwrap to ensure no chunk is larger than chunk_size,
    # but simplest is probably just simple string slicing or textwrap.wrap logic.
    # textwrap.wrap is usually for line wrapping (max width).
    # If the user meant "split into 1500 char blocks", textwrap can do that if we treat it as one long line.

    chunks = textwrap.wrap(text, width=chunk_size, break_long_words=False, replace_whitespace=False)
    return chunks

def setup_editor():
    """Initializes the context and checks input."""
    # Ensure input directory exists
    os.makedirs(os.path.dirname(INPUT_FILE), exist_ok=True)

    # Initialize context
    initialize_context()
