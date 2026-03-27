from urllib.parse import quote_plus

from playwright.async_api import async_playwright


USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


STORE_CONFIG = {
    "amazon": {
        "url": lambda q: f"https://www.amazon.in/s?k={quote_plus(q)}",
        "selectors": [".a-price-whole", ".a-offscreen"],
        "title_selectors": ["h2 span", "span.a-size-medium"],
        "no_results": [
            "no results for",
            "did not match any products",
            "try checking your spelling",
        ],
    },
    "flipkart": {
        "url": lambda q: f"https://www.flipkart.com/search?q={quote_plus(q)}",
        "selectors": ["div.Nx9bqj", "div._30jeq3", "div._30jeq3._1_WHN1"],
        "title_selectors": ["div.KzDlHZ", "a.wjcEIp", "div._4rR01T"],
        "no_results": [
            "did not match any products",
            "no results found",
            "sorry, no results found",
        ],
    },
    "croma": {
        "url": lambda q: f"https://www.croma.com/searchB?q={quote_plus(q)}",
        "selectors": ["span.amount", "span.new-price", "div.product-price span.amount"],
        "title_selectors": ["h3.product-title", "h2.product-title", "a.product-title"],
        "no_results": [
            "no matching products found",
            "we couldn't find any products",
            "sorry! no result found",
        ],
    },
    "myntra": {
        "url": lambda q: f"https://www.myntra.com/{quote_plus(q).replace('%20', '-')}",
        "selectors": [
            "span.product-discountedPrice",
            "span.product-price",
            "span.pdp-price strong",
        ],
        "title_selectors": [
            "h3.product-brand",
            "h4.product-product",
            "li.product-base h3.product-brand",
        ],
        "no_results": [
            "no results found",
            "we couldn't find any matches",
            "try removing a few filters",
        ],
    },
}


async def _extract_price_text(page, selectors: list[str]) -> str:
    for selector in selectors:
        locator = page.locator(selector).first
        if await locator.count() > 0:
            text = (await locator.inner_text()).strip()
            if text:
                return text
    return "N/A"


async def _extract_title_text(page, selectors: list[str]) -> str:
    for selector in selectors:
        locator = page.locator(selector).first
        if await locator.count() > 0:
            text = (await locator.inner_text()).strip()
            if text:
                return text
    return ""


def _clean_price_text(raw_price: str) -> str:
    cleaned = raw_price.replace("\u20b9", "").replace(",", "").strip()
    cleaned = cleaned.replace("Rs.", "").replace("INR", "").strip()
    return cleaned or "N/A"


async def _is_no_results_page(page, no_results_markers: list[str]) -> bool:
    content = (await page.content()).lower()
    return any(marker in content for marker in no_results_markers)


def _is_relevant_result(query: str, title: str) -> bool:
    normalized_title = "".join(ch.lower() if ch.isalnum() else " " for ch in title)
    query_tokens = [
        token
        for token in ("".join(ch.lower() if ch.isalnum() else " " for ch in query).split())
        if len(token) >= 3
    ]

    if not query_tokens:
        return True

    matches = sum(1 for token in query_tokens if token in normalized_title)
    if len(query_tokens) == 1:
        return matches >= 1
    return matches >= 2 or (matches >= 1 and len(query_tokens) <= 3)


async def get_amazon_price(product_url: str) -> str:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=USER_AGENT)
        page = await context.new_page()
        try:
            await page.goto(product_url, wait_until="domcontentloaded", timeout=60000)
            price = await _extract_price_text(page, STORE_CONFIG["amazon"]["selectors"])
            return _clean_price_text(price)
        except Exception:
            return "N/A"
        finally:
            await browser.close()


async def get_market_prices(query: str) -> dict[str, str]:
    prices: dict[str, str] = {
        "amazon": "N/A",
        "myntra": "N/A",
        "croma": "N/A",
        "flipkart": "N/A",
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=USER_AGENT)

        try:
            for store, config in STORE_CONFIG.items():
                page = await context.new_page()
                try:
                    await page.goto(config["url"](query), wait_until="domcontentloaded", timeout=45000)
                    if await _is_no_results_page(page, config.get("no_results", [])):
                        prices[store] = "N/A"
                        continue

                    top_title = await _extract_title_text(page, config.get("title_selectors", []))
                    if top_title and not _is_relevant_result(query, top_title):
                        prices[store] = "N/A"
                        continue

                    price = await _extract_price_text(page, config["selectors"])
                    prices[store] = _clean_price_text(price)
                except Exception:
                    prices[store] = "N/A"
                finally:
                    await page.close()
        finally:
            await browser.close()

    return prices