import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:5174"
ADMIN_EMAIL = "admin01@historyrag.local"
ADMIN_PASS  = "Password@123"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Running Comprehensive UI Tests...")

        # Test 1: Register — invalid email format rejected client-side
        try:
            await page.goto(f"{BASE}/register")
            await page.wait_for_load_state("networkidle")
            await page.fill('input[type="email"]', 'notanemail')
            await page.click('button[type="submit"]')
            # Browser native validation prevents submit — input stays invalid
            is_invalid = await page.eval_on_selector(
                'input[type="email"]', 'el => !el.validity.valid'
            )
            assert is_invalid, "Expected email input to be invalid"
            print("✅ Register validation test passed")
        except Exception as e:
            print("❌ Register validation test failed", e)

        # Test 2: Invalid login — FE error message appears
        # Actual message in Login.jsx: "Email hoặc mật khẩu không chính xác."
        try:
            await page.goto(f"{BASE}/login")
            await page.wait_for_load_state("networkidle")
            await page.fill('input[type="email"]', 'nobody@test.com')
            await page.fill('input[type="password"]', 'wrongpass')
            await page.click('button[type="submit"]')
            await page.wait_for_selector(
                "text=Email hoặc mật khẩu không chính xác", timeout=8000
            )
            print("✅ Invalid login test passed")
        except Exception as e:
            print("❌ Invalid login test failed", e)

        # Test 3: Valid admin login — redirects to /admin
        # Login.jsx uses window.location.href = "/admin" for ROLE_ADMIN
        try:
            await page.goto(f"{BASE}/login")
            await page.wait_for_load_state("networkidle")
            await page.fill('input[type="email"]', ADMIN_EMAIL)
            await page.fill('input[type="password"]', ADMIN_PASS)
            await page.click('button[type="submit"]')
            await page.wait_for_url("**/admin**", timeout=8000)
            print("✅ Valid Admin login test passed")
        except Exception as e:
            print("❌ Valid Admin login test failed", e)

        # Test 4: AI Chat — input is <input> not <textarea>, submit via send button
        try:
            await page.goto(f"{BASE}/ai")
            await page.wait_for_load_state("networkidle")
            chat_input = 'input[placeholder*="Hỏi về nhân vật"]'
            await page.wait_for_selector(chat_input, timeout=8000)
            await page.fill(chat_input, 'Trận Bạch Đằng?')
            # Submit via Enter key (onKeyDown handler) or send button with material icon
            await page.press(chat_input, 'Enter')
            print("✅ AI Chat interaction passed")
        except Exception as e:
            print("❌ AI Chat interaction failed", e)

        # Test 5: Admin Browse Locations — no <table>, uses card/grid layout
        try:
            await page.goto(f"{BASE}/admin/locations")
            await page.wait_for_load_state("networkidle")
            # Wait for location_on icon — present when list has rendered at least 1 item
            await page.wait_for_selector(
                "text=location_on", timeout=8000
            )
            print("✅ Admin Locations Browse passed")
        except Exception as e:
            print("❌ Admin Locations Browse failed", e)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
