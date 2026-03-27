import os
from pathlib import Path
from typing import Optional
try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(*args, **kwargs):
        return False
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv(Path(__file__).resolve().parent / ".env")


def _build_service_account_from_env() -> Optional[dict]:
    private_key = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
    data = {
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": private_key,
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
        "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL"),
    }
    required = ["project_id", "private_key_id", "private_key", "client_email", "client_id"]
    if any(not data.get(key) for key in required):
        return None
    return data

# Initialize Firebase with service account
def init_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        # Prefer explicit service-account path if present, then fallback to env keys.
        path_from_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

        resolved_env_path = None
        if path_from_env:
            env_path_obj = Path(path_from_env)
            if not env_path_obj.is_absolute():
                env_path_obj = (Path(__file__).resolve().parent / env_path_obj).resolve()
            resolved_env_path = env_path_obj

        candidate_paths = [
            resolved_env_path,
            Path(__file__).resolve().parent.parent / "omniprice-36886-firebase-adminsdk-fbsvc-0668507cb2.json",
            Path(__file__).resolve().parent.parent / "omniprice-36886-firebase-adminsdk-fbsvc-e41140bb2d.json",
        ]

        cred = None
        for path in candidate_paths:
            if path and path.exists():
                cred = credentials.Certificate(str(path))
                break

        if cred is None:
            service_account = _build_service_account_from_env()
            if service_account is None:
                raise ValueError("Firebase credentials missing. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_* env vars.")
            cred = credentials.Certificate(service_account)

        firebase_admin.initialize_app(cred, {
            "projectId": os.getenv("FIREBASE_PROJECT_ID")
        })
    
    return firestore.client()


# Get Firestore instance
def get_db():
    """Get Firestore client"""
    if not firebase_admin._apps:
        init_firebase()
    return firestore.client()


# Collections
USERS_COLLECTION = "users"
WATCHLIST_COLLECTION = "watchlist"
PRICE_POINTS_COLLECTION = "pricePoints"
REMINDERS_COLLECTION = "reminders"
CATEGORY_TRENDS_COLLECTION = "categoryTrends"


def save_price_point(product_name: str, stores: dict, source: str = "firecrawl", confidence: float = 0.95):
    """Save price point to Firestore"""
    db = get_db()
    min_price = min([p for p in stores.values() if p > 0], default=0)
    
    doc = {
        "productName": product_name,
        "stores": stores,
        "timestamp": firestore.SERVER_TIMESTAMP,
        "minPrice": min_price,
        "source": source,
        "confidence": confidence,
    }
    
    db.collection(PRICE_POINTS_COLLECTION).add(doc)


def get_price_history(product_name: str, limit: int = 100):
    """Get price history for a product"""
    db = get_db()
    docs = db.collection(PRICE_POINTS_COLLECTION)\
        .where("productName", "==", product_name)\
        .order_by("timestamp", direction=firestore.Query.DESCENDING)\
        .limit(limit)\
        .stream()
    
    return [doc.to_dict() for doc in docs]


def create_or_update_reminder(user_id: str, query: str, target_price: float):
    """Create/update a price reminder"""
    db = get_db()
    
    reminder = {
        "userId": user_id,
        "query": query,
        "targetPrice": target_price,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "lastTriggered": None,
        "notificationCount": 0,
        "isActive": True,
    }
    
    doc_ref = db.collection(REMINDERS_COLLECTION).document(f"{user_id}_{query}")
    doc_ref.set(reminder, merge=True)
    
    return doc_ref.id


def check_reminder_hits(min_price: float, store: str):
    """Check and trigger reminders when price target is hit"""
    db = get_db()
    
    reminders = db.collection(REMINDERS_COLLECTION)\
        .where("isActive", "==", True)\
        .where("targetPrice", ">=", min_price)\
        .stream()
    
    hit_reminders = []
    for reminder in reminders:
        data = reminder.to_dict()
        # Record the hit
        db.collection(REMINDERS_COLLECTION).document(reminder.id).update({
            "lastTriggered": firestore.SERVER_TIMESTAMP,
            "notificationCount": data.get("notificationCount", 0) + 1,
        })
        hit_reminders.append(data)
    
    return hit_reminders


def get_category_trends(category: str):
    """Get seasonal patterns for a category"""
    db = get_db()
    doc = db.collection(CATEGORY_TRENDS_COLLECTION).document(category).get()
    
    if doc.exists:
        return doc.to_dict()
    
    return None


def update_category_trends(category: str, trends: dict):
    """Update seasonal trends for category"""
    db = get_db()
    trends["lastUpdated"] = firestore.SERVER_TIMESTAMP
    
    db.collection(CATEGORY_TRENDS_COLLECTION).document(category).set(trends, merge=True)


def add_watchlist_item(user_id: str, product_name: str, url: str, target_price: float):
    """Add product to user's watchlist"""
    db = get_db()
    
    watchlist_item = {
        "userId": user_id,
        "productName": product_name,
        "url": url,
        "targetPrice": target_price,
        "currentPrice": 0,
        "lastPrice": 0,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "status": "stable",  # stable, rising, dropping
        "priceHistory": [],
    }
    
    doc_ref = db.collection(WATCHLIST_COLLECTION).add(watchlist_item)
    return doc_ref[1].id


def get_user_watchlist(user_id: str):
    """Get user's watchlist"""
    db = get_db()
    docs = db.collection(WATCHLIST_COLLECTION)\
        .where("userId", "==", user_id)\
        .stream()
    
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def list_user_reminders(user_id: str):
    """Get user's reminders"""
    db = get_db()
    docs = db.collection(REMINDERS_COLLECTION)\
        .where("userId", "==", user_id)\
        .where("isActive", "==", True)\
        .stream()

    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def deactivate_reminder(reminder_id: str):
    """Soft-delete reminder by marking inactive"""
    db = get_db()
    db.collection(REMINDERS_COLLECTION).document(reminder_id).update({
        "isActive": False,
        "deactivatedAt": firestore.SERVER_TIMESTAMP,
    })


def update_watchlist_status(watchlist_id: str, current_price: float):
    """Update watchlist item with new price and status"""
    db = get_db()
    doc = db.collection(WATCHLIST_COLLECTION).document(watchlist_id).get()
    
    if doc.exists:
        data = doc.to_dict()
        last_price = data.get("currentPrice", current_price)
        
        # Determine status
        if current_price < last_price:
            status = "dropping"
        elif current_price > last_price:
            status = "rising"
        else:
            status = "stable"
        
        db.collection(WATCHLIST_COLLECTION).document(watchlist_id).update({
            "lastPrice": last_price,
            "currentPrice": current_price,
            "status": status,
        })


def remove_watchlist_item(watchlist_id: str):
    """Delete a watchlist document"""
    db = get_db()
    db.collection(WATCHLIST_COLLECTION).document(watchlist_id).delete()
