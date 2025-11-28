import streamlit as st
import os
import sys

# Add src to path to import modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from manga_maker.src import architect, layout_engine, artist, typesetter, logger, editor

def main():
    st.set_page_config(page_title="Manga Maker V9", layout="wide")

    st.title("Manga Maker V9 - Web Interface")

    # Sidebar for Context
    st.sidebar.header("Story Context")

    # Initialize/Load Context
    try:
        context = logger.load_context()
        st.sidebar.json(context)
    except Exception as e:
        st.sidebar.error(f"Could not load context: {e}")
        context = {"current_page": 1}

    # Main Input
    st.header("Chapter Input")

    col1, col2 = st.columns(2)
    with col1:
        openrouter_key = st.text_input("OpenRouter API Key", type="password")
    with col2:
        hf_key = st.text_input("HuggingFace API Key", type="password")

    scene_text = st.text_area("Paste your scene/chapter text here:", height=200)

    if st.button("Generate Manga Page"):
        if not scene_text:
            st.error("Please enter some text.")
            return

        current_page_num = logger.get_current_page()
        st.info(f"Processing Page {current_page_num}...")

        progress_bar = st.progress(0)
        status_text = st.empty()

        try:
            # Step 1: Architect
            status_text.text("Consulting The Architect...")
            progress_bar.progress(20)
            blueprint = architect.get_blueprint(scene_text, api_key=openrouter_key)

            st.subheader("Architect's Blueprint")
            st.write(f"**Layout:** {blueprint.get('layout', 'unknown')}")
            st.write(f"**Reasoning:** {blueprint.get('reasoning', 'N/A')}")
            st.json(blueprint)

            # Step 2: Layout Engine
            status_text.text("Calculating Layout...")
            progress_bar.progress(40)
            layout_coords = layout_engine.calculate_layout(blueprint.get('layout', 'splash'))

            # Step 3: Artist
            status_text.text("Commissioning The Artist (Generating Images)...")
            progress_bar.progress(60)
            panels_data = blueprint.get('panels', [])
            panel_images = artist.generate_page_panels(panels_data, api_key=hf_key)

            # Show individual panels
            st.subheader("Generated Panels")
            cols = st.columns(len(panel_images))
            for idx, (p_id, img) in enumerate(panel_images.items()):
                with cols[idx % len(cols)]:
                    st.image(img, caption=f"Panel {p_id}", use_container_width=True)

            # Step 4: Typesetter
            status_text.text("Typesetting...")
            progress_bar.progress(80)
            filepath, canvas = typesetter.assemble_page(layout_coords, panel_images, current_page_num, return_image_obj=True)

            # Step 5: Logger
            status_text.text("Updating Context...")
            logger.update_context(current_page_num, scene_text)
            progress_bar.progress(100)

            st.success(f"Page {current_page_num} Generated Successfully!")
            st.image(canvas, caption=f"Final Page {current_page_num}", use_container_width=True)

            with open(filepath, "rb") as file:
                btn = st.download_button(
                        label="Download Page",
                        data=file,
                        file_name=os.path.basename(filepath),
                        mime="image/png"
                    )

            status_text.text("Done!")

            # Reload context in sidebar
            st.sidebar.success("Context Updated")
            st.sidebar.json(logger.load_context())

        except Exception as e:
            st.error(f"An error occurred: {e}")
            import traceback
            st.code(traceback.format_exc())

if __name__ == "__main__":
    main()
