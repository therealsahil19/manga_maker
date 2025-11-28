# Manga Maker V9

Manga Maker V9 is an automated manga creation tool that uses AI to generate layouts and images based on story text. It utilizes `meta-llama/llama-3.3-70b-instruct` for layout planning (Architect) and `stabilityai/stable-diffusion-xl-base-1.0` for image generation (Artist).

## Prerequisites

*   Python 3.8+
*   An OpenAI/OpenRouter API Key (for LLM access)
*   A Hugging Face API Key (for Image Generation)

## Installation

1.  Clone the repository.
2.  Install the required dependencies:

    ```bash
    pip install -r manga_maker/requirements.txt
    ```

## Configuration

1.  Create a `.env` file in the root directory of the project.
2.  Add your API keys to the `.env` file:

    ```env
    OPENROUTER_API_KEY=your_openrouter_key_here
    HF_API_KEY=your_huggingface_key_here
    ```

## Usage

You can use Manga Maker V9 through a user-friendly Web Interface or via the Command Line Interface (CLI).

### Web Interface

The web interface allows you to interactively paste story text and generate pages one by one.

1.  Run the Streamlit app:

    ```bash
    streamlit run manga_maker/app.py
    ```

2.  Open the provided local URL in your browser (usually `http://localhost:8501`).
3.  Paste your scene or chapter text into the text area.
4.  Click **Generate Manga Page**.
5.  Once the process is complete, you can view the generated blueprint, individual panels, and the final assembled page.
6.  Click the **Download Page** button to save the final result.

### Command Line Interface (CLI)

The CLI allows for batch processing of a story file.

1.  Prepare your input file:
    *   Create or edit the file at `manga_maker/input/chapter_input.txt`.
    *   Paste your full story or chapter text into this file.

2.  Run the main script:

    ```bash
    python manga_maker/src/main.py
    ```

3.  The script will paginate the story and generate pages sequentially.
4.  Generated pages will be saved to the `manga_maker/output/` directory (e.g., `Page_01.png`, `Page_02.png`).

## Output

*   **Web Interface:** Downloaded directly via the browser.
*   **CLI:** Saved to `manga_maker/output/`.
