import os
from huggingface_hub import InferenceClient
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv()

# Use SDXL if available, otherwise fallback.
# Note: Free tier might not support SDXL directly via simple API URL sometimes,
# but InferenceClient handles it better or we can switch model.
MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"

STYLE_SUFFIX = ", Seinen style, heavy cross-hatching, dramatic high contrast shadows, intricate details, manga aesthetic, black and white, masterpiece by Kentaro Miura, ink drawing"

def generate_panel_image(prompt: str, api_key: str = None) -> Image.Image:
    """Generates a single image from the HF API."""
    key_to_use = api_key if api_key else os.getenv("HF_API_KEY")
    client = InferenceClient(model=MODEL_ID, token=key_to_use)
    full_prompt = prompt + STYLE_SUFFIX

    print(f"Artist generating: {prompt[:30]}...")

    try:
        # text_to_image returns a PIL Image
        image = client.text_to_image(full_prompt)
        return image
    except Exception as e:
        print(f"Artist Error with {MODEL_ID}: {e}")
        # Fallback to older model if SDXL fails (e.g. not loaded or too large for free tier right now)
        try:
            print("Attempting fallback to CompVis/stable-diffusion-v1-4...")
            fallback_client = InferenceClient(model="CompVis/stable-diffusion-v1-4", token=key_to_use)
            image = fallback_client.text_to_image(full_prompt)
            return image
        except Exception as e2:
            print(f"Fallback Artist Error: {e2}")
            # Return a blank placeholder image on error
            return Image.new("RGB", (512, 512), color="white")

def generate_page_panels(panels_data: list, api_key: str = None) -> dict:
    """
    Generates images for all panels in parallel.
    Returns a dictionary mapping panel_id to PIL Image.
    """
    results = {}

    with ThreadPoolExecutor(max_workers=4) as executor:
        # Map futures to panel IDs
        future_to_id = {
            executor.submit(generate_panel_image, panel['description'], api_key): panel['id']
            for panel in panels_data
        }

        for future in future_to_id:
            p_id = future_to_id[future]
            try:
                image = future.result()
                results[p_id] = image
            except Exception as exc:
                print(f"Panel {p_id} generated an exception: {exc}")
                results[p_id] = Image.new("RGB", (512, 512), color="gray") # Fallback

    return results
