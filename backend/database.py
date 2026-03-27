import sqlite3
from pathlib import Path
from typing import Optional


DB_PATH = Path(__file__).resolve().parent / "omniprice.db"


def _get_connection() -> sqlite3.Connection:
	conn = sqlite3.connect(DB_PATH)
	conn.row_factory = sqlite3.Row
	return conn


def init_db() -> None:
	with _get_connection() as conn:
		conn.execute(
			"""
			CREATE TABLE IF NOT EXISTS price_history (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				store TEXT NOT NULL,
				query TEXT NOT NULL,
				price REAL NOT NULL,
				captured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
			"""
		)
		conn.commit()


def save_price_point(store: str, query: str, price: float, captured_at: Optional[str] = None) -> None:
	with _get_connection() as conn:
		if captured_at is None:
			conn.execute(
				"""
				INSERT INTO price_history (store, query, price)
				VALUES (?, ?, ?)
				""",
				(store, query, price),
			)
		else:
			conn.execute(
				"""
				INSERT INTO price_history (store, query, price, captured_at)
				VALUES (?, ?, ?, ?)
				""",
				(store, query, price, captured_at),
			)
		conn.commit()


def get_price_history(store: str = "Amazon", query: str = "", limit: int = 30) -> list[dict]:
	sql = """
		SELECT store, query, price, captured_at
		FROM price_history
		WHERE 1 = 1
	"""
	params: list[object] = []

	if store.strip().lower() != "all":
		sql += " AND lower(store) = lower(?)"
		params.append(store)

	if query.strip():
		sql += " AND lower(query) = lower(?)"
		params.append(query.strip())

	sql += " ORDER BY datetime(captured_at) DESC LIMIT ?"
	params.append(max(1, min(limit, 5000)))

	with _get_connection() as conn:
		rows = conn.execute(sql, params).fetchall()

	# Return oldest->newest for chart plotting.
	items = [dict(row) for row in rows]
	items.reverse()
	return items


def get_latest_prices_for_query(query: str) -> list[dict]:
	sql = """
		SELECT p.store, p.price, p.captured_at
		FROM price_history p
		INNER JOIN (
			SELECT store, MAX(id) AS latest_id
			FROM price_history
			WHERE lower(query) = lower(?)
			GROUP BY store
		) latest ON latest.latest_id = p.id
		ORDER BY p.store
	"""

	with _get_connection() as conn:
		rows = conn.execute(sql, (query.strip(),)).fetchall()

	return [dict(row) for row in rows]


def get_query_point_count(query: str) -> int:
	with _get_connection() as conn:
		row = conn.execute(
			"""
			SELECT COUNT(*) AS count
			FROM price_history
			WHERE lower(query) = lower(?)
			""",
			(query.strip(),),
		).fetchone()

	return int(row["count"]) if row else 0
