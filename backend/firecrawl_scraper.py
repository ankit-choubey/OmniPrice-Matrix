import os
import re
from urllib.parse import quote_plus
from pathlib import Path
from typing import Optional, Dict
try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(*args, **kwargs):
        return False
import httpx
import asyncio

load_dotenv(Path(__file__).resolve().parent / ".env")

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1"


async def extract_price_from_html(html: str) -> Optional[float]:
    """Extract price from HTML using regex patterns"""
    patterns = [
        r'₹\s*([\d,]+(?:\.\d{2})?)',
        r'rs\s*\.\s*([\d,]+(?:\.\d{2})?)',
        r'price["\s:]*[\d,]*\s*([\d,]+(?:\.\d{2})?)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            try:
                price_str = match.group(1).replace(",", "")
                return float(price_str)
            except ValueError:
                continue
    
    return None


def _extract_text_from_payload(payload: dict) -> str:
    data = payload.get("data", payload)
    markdown = data.get("markdown") or ""
    html = data.get("html") or ""
    return f"{markdown}\n{html}".lower()


def _is_payload_relevant(payload: dict, query: str, no_results_markers: list[str]) -> bool:
    text = _extract_text_from_payload(payload)

    if any(marker in text for marker in no_results_markers):
        return False

    tokens = [
        token
        for token in ("".join(ch.lower() if ch.isalnum() else " " for ch in query).split())
        if len(token) >= 3
    ]
    if not tokens:
        return True

    token_hits = [text.count(token) for token in tokens]
    matched_tokens = sum(1 for count in token_hits if count > 0)
    total_hits = sum(token_hits)

    return matched_tokens >= 1 and total_hits >= 2


def _extract_price_from_payload(payload: dict, query: str, no_results_markers: list[str]) -> Optional[float]:
    if not _is_payload_relevant(payload, query, no_results_markers):
        return None

    # Firecrawl responses can return either top-level fields or nested under data.
    data = payload.get("data", payload)
    for field in ("markdown", "html"):
        text = data.get(field)
        if text:
            patterns = [
                r"₹\s*([\d,]+(?:\.\d{2})?)",
                r"rs\s*\.?\s*([\d,]+(?:\.\d{2})?)",
                r"price[\"\s:]*[\d,]*\s*([\d,]+(?:\.\d{2})?)",
            ]
            for pattern in patterns:
                price = re.search(pattern, text, re.IGNORECASE)
                if not price:
                    continue
                try:
                    return float(price.group(1).replace(",", ""))
                except ValueError:
                    continue
    return None


async def scrape_amazon(query: str) -> Optional[float]:
    """Scrape price from Amazon India"""
    url = f"https://www.amazon.in/s?k={quote_plus(query)}"
    
    try:
        async with httpx.AsyncClient() as client:
            result = await client.post(
                f"{FIRECRAWL_BASE_URL}/scrape",
                headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
                json={
                    "url": url,
                    "formats": ["markdown", "html"],
                    "waitForSelector": "span[class*='price']",
                }
            )
            
            if result.status_code == 200:
                return _extract_price_from_payload(
                    result.json(),
                    query,
                    [
                        "no results for",
                        "did not match any products",
                        "try checking your spelling",
                    ],
                )
    except Exception as e:
        print(f"Amazon scrape error: {e}")
    
    return None


async def scrape_flipkart(query: str) -> Optional[float]:
    """Scrape price from Flipkart"""
    url = f"https://www.flipkart.com/search?q={quote_plus(query)}"
    
    try:
        async with httpx.AsyncClient() as client:
            result = await client.post(
                f"{FIRECRAWL_BASE_URL}/scrape",
                headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
                json={
                    "url": url,
                    "formats": ["markdown", "html"],
                }
            )
            
            if result.status_code == 200:
                return _extract_price_from_payload(
                    result.json(),
                    query,
                    [
                        "did not match any products",
                        "no results found",
                        "sorry, no results found",
                    ],
                )
    except Exception as e:
        print(f"Flipkart scrape error: {e}")
    
    return None


async def scrape_myntra(query: str) -> Optional[float]:
    """Scrape price from Myntra"""
    url = f"https://www.myntra.com/search/{quote_plus(query)}"
    
    try:
        async with httpx.AsyncClient() as client:
            result = await client.post(
                f"{FIRECRAWL_BASE_URL}/scrape",
                headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
                json={
                    "url": url,
                    "formats": ["markdown", "html"],
                }
            )
            
            if result.status_code == 200:
                return _extract_price_from_payload(
                    result.json(),
                    query,
                    [
                        "no results found",
                        "we couldn't find any matches",
                        "try removing a few filters",
                    ],
                )
    except Exception as e:
        print(f"Myntra scrape error: {e}")
    
    return None


async def scrape_croma(query: str) -> Optional[float]:
    """Scrape price from Croma"""
    url = f"https://www.croma.com/search/?q={quote_plus(query)}"
    
    try:
        async with httpx.AsyncClient() as client:
            result = await client.post(
                f"{FIRECRAWL_BASE_URL}/scrape",
                headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
                json={
                    "url": url,
                    "formats": ["markdown", "html"],
                }
            )
            
            if result.status_code == 200:
                return _extract_price_from_payload(
                    result.json(),
                    query,
                    [
                        "no matching products found",
                        "we couldn't find any products",
                        "sorry! no result found",
                    ],
                )
    except Exception as e:
        print(f"Croma scrape error: {e}")
    
    return None


async def get_all_store_prices(query: str) -> Dict[str, Optional[float]]:
    """Fetch prices from all stores in parallel"""
    results = await asyncio.gather(
        scrape_amazon(query),
        scrape_flipkart(query),
        scrape_myntra(query),
        scrape_croma(query),
    )
    
    return {
        "amazon": results[0],
        "flipkart": results[1],
        "myntra": results[2],
        "croma": results[3],
    }
