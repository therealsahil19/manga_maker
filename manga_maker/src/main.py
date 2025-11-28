import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add src to path if needed (though running as module is better)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src import editor, architect, layout_engine, artist, typesetter, logger

def main():
    print("Starting Manga Maker V9...")

    # Step 1: Editor - Setup and Load
    editor.setup_editor()

    try:
        text = editor.load_story_text()
    except FileNotFoundError:
        print("Input file not found. Please ensure 'manga_maker/input/chapter_input.txt' exists.")
        return

    chunks = editor.paginate_story(text)
    print(f"Loaded story. Split into {len(chunks)} scenes.")

    start_page = logger.get_current_page()

    # Iterate through chunks
    for i, scene_text in enumerate(chunks):
        # Determine actual page number (start_page + index)
        # Note: logger.get_current_page returns the *next* available page number if we look at update_context logic,
        # but let's assume we want to continue from where we left off.
        # Actually, if we are running fresh, context might say page 1.

        current_page_num = start_page + i
        print(f"\n--- Processing Page {current_page_num} ---")

        # Step 2: Architect - Get Blueprint
        print("Consulting The Architect...")
        try:
            blueprint = architect.get_blueprint(scene_text)
        except Exception as e:
            print(f"Critical Error: Architect failed to generate blueprint. {e}")
            sys.exit(1)

        print(f"Layout selected: {blueprint.get('layout', 'unknown')}")

        # Step 3: Layout Engine - Calculate Coordinates
        layout_coords = layout_engine.calculate_layout(blueprint.get('layout', 'splash'))

        # Update blueprint panels with calculated coords just in case, or just map by ID
        # The blueprint has panel descriptions by ID. layout_coords has coords by ID.

        # Step 4: Artist - Generate Panels
        print("Commissioning The Artist...")
        panels_data = blueprint.get('panels', [])

        # Ensure we have descriptions for all layout slots
        # If layout has 4 slots but AI returned 3 panels, we need to handle that.
        # Ideally, Architect knows the layout counts (1, 3, 4).

        try:
            panel_images = artist.generate_page_panels(panels_data)
        except Exception as e:
            print(f"Critical Error: Artist failed to generate images. {e}")
            sys.exit(1)

        # Step 5: Typesetter - Assemble
        print("Typesetting...")
        typesetter.assemble_page(layout_coords, panel_images, current_page_num)

        # Step 6: Logger - Update Context
        logger.update_context(current_page_num, scene_text)

    print("\nChapter generation complete!")

if __name__ == "__main__":
    main()
