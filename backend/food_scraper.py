import os
from pathlib import Path
from typing import Optional, Dict
import httpx
import asyncio
try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(*args, **kwargs):
        return False
import re

load_dotenv(Path(__file__).resolve().parent / ".env")

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1"


async def extract_meal_price(html: str) -> Optional[float]:
    """Extract meal/food price from HTML"""
    patterns = [
        r'₹\s*([\d,]+(?:\.\d{2})?)',
        r'rs\s*\.\s*([\d,]+(?:\.\d{2})?)',
        r'price["\s:]*[\d,]*\s*([\d,]+(?:\.\d{2})?)',
        r'<.*?price.*?>([\d,]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            try:
                price_str = match.group(1).replace(",", "")
                price = float(price_str)
                # Sanity check: meal prices usually 100-1000
                if 50 < price < 2000:
                    return price
            except ValueError:
                continue
    
    return None


async def scrape_swiggy(meal_query: str) -> Optional[float]:
    """Scrape meal price from Swiggy"""
    url = f"https://www.swiggy.com/search?query={meal_query}"
    
    try:
        async with httpx.AsyncClient() as client:
            result = await client.post(
                f"{FIRECRAWL_BASE_URL}/scrape",
                headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
                json={
                    "url": url,
                    "formats": ["html"],
                    "waitForSelector": "[class*='price']",
                }
            )
            
            if result.status_code == 200:
                data = result.json()
                if "html" in data:
                    price = await extract_meal_price(data["html"])
                    return price
    except Exception as e:
        print(f"Swiggy scrape error: {e}")
    
    return None


async def scrape_zomato(meal_query: str) -> Optional[float]:
    """Scrape meal price from Zomato"""
    url = f"https://www.zomato.com/search?q={meal_query}"
    
    try:
        async with httpx.AsyncClient() as client:
            result = await client.post(
                f"{FIRECRAWL_BASE_URL}/scrape",
                headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
                json={
                    "url": url,
                    "formats": ["html"],
                }
            )
            
            if result.status_code == 200:
                data = result.json()
                if "html" in data:
                    price = await extract_meal_price(data["html"])
                    return price
    except Exception as e:
        print(f"Zomato scrape error: {e}")
    
    return None


async def scrape_instamart(item_query: str) -> Optional[float]:
    """Scrape grocery price from Instamart (Swiggy Minutes)"""
    url = f"https://instamart.swiggy.com/search?query={item_query}"
    
    try:
        async with httpx.AsyncClient() as client:
            result = await client.post(
                f"{FIRECRAWL_BASE_URL}/scrape",
                headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
                json={
                    "url": url,
                    "formats": ["html"],
                }
            )
            
            if result.status_code == 200:
                data = result.json()
                if "html" in data:
                    price = await extract_meal_price(data["html"])
                    return price
    except Exception as e:
        print(f"Instamart scrape error: {e}")
    
    return None


async def scrape_zepto(item_query: str) -> Optional[float]:
    """Scrape grocery price from Zepto"""
    url = f"https://www.zepto.com/search?query={item_query}"
    
    try:
        async with httpx.AsyncClient() as client:
            result = await client.post(
                f"{FIRECRAWL_BASE_URL}/scrape",
                headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
                json={
                    "url": url,
                    "formats": ["html"],
                }
            )
            
            if result.status_code == 200:
                data = result.json()
                if "html" in data:
                    price = await extract_meal_price(data["html"])
                    return price
    except Exception as e:
        print(f"Zepto scrape error: {e}")
    
    return None


async def get_meal_prices(meal_query: str) -> Dict[str, Optional[float]]:
    """Fetch meal prices from all food delivery platforms"""
    results = await asyncio.gather(
        scrape_swiggy(meal_query),
        scrape_zomato(meal_query),
        scrape_instamart(meal_query),
        scrape_zepto(meal_query),
    )
    
    return {
        "swiggy": results[0],
        "zomato": results[1],
        "instamart": results[2],
        "zepto": results[3],
    }


async def get_grocery_prices(item_query: str) -> Dict[str, Optional[float]]:
    """Fetch grocery prices from all platforms"""
    results = await asyncio.gather(
        scrape_instamart(item_query),
        scrape_zepto(item_query),
    )
    
    return {
        "instamart": results[0],
        "zepto": results[1],
    }


# Category detection
FOOD_KEYWORDS = {
    "meals": ["pizza", "burger", "biryani", "dosa", "meal", "combo", "restaurant"],
    "groceries": ["basmati", "rice", "milk", "eggs", "vegetable", "grocery", "flour"],
    "delivery": ["food", "order", "swiggy", "zomato", "instamart", "zepto"],
}


def detect_food_category(query: str) -> Optional[str]:
    """Detect if query is food-related"""
    query_lower = query.lower()
    
    for category, keywords in FOOD_KEYWORDS.items():
        if any(keyword in query_lower for keyword in keywords):
            if category == "meals":
                return "meals"
            elif category == "groceries":
                return "groceries"
    
    return None
