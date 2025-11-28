import os
from huggingface_hub import InferenceClient
from huggingface_hub.utils import HfHubHTTPError
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv()

# Default Model
DEFAULT_MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"

STYLE_SUFFIX = ", Seinen style, heavy cross-hatching, dramatic high contrast shadows, intricate details, manga aesthetic, black and white, masterpiece by Kentaro Miura, ink drawing"

def generate_panel_image(prompt: str, api_key: str = None, model_id: str = None) -> Image.Image:
    """Generates a single image from the HF API."""
    key_to_use = api_key if api_key else os.getenv("HF_API_KEY")
    model_to_use = model_id if model_id else DEFAULT_MODEL_ID

    client = InferenceClient(model=model_to_use, token=key_to_use)
    full_prompt = prompt + STYLE_SUFFIX

    print(f"Artist generating with {model_to_use}: {prompt[:30]}...")

    try:
        # text_to_image returns a PIL Image
        image = client.text_to_image(full_prompt)
        return image
    except StopIteration:
        print(f"Artist Error: Model '{model_to_use}' not found or not supported on Hugging Face Router.")
        return Image.new("RGB", (512, 512), color="white")
    except HfHubHTTPError as e:
        if e.response.status_code == 402:
             print(f"Artist Payment Error with {model_to_use}: Free limit reached or payment required.")
        else:
             print(f"Artist HTTP Error with {model_to_use}: {e}")
        return Image.new("RGB", (512, 512), color="white")
    except Exception as e:
        print(f"Artist Error with {model_to_use}: {repr(e)}")
        # print(traceback.format_exc()) # Uncomment for deep debugging
        return Image.new("RGB", (512, 512), color="white")

def generate_page_panels(panels_data: list, api_key: str = None, model_id: str = None) -> dict:
    """
    Generates images for all panels in parallel.
    Returns a dictionary mapping panel_id to PIL Image.
    """
    results = {}

    with ThreadPoolExecutor(max_workers=4) as executor:
        # Map futures to panel IDs
        future_to_id = {
            executor.submit(generate_panel_image, panel['description'], api_key, model_id): panel['id']
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
