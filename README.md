# Manga Maker V9 - Web Edition

A static web application for generating AI-powered manga pages directly in the browser. This tool leverages multiple Google Gemini agents to script, layout, draw, and assemble manga pages from a text description.

## Features

-   **Zero Backend**: Runs entirely in the browser using JavaScript and direct API calls. No server-side infrastructure is required.
-   **Multi-Agent Workflow**:
    -   **Architect**: Uses Google Gemini Pro (e.g., `gemini-2.5-pro`) to analyze text and design page layouts (Splash, Grid, Cinematic).
    -   **Artist**: Uses Google Gemini Flash Image (e.g., `gemini-2.5-flash-image`) to generate high-quality panel images with a consistent Seinen style.
    -   **Editor**: Uses Google Gemini Flash (e.g., `gemini-2.5-flash`) to critique generated images and request retries if they don't match the description.
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
    You will need a **Google AI Studio API Key** to use the full functionality. This single key authenticates all agents (Architect, Artist, Editor).

## Usage

1.  **Run the Application**:
    Since this is a static web app using ES Modules, you need to serve it via a local web server.
    ```bash
    python3 -m http.server 8080
    ```
    Open your browser and navigate to `http://localhost:8080`.

2.  **Configuration**:
    -   Enter your **Google AI Studio API Key** in the designated field.

3.  **Generate a Chapter**:
    -   **Chapter Number**: Set the current chapter number.
    -   **Context File**: If continuing a story, upload the JSON context file from the previous chapter.
    -   **Scene Text**: Enter the text description of the scene or chapter you want to generate.
    -   Click **Generate Chapter (ZIP)**.

4.  **Review and Download**:
    -   The application will display a log of the generation process.
    -   Generated pages will appear in the main view as they are completed.
    -   Once finished, a ZIP file containing all pages and the updated context file will automatically download.

## Project Structure

The codebase is organized into modular JavaScript files, each representing a specific role or utility in the generation pipeline.

### `js/`
-   **`app.js`**: The main controller. Handles DOM interaction, event listeners, and orchestrates the flow between agents.
-   **`architect.js`**: The Layout Strategist. Sends the chapter text to an LLM to generate a JSON "blueprint" of pages and panels.
-   **`artist.js`**: The Illustrator. Handles image generation requests to Google Gemini, including retry logic and interfacing with the Editor for critiques.
-   **`production.js`**: The Production Engine. Loops through the blueprint, coordinating the Artist and Editor to generate and refine images, respecting rate limits.
-   **`editor.js`**: The Art Director. Uses a Vision LLM to inspect generated images and verify they match the prompt.
-   **`layoutEngine.js`**: Calculates the pixel coordinates and dimensions for panels based on abstract layout types (Splash, Grid, Cinematic).
-   **`typesetter.js`**: Composites individual panel images into a final HTML representation.
-   **`contextManager.js`**: Manages the persistent state of the story (current chapter, global summary, recent history) to ensure continuity.
-   **`utils.js`**: Shared utility functions for retries, delays, and text parsing.

### `verification/`
-   **`tests/`**: Contains unit tests (e.g., `test_utils.js`).
-   **`verify_ui.py`**: A Python script using Playwright to verify the frontend UI components.
-   **`verify_ui_new.py`**: An updated Python script using Playwright for more comprehensive UI verification.

## Development

This project uses vanilla JavaScript with ES Modules. No build tools (Webpack, Vite, etc.) are required for development.

-   **Documentation**: All public functions and classes are thoroughly documented with JSDoc (JavaScript) or Google Style Docstrings (Python).
-   **Testing**: Unit tests can be found in `verification/tests/`. To run the Python verification script, ensure you have Playwright installed and the app is running on localhost.

```bash
# Example for running the UI verification
python3 verification/verify_ui.py
```
