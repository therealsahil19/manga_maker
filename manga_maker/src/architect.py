import os
import json
import requests
import ast
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "meta-llama/llama-3.3-70b-instruct:free"

SYSTEM_PROMPT = """You are 'The Architect', an expert manga layout strategist.
Your goal is to analyze a story segment and determine the best page layout and panel visual descriptions.

You must output a strictly valid JSON object. Do not include markdown formatting like ```json ... ```.

Analyze the provided text and choose ONE of the following layouts:
1. "splash": Use for major reveals, climactic moments, or establishing shots. (1 panel)
2. "grid": Use for fast-paced action, fight scenes, or conversations. (4 panels)
3. "cinematic": Use for tense dialogue, wide shots, or dramatic pacing. (3 panels)

Output structure:
{
  "layout": "splash" | "grid" | "cinematic",
  "reasoning": "Brief explanation of why this layout fits the tone.",
  "panels": [
    {
      "id": 1,
      "description": "Visual description of the panel. Focus on composition, subject, action, and lighting. Do not include text bubbles."
    },
    ...
  ]
}

Ensure the number of panels matches the layout:
- splash: 1 panel
- grid: 4 panels
- cinematic: 3 panels
"""

def janitor(response_text: str) -> dict:
    """Repairs malformed JSON from the LLM."""
    try:
        # First attempt: direct JSON load
        return json.loads(response_text)
    except json.JSONDecodeError:
        try:
            # Second attempt: literal eval (handles single quotes sometimes)
            return ast.literal_eval(response_text)
        except (ValueError, SyntaxError):
            # Third attempt: Try to find the JSON object within the text
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            if start != -1 and end != -1:
                json_str = response_text[start:end]
                try:
                    return json.loads(json_str)
                except:
                    pass

            print("Janitor failed to clean response.")
            return None

def get_blueprint(scene_text: str, api_key: str = None) -> dict:
    """Calls the LLM to get the page blueprint."""
    # Use passed key or fallback to env var
    key_to_use = api_key if api_key else os.getenv("OPENROUTER_API_KEY")

    headers = {
        "Authorization": f"Bearer {key_to_use}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", # Required by OpenRouter, dummy value ok
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this scene:\n\n{scene_text}"}
        ],
        "temperature": 0.7
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()

        content = result['choices'][0]['message']['content']
        blueprint = janitor(content)

        if not blueprint:
            # Fallback if AI fails completely
            print("Error: Could not parse Architect output. Using fallback Grid layout.")
            return {
                "layout": "grid",
                "reasoning": "Fallback due to AI error.",
                "panels": [
                    {"id": 1, "description": "A generic scene visualization."},
                    {"id": 2, "description": "A generic scene visualization."},
                    {"id": 3, "description": "A generic scene visualization."},
                    {"id": 4, "description": "A generic scene visualization."}
                ]
            }

        return blueprint

    except Exception as e:
        print(f"Architect API Error: {e}")
        # Return fallback
        return {
                "layout": "grid",
                "reasoning": "Fallback due to API error.",
                "panels": [
                    {"id": 1, "description": "Scene continue."},
                    {"id": 2, "description": "Scene continue."},
                    {"id": 3, "description": "Scene continue."},
                    {"id": 4, "description": "Scene continue."}
                ]
            }
