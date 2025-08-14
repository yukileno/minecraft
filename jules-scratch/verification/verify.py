import asyncio
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("file:///app/index.html")
        # Wait for the scene to load and render
        page.wait_for_timeout(2000)
        # Click on the center of the screen to lock the pointer
        page.click('body', position={'x': 500, 'y': 300})
        page.wait_for_timeout(500) # wait for pointer lock ui to disappear
        page.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()

run()
