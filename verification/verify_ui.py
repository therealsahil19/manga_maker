"""
Manga Maker UI Verification Script.

This module provides a Playwright-based verification function to ensure the frontend
user interface is correctly rendered and configured. It specifically checks for the
removal of legacy Cloudflare inputs and the presence of Google AI Studio
configuration fields.
"""

from playwright.sync_api import sync_playwright, expect

def verify_frontend():
    """
    Verifies the frontend user interface elements using Playwright.

    This script launches a headless browser, navigates to the application,
    and asserts the presence or absence of specific UI components.
    It specifically checks that Cloudflare-related inputs are removed
    and that Google AI Studio inputs and labels are correctly displayed.

    Raises:
        AssertionError: If any of the UI expectations fail.
    """
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

        # Verify Google AI Studio input is present and has correct label
        # The ID in index.html is 'google-key' based on my grep check
        google_key_input = page.locator("#google-key")
        expect(google_key_input).to_be_visible()

        # Verify label text
        label = page.get_by_text("Google AI Studio API Key:")
        expect(label).to_be_visible()

        # Take screenshot
        page.screenshot(path="verification/ui_check.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
