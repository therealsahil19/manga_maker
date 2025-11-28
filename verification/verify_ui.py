from playwright.sync_api import sync_playwright, expect

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the locally served app
        page.goto("http://localhost:8080")

        # Verify Cloudflare inputs are gone
        # These IDs should NOT be visible or exist
        cf_account_input = page.locator("#cf-account")
        cf_token_input = page.locator("#cf-token")

        expect(cf_account_input).not_to_be_visible()
        expect(cf_token_input).not_to_be_visible()

        # Verify OpenRouter input is present and has correct label
        or_key_input = page.locator("#openrouter-key")
        expect(or_key_input).to_be_visible()

        # Verify new label text
        label = page.get_by_text("OpenRouter API Key (All Agents):")
        expect(label).to_be_visible()

        # Verify new hint text
        hint = page.get_by_text("Images generated via Flux (schnell) or SDXL on OpenRouter. Fallback to Pollinations.ai.")
        expect(hint).to_be_visible()

        # Verify Architect model constant in code (indirectly, we can't easily check JS vars from UI without console logs,
        # but we can check the status log if we trigger something, but that requires a key.
        # For this visual test, we focus on the UI changes).

        # Take screenshot
        page.screenshot(path="verification/ui_check.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
