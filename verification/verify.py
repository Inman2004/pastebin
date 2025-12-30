from playwright.sync_api import sync_playwright

def verify_pastebin():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Visit Home
        page.goto("http://localhost:3000")
        page.wait_for_selector("h1")
        page.screenshot(path="verification/1_home.png")
        print("Home screenshot taken")

        # 2. Create Paste
        page.fill("textarea", "Hello from Playwright verification")
        page.fill("input[placeholder='Optional']", "60") # TTL
        # Wait, there are two inputs with 'Optional' placeholder.
        # Use more specific selectors or labels.

        # Using labels is better but let's use the structure since I built it.
        # TTL is the first input[type=number]
        # Max Views is the second

        inputs = page.query_selector_all("input[type=number]")
        if len(inputs) >= 2:
            inputs[0].fill("120") # TTL
            inputs[1].fill("5")   # Max Views

        page.click("button[type=submit]")

        # 3. Wait for result
        page.wait_for_selector("text=Paste created successfully!")
        page.screenshot(path="verification/2_created.png")
        print("Created screenshot taken")

        # 4. Visit the Paste
        # Click "View Paste" link. It opens in new tab (target=_blank)
        # In Playwright, we need to catch the new page or just get the URL from the input and visit it.

        url_input = page.query_selector("input[readonly]")
        paste_url = url_input.get_attribute("value")
        print(f"Paste URL: {paste_url}")

        page.goto(paste_url)
        page.wait_for_selector("pre")
        content = page.text_content("pre")
        if "Hello from Playwright verification" in content:
            print("Content verified")
        else:
            print("Content mismatch")

        page.screenshot(path="verification/3_view.png")
        print("View screenshot taken")

        browser.close()

if __name__ == "__main__":
    try:
        verify_pastebin()
    except Exception as e:
        print(f"Error: {e}")
