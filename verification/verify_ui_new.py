from playwright.sync_api import sync_playwright, expect

def verify_manga_maker_ui():
    """
    Verifies the core UI components of the Manga Maker V9 Web Edition.

    This function uses Playwright to launch a headless browser and inspect the
    DOM for key elements such as the title, configuration fields, story context
    inputs, and the generation button. It also checks for the presence of the
    import map script, which is crucial for ES module loading.

    Raises:
        AssertionError: If any UI element is missing or not visible.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:8080/")

        # 1. Verify Title
        expect(page).to_have_title("Manga Maker V9 - Web Edition")

        # 2. Verify Config Section
        expect(page.get_by_role("heading", name="Configuration")).to_be_visible()
        expect(page.get_by_label("Google AI Studio API Key:")).to_be_visible()

        # 3. Verify Story Context Section
        expect(page.get_by_role("heading", name="Story Context")).to_be_visible()
        expect(page.get_by_label("Current Chapter Number:")).to_be_visible()

        # 4. Verify Input Section
        expect(page.get_by_role("heading", name="Story Input")).to_be_visible()
        expect(page.get_by_label("Chapter Content:")).to_be_visible()
        expect(page.get_by_role("button", name="Generate Chapter (ZIP)")).to_be_visible()

        # 5. Verify Live Preview Section (Empty initially)
        expect(page.get_by_role("heading", name="Live Preview")).to_be_visible()

        # 6. Verify Import Map exists in DOM (indirectly via functionality or presence)
        # We can check if script type="importmap" exists
        importmap = page.locator('script[type="importmap"]')
        expect(importmap).to_have_count(1)

        # Take screenshot of the initial state
        page.screenshot(path="verification/ui_initial_state.png", full_page=True)
        print("UI Initial State verification passed.")

        browser.close()

if __name__ == "__main__":
    verify_manga_maker_ui()
