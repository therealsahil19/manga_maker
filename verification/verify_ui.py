from playwright.sync_api import sync_playwright

def test_manga_maker_ui(page):
    # Navigate to the local server
    page.goto("http://localhost:8080")

    # Verify key elements
    # 1. Title
    page.wait_for_selector("h1")
    assert "Manga Maker V9" in page.title()

    # 2. Configuration inputs
    page.wait_for_selector("#openrouter-key")
    page.wait_for_selector("#hf-key")

    # 3. New Chapter inputs
    page.wait_for_selector("#chapter-num")
    page.wait_for_selector("#context-file")

    # 4. Fill in some dummy data to see if the button enables/stays disabled correctly
    # (Button is enabled by default, but checks validation on click)

    # Take a screenshot
    page.screenshot(path="verification/manga_maker_ui.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        test_manga_maker_ui(page)
        browser.close()
