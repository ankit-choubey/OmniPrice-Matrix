import os
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv
from groq import Groq

load_dotenv(Path(__file__).resolve().parent / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
GROQ_CACHE_TTL_SECONDS = int(os.getenv("GROQ_CACHE_TTL_SECONDS", "600"))
GROQ_COOLDOWN_SECONDS = int(os.getenv("GROQ_COOLDOWN_SECONDS", "90"))
_groq_response_cache: Dict[str, Tuple[float, str]] = {}
_groq_cooldown_until = 0.0


def _call_groq(prompt: str, temperature: float, max_tokens: int) -> str:
    global _groq_cooldown_until

    if groq_client is None:
        raise RuntimeError("GROQ_API_KEY is missing")

    now = time.time()
    cache_key = f"{GROQ_MODEL}|{temperature}|{max_tokens}|{prompt.strip()}"
    cached = _groq_response_cache.get(cache_key)
    if cached and now - cached[0] <= GROQ_CACHE_TTL_SECONDS:
        return cached[1]

    if now < _groq_cooldown_until:
        raise RuntimeError("Groq cooldown active to avoid rate limiting")

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content or "{}"
        _groq_response_cache[cache_key] = (now, content)
        return content
    except Exception as exc:
        if "rate" in str(exc).lower() or "limit" in str(exc).lower() or "429" in str(exc):
            _groq_cooldown_until = time.time() + GROQ_COOLDOWN_SECONDS
        raise


def analyze_price_history(query: str, price_history: List[Dict]) -> Dict:
    """Use Groq to analyze price trends and forecast"""
    
    if not price_history:
        return {
            "trend": "insufficient_data",
            "confidence": 0,
            "recommendation": "Need more price data to make prediction",
            "days_to_wait": 0,
            "expected_drop_percent": 0,
        }
    
    # Format price history for analysis
    history_text = "\n".join([
        f"Date: {p.get('date', 'Unknown')}, Price: ₹{p.get('price', 0)}"
        for p in price_history[-30:]  # Last 30 days
    ])
    
    prompt = f"""
    Analyze this price history for "{query}":
    
    {history_text}
    
    Provide analysis in JSON format with:
    1. trend: "rising" | "falling" | "stable"
    2. confidence: 0-100 (confidence in next action)
    3. days_to_wait: recommended days to wait (0-30)
    4. expected_drop_percent: -50 to +50 (negative = drop, positive = rise)
    5. recommendation: "BUY_NOW" | "WAIT" | "UNCERTAIN"
    6. reason: 1 sentence explanation
    
    Response MUST be valid JSON only, no markdown.
    """
    
    try:
        response_text = _call_groq(prompt=prompt, temperature=0.3, max_tokens=300)
        
        # Clean response (remove markdown if present)
        if "```" in response_text:
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        response_json = json.loads(response_text)
        return response_json
        
    except Exception as e:
        print(f"Groq analysis error: {e}")
        return {
            "trend": "unknown",
            "confidence": 20,
            "recommendation": "Insufficient data - collect more price points",
            "days_to_wait": 0,
            "expected_drop_percent": 0,
            "reason": "Analysis failed",
        }


def get_wait_vs_buy_confidence(query: str, current_price: float, price_history: List[Dict]) -> Dict:
    """Determine confidence for wait vs buy decision"""
    
    if not price_history:
        return {
            "action": "UNCERTAIN",
            "confidence": 0,
            "reason": "Insufficient data"
        }
    
    # Get historical analysis
    analysis = analyze_price_history(query, price_history)
    
    # Determine action based on analysis
    if analysis.get("recommendation") == "BUY_NOW":
        confidence = min(100, analysis.get("confidence", 50) + 20)
        action = "BUY_NOW"
    elif analysis.get("recommendation") == "WAIT":
        confidence = min(100, analysis.get("confidence", 50) + 15)
        action = "WAIT"
    else:
        confidence = analysis.get("confidence", 30)
        action = "UNCERTAIN"
    
    return {
        "action": action,
        "confidence": confidence,
        "reason": analysis.get("reason", "Analysis inconclusive"),
        "expected_drop": analysis.get("expected_drop_percent", 0),
        "days_to_wait": analysis.get("days_to_wait", 0),
        "trend": analysis.get("trend", "unknown"),
    }


def get_product_recommendations(query: str, category: str = "electronics") -> List[Dict]:
    """Get alternative product recommendations using Groq"""
    
    prompt = f"""
    For the product "{query}" in {category} category, suggest 3 cheaper alternatives.
    
    Response format (JSON array):
    [
        {{
            "product": "Product name",
            "reason": "Why it's recommended",
            "estimated_savings": "₹X more affordable"
        }}
    ]
    
    Response MUST be valid JSON only.
    """
    
    try:
        response_text = _call_groq(prompt=prompt, temperature=0.4, max_tokens=400)
        
        # Clean response
        if "```" in response_text:
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        recommendations = json.loads(response_text)
        return recommendations
        
    except Exception as e:
        print(f"Recommendation error: {e}")
        return []


def analyze_seasonal_patterns(category: str, monthly_data: Dict) -> Dict:
    """Analyze seasonal patterns for a category"""
    
    prompt = f"""
    Analyze seasonal price patterns for {category}:
    
    Monthly average drops: {monthly_data}
    
    Provide JSON with:
    {{
        "best_months": ["month1", "month2"],
        "worst_months": ["month1", "month2"],
        "avg_drop_percent": X,
        "pattern_description": "description"
    }}
    
    Response MUST be valid JSON only.
    """
    
    try:
        response_text = _call_groq(prompt=prompt, temperature=0.2, max_tokens=300)
        
        if "```" in response_text:
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        pattern = json.loads(response_text)
        return pattern
        
    except Exception as e:
        print(f"Pattern analysis error: {e}")
        return {}
