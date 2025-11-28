# Manga Maker V9 - Web Edition

A static web application for generating AI-powered manga pages.

## Features
- **Zero Backend**: Runs entirely in the browser using JavaScript and direct API calls.
- **Agents**:
  - **Architect**: Uses OpenRouter (Llama 3.3) to design page layouts.
  - **Artist**: Uses HuggingFace (Stable Diffusion XL) to generate panel images.
  - **Typesetter**: Assembles panels into a final A4 manga page.
- **Download**: Save your generated pages as PNG files.

## Usage
1. Open `index.html` in your browser.
2. Enter your **OpenRouter API Key** and **HuggingFace API Key**.
3. Enter a scene description.
4. Click **Generate Manga Page**.
5. Download the result.

## Development
No build step required. Uses vanilla ES Modules.
Just serve the directory:
```bash
python3 -m http.server
```
