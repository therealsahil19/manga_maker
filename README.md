# Manga Maker V9 - Web Edition

A static web application for generating AI-powered manga pages directly in the browser. This tool leverages multiple AI agents to script, layout, draw, and assemble manga pages from a text description.

## Features

-   **Zero Backend**: Runs entirely in the browser using JavaScript and direct API calls. No server-side infrastructure is required.
-   **Multi-Agent Workflow**:
    -   **Architect**: Uses OpenRouter (TNG Chimera or Gemini Flash Lite) to analyze text and design page layouts (Splash, Grid, Cinematic).
    -   **Artist**: Uses OpenRouter (Flux Schnell or SDXL) or Pollinations.ai to generate high-quality panel images with a consistent Seinen style.
    -   **Editor**: Uses Llama 3.2 Vision to critique generated images and request retries if they don't match the description.
    -   **Typesetter**: Assembles the generated panels into a final high-resolution A4 manga page.
    -   **Context Manager**: Maintains story continuity across chapters using a rolling buffer of summaries.
-   **Downloadable Output**: Save generated pages as PNG files and export story context as JSON.

## Setup

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **API Keys**:
    You will need the following API key to use the full functionality:
    -   **OpenRouter API Key**: Required for the Architect (layout), Artist (drawing), and Editor (critique) agents.

## Usage

1.  **Run the Application**:
    Since this is a static web app using ES Modules, you need to serve it via a local web server.
    ```bash
    python3 -m http.server
    ```
    Open your browser and navigate to `http://localhost:8000`.

2.  **Configuration**:
    -   Enter your **OpenRouter API Key** in the designated field.

3.  **Generate a Chapter**:
    -   **Chapter Number**: Set the current chapter number.
    -   **Context File**: If continuing a story, upload the JSON context file from the previous chapter.
    -   **Scene Text**: Enter the text description of the scene or chapter you want to generate.
    -   Click **Generate Manga Page**.

4.  **Review and Download**:
    -   The application will display a log of the generation process.
    -   Generated pages will appear in the main view.
    -   Click **Download Page** to save each page as a PNG.
    -   **Important**: Click **Download Context** after the chapter is complete to save the story state for the next session.

## Project Structure

The codebase is organized into modular JavaScript files, each representing a specific role or utility in the generation pipeline.

### `js/`
-   **`app.js`**: The main controller. Handles DOM interaction, event listeners, and orchestrates the flow between agents.
-   **`architect.js`**: The Layout Strategist. Sends the chapter text to an LLM to generate a JSON "blueprint" of pages and panels.
-   **`artist.js`**: The Illustrator. Handles image generation requests to OpenRouter or Pollinations, including retry logic and interfacing with the Editor for critiques.
-   **`editor.js`**: The Art Director. Uses a Vision LLM to inspect generated images and verify they match the prompt.
-   **`layoutEngine.js`**: Calculates the pixel coordinates and dimensions for panels based on abstract layout types (Splash, Grid, Cinematic).
-   **`typesetter.js`**: Composites individual panel images into a single canvas with borders and formatting.
-   **`contextManager.js`**: Manages the persistent state of the story (current chapter, global summary, recent history) to ensure continuity.
-   **`utils.js`**: Shared utility functions for retries, delays, and text parsing.

### `verification/`
-   **`tests/`**: Contains unit tests (e.g., `test_utils.js`).
-   **`verify_ui.py`**: A Python script using Playwright to verify the frontend UI components.

## Development

This project uses vanilla JavaScript with ES Modules. No build tools (Webpack, Vite, etc.) are required for development.

-   **Documentation**: All public functions and classes are thoroughly documented with JSDoc (JavaScript) or Google Style Docstrings (Python).
-   **Testing**: Unit tests can be found in `verification/tests/`. To run the Python verification script, ensure you have Playwright installed and the app is running on localhost.

```bash
# Example for running the UI verification
python3 verification/verify_ui.py
```
