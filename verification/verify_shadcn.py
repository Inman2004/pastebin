from playwright.sync_api import sync_playwright

def verify_pastebin():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Visit Home
        page.goto("http://localhost:3000")
        page.wait_for_selector("text=Pastebin Lite") # Check for Card Title
        page.screenshot(path="verification_shadcn/1_home.png")
        print("Home screenshot taken")

        # 2. Create Paste
        # Shadcn textarea usually has id="content" as I set it
        page.fill("textarea#content", "Hello from Shadcn Playwright")

        # Inputs: TTL and Max Views
        page.fill("input#ttl", "120")
        page.fill("input#maxViews", "5")

        page.click("button[type=submit]")

        # 3. Wait for result
        # I added an Alert with title "Success"
        page.wait_for_selector("text=Success")
        page.screenshot(path="verification_shadcn/2_created.png")
        print("Created screenshot taken")

        # 4. Visit the Paste
        url_input = page.query_selector("input[readonly]")
        paste_url = url_input.get_attribute("value")
        print(f"Paste URL: {paste_url}")

        page.goto(paste_url)
        # Check for Shadcn Card style on View page
        page.wait_for_selector("text=Paste")
        content = page.text_content("pre")
        if "Hello from Shadcn Playwright" in content:
            print("Content verified")
        else:
            print("Content mismatch")

        page.screenshot(path="verification_shadcn/3_view.png")
        print("View screenshot taken")

        browser.close()

if __name__ == "__main__":
    try:
        verify_pastebin()
    except Exception as e:
        print(f"Error: {e}")
