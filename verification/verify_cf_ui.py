from playwright.sync_api import sync_playwright

def test_ui_updates(page):
    page.goto("http://localhost:8080")

    # Check for Cloudflare inputs
    page.wait_for_selector("#cf-account")
    page.wait_for_selector("#cf-token")

    # Check that HF inputs are gone
    assert page.query_selector("#hf-key") is None
    assert page.query_selector("#hf-model") is None

    page.screenshot(path="verification/ui_updated.png", full_page=True)
    print("UI verified: Cloudflare inputs present, HF inputs removed.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        test_ui_updates(page)
        browser.close()
