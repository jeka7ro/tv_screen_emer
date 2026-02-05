"""
Supabase / PostgreSQL (asyncpg) – layer peste MongoDB.
"""
from __future__ import annotations

import os
from pathlib import Path
import json
from typing import Any, Dict, List, Optional

import asyncpg

# load env
from dotenv import load_dotenv
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
if not DATABASE_URL:
    raise RuntimeError("Set DATABASE_URL or SUPABASE_DB_URL in .env")

pool: Optional[asyncpg.Pool] = None


async def init_db() -> None:
    global pool
    url = DATABASE_URL.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
    if ("supabase.co" in url or "pooler.supabase.com" in url) and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
    import re
    
    # Manual parsing to bypass urllib/ipaddress issues in Python 3.13
    # Format: postgresql://user:password@host:port/database?params
    
    # 1. Remove scheme
    if "://" in url:
        url_body = url.split("://", 1)[1]
    else:
        url_body = url
        
    try:
        # 2. Split user:pass and host:port/db
        if "@" in url_body:
            user_pass_part, host_db_part = url_body.rsplit("@", 1)
        else:
            user_pass_part = ""
            host_db_part = url_body

        # 3. Parse user:pass
        if ":" in user_pass_part:
            username, password = user_pass_part.split(":", 1)
        else:
            username = user_pass_part
            password = None
            
        # URL decode credentials
        from urllib.parse import unquote
        if username: username = unquote(username)
        if password: password = unquote(password)

        # 4. Parse host:port/db?query
        if "/" in host_db_part:
            host_port, db_query = host_db_part.split("/", 1)
        else:
            host_port = host_db_part
            db_query = "postgres"

        # 5. Parse host:port
        if ":" in host_port:
            hostname, port_str = host_port.split(":", 1)
            port = int(port_str)
        else:
            hostname = host_port
            port = 5432

        # 6. Parse db?query
        if "?" in db_query:
            database, query_str = db_query.split("?", 1)
        else:
            database = db_query
            query_str = ""
            
        ssl_mode = "require"
        if "sslmode=disable" in query_str:
            ssl_mode = "disable"
            
        pool = await asyncpg.create_pool(
            user=username,
            password=password,
            host=hostname,
            port=port,
            database=database,
            ssl=ssl_mode if ssl_mode != "disable" else None,
            min_size=1, 
            max_size=10, 
            command_timeout=60, 
            timeout=15,
            statement_cache_size=0
        )
    except Exception as e:
        print(f"Manual parsing failed: {e}. Falling back to default.")
        # Fallback for simple URLs or if parsing fails
        pool = await asyncpg.create_pool(
            url, 
            min_size=1, 
            max_size=10, 
            command_timeout=60, 
            timeout=15,
            statement_cache_size=0
        )


async def close_db() -> None:
    global pool
    if pool:
        await pool.close()
        pool = None


def _row(r: Optional[asyncpg.Record]) -> Optional[Dict[str, Any]]:
    if r is None:
        return None
    d = dict(r)
    d = dict(r)
    for k, v in list(d.items()):
        if hasattr(v, "isoformat"):  # datetime
            d[k] = v.isoformat()
        if k in ["tags", "playlist_urls", "items", "selected_products", "selected_categories", "promo_products"] and isinstance(v, str):
            try:
                d[k] = json.loads(v)
            except:
                pass
    return d


def _rows(rows: List[asyncpg.Record]) -> List[Dict[str, Any]]:
    return [d for r in rows if (d := _row(r))]

async def _fetch_one(q: str, *a: Any) -> Optional[Dict[str, Any]]:
    assert pool
    async with pool.acquire() as c:
        r = await c.fetchrow(q, *a)
        return _row(r)


async def _fetch_all(q: str, *a: Any) -> List[Dict[str, Any]]:
    assert pool
    async with pool.acquire() as c:
        rows = await c.fetch(q, *a)
        return _rows(rows)


async def _execute(q: str, *a: Any) -> None:
    assert pool
    async with pool.acquire() as c:
        await c.execute(q, *a)


async def _execute_many(q: str, *a: Any) -> str:
    assert pool
    async with pool.acquire() as c:
        return await c.execute(q, *a)


# ---------- users ----------

async def user_get_by_email(email: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM users WHERE email = $1", email)


async def user_get_by_email_no_password(email: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one(
        "SELECT id, email, full_name, is_super_admin, created_at, last_login FROM users WHERE email = $1",
        email,
    )


async def user_insert(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO users (id, email, full_name, hashed_password, is_super_admin, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)""",
        row["id"], row["email"], row["full_name"], row["hashed_password"],
        row.get("is_super_admin", False), row["created_at"],
    )


async def users_count() -> int:
    r = await _fetch_one("SELECT count(*)::int AS c FROM users")
    return r["c"] if r else 0


async def users_list(exclude_password: bool = True) -> List[Dict[str, Any]]:
    cols = "id, email, full_name, is_super_admin, created_at, last_login" if exclude_password else "*"
    return await _fetch_all(f"SELECT {cols} FROM users ORDER BY created_at DESC LIMIT 500")


async def user_update_last_login(email: str) -> None:
    await _execute("UPDATE users SET last_login = NOW() WHERE email = $1", email)


# ---------- invitations ----------

async def invitation_get_by_code(code: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one(
        "SELECT * FROM invitations WHERE code = $1 AND is_active = TRUE", code
    )


async def invitation_insert(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO invitations (id, code, created_by, expires_at, max_uses, uses, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
        row["id"], row["code"], row["created_by"], row["expires_at"],
        row.get("max_uses", 1), row.get("uses", 0), row.get("is_active", True), row["created_at"],
    )


async def invitation_increment_uses(code: str) -> None:
    await _execute(
        "UPDATE invitations SET uses = uses + 1 WHERE code = $1", code
    )


async def invitations_list() -> List[Dict[str, Any]]:
    return await _fetch_all(
        "SELECT * FROM invitations ORDER BY created_at DESC LIMIT 100"
    )


async def invitation_deactivate(id: str) -> bool:
    res = await _execute_many("UPDATE invitations SET is_active = FALSE WHERE id = $1", id)
    return "UPDATE 1" in res


# ---------- locations ----------

async def location_get(id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM locations WHERE id = $1", id)


async def locations_list() -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM locations LIMIT 1000")


async def location_insert(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO locations (id, name, address, city, status, timezone, security_code, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
        row["id"], row["name"], row["address"], row["city"],
        row.get("status", "active"), row.get("timezone", "Europe/Bucharest"),
        row.get("security_code"), row["created_at"],
    )


async def location_update(id: str, data: Dict[str, Any]) -> None:
    await _execute(
        """UPDATE locations SET name = $1, address = $2, city = $3, status = $4, timezone = $5, security_code = $6
           WHERE id = $7""",
        data["name"], data["address"], data["city"], data.get("status", "active"),
        data.get("timezone", "Europe/Bucharest"), data.get("security_code"), id,
    )


async def location_delete(id: str) -> bool:
    res = await _execute_many("DELETE FROM locations WHERE id = $1", id)
    return "DELETE 1" in res


# ---------- screens ----------

async def screen_get(id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM screens WHERE id = $1", id)


async def screen_get_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM screens WHERE slug = $1", slug)




async def screens_list() -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM screens LIMIT 1000")


async def screens_by_sync_group(sync_group: str) -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM screens WHERE sync_group = $1 ORDER BY cascade_offset ASC", sync_group)


async def sync_groups_list() -> List[Dict[str, Any]]:
    return await _fetch_all("""
        SELECT sync_group as id, sync_type, MAX(sync_group_name) as name, array_agg(name) as screen_names, count(id) as screen_count
        FROM screens
        WHERE sync_group IS NOT NULL
        GROUP BY sync_group, sync_type
    """)


async def sync_group_delete(sync_group_id: str) -> None:
    await _execute(
        "UPDATE screens SET sync_group = NULL, cascade_offset = 0, sync_type = 'simple' WHERE sync_group = $1", 
        sync_group_id
    )


async def screen_exists_by_slug(slug: str) -> bool:
    r = await _fetch_one("SELECT 1 FROM screens WHERE slug = $1", slug)
    return r is not None


async def screen_insert(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO screens (id, location_id, name, slug, resolution, orientation, template_id,
           sync_group, cascade_offset, status, last_active, sync_type, parallax_enabled, steam_enabled, created_at, sync_group_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)""",
        row["id"], row["location_id"], row["name"], row["slug"],
        row.get("resolution", "1920x1080"), row.get("orientation", "landscape"),
        row.get("template_id"), row.get("sync_group"), row.get("cascade_offset", 0),
        row.get("status", "offline"), row.get("last_active"), row.get("sync_type", "simple"), 
        row.get("parallax_enabled", False), row.get("steam_enabled", False), row["created_at"], row.get("sync_group_name"),
    )


async def screen_update(id: str, data: Dict[str, Any]) -> None:
    await _execute(
        """UPDATE screens SET location_id = $1, name = $2, slug = $3, resolution = $4, orientation = $5,
           template_id = $6, sync_group = $7, cascade_offset = $8, status = $9, last_active = $10, 
           sync_type = $11, parallax_enabled = $12, steam_enabled = $13, sync_group_name = $14
           WHERE id = $15""",
        data["location_id"], data["name"], data["slug"],
        data.get("resolution", "1920x1080"), data.get("orientation", "landscape"),
        data.get("template_id"), data.get("sync_group"), data.get("cascade_offset", 0),
        data.get("status", "offline"), data.get("last_active"), data.get("sync_type", "simple"), 
        data.get("parallax_enabled", False), data.get("steam_enabled", False), data.get("sync_group_name"), id,
    )


async def screen_update_sync(id: str, sync_group: str, cascade_offset: int, template_id: Optional[str], sync_type: str = "simple", sync_group_name: Optional[str] = None) -> None:
    await _execute(
        "UPDATE screens SET sync_group = $1, cascade_offset = $2, template_id = $3, sync_type = $4, sync_group_name = $5 WHERE id = $6",
        sync_group, cascade_offset, template_id, sync_type, sync_group_name, id,
    )


async def screen_update_heartbeat(id: str, status: str, last_active: Any) -> None:
    await _execute("UPDATE screens SET status = $1, last_active = $2 WHERE id = $3", status, last_active, id)


async def screen_delete(id: str) -> bool:
    res = await _execute_many("DELETE FROM screens WHERE id = $1", id)
    return "DELETE 1" in res


# ---------- content ----------

async def content_get(id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM content WHERE id = $1", id)


async def content_list() -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM content LIMIT 1000")


async def content_insert(row: Dict[str, Any]) -> None:
    tags = json.dumps(row.get("tags") or [])
    playlist_urls = json.dumps(row.get("playlist_urls") or [])
    await _execute(
        """INSERT INTO content (id, title, type, file_url, duration, category, tags, thumbnail_url,
           autoplay, loop, playlist_urls, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)""",
        row["id"], row["title"], row["type"], row["file_url"], row.get("duration", 10),
        row.get("category", "other"), tags, row.get("thumbnail_url"),
        row.get("autoplay", True), row.get("loop", True), playlist_urls, row["created_at"],
    )


async def content_delete(id: str) -> bool:
    res = await _execute_many("DELETE FROM content WHERE id = $1", id)
    return "DELETE 1" in res


async def content_count() -> int:
    r = await _fetch_one("SELECT count(*)::int AS c FROM content")
    return r["c"] if r else 0


# ---------- playlists ----------

async def playlist_get(id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM playlists WHERE id = $1", id)


async def playlists_list() -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM playlists LIMIT 1000")


async def playlist_insert(row: Dict[str, Any]) -> None:
    items = json.dumps(row.get("items") or [])
    await _execute(
        """INSERT INTO playlists (id, name, description, items, autoplay, loop, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
        row["id"], row["name"], row.get("description"), items,
        row.get("autoplay", True), row.get("loop", True), row.get("status", "active"), row["created_at"],
    )


async def playlist_update(id: str, data: Dict[str, Any]) -> None:
    items = json.dumps(data.get("items") or [])
    await _execute(
        """UPDATE playlists SET name = $1, description = $2, items = $3, autoplay = $4, loop = $5, status = $6
           WHERE id = $7""",
        data["name"], data.get("description"), items,
        data.get("autoplay", True), data.get("loop", True), data.get("status", "active"), id,
    )


async def playlist_delete(id: str) -> bool:
    res = await _execute_many("DELETE FROM playlists WHERE id = $1", id)
    return "DELETE 1" in res


# ---------- products ----------

async def product_get(id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM products WHERE id = $1", id)


async def product_get_by_name(name: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM products WHERE name = $1", name)


async def products_list() -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM products ORDER BY order_index ASC, created_at ASC LIMIT 1000")


async def products_by_category(categories: List[str]) -> List[Dict[str, Any]]:
    if not categories:
        return []
    return await _fetch_all(
        "SELECT * FROM products WHERE category = ANY($1::text[]) LIMIT 1000", categories
    )


async def product_insert(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO products (id, name, description, price, currency, category, image_url,
           available, featured, order_index, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)""",
        row["id"], row["name"], row.get("description"), row["price"], row.get("currency", "RON"),
        row["category"], row.get("image_url"), row.get("available", True), row.get("featured", False),
        row.get("order_index", 0), row["created_at"],
    )


async def product_update(id: str, data: Dict[str, Any]) -> None:
    await _execute(
        """UPDATE products SET name = $1, description = $2, price = $3, currency = $4, category = $5,
           image_url = $6, available = $7, featured = $8, order_index = $9 WHERE id = $10""",
        data["name"], data.get("description"), data["price"], data.get("currency", "RON"),
        data["category"], data.get("image_url"), data.get("available", True), data.get("featured", False),
        data.get("order_index", 0), id,
    )


async def product_upsert_by_name(row: Dict[str, Any]) -> None:
    """Insert or update by name (import-batch)."""
    existing = await product_get_by_name(row["name"])
    if existing:
        await product_update(existing["id"], row)
    else:
        await product_insert(row)


async def product_delete(id: str) -> bool:
    res = await _execute_many("DELETE FROM products WHERE id = $1", id)
    return "DELETE 1" in res


async def products_count() -> int:
    r = await _fetch_one("SELECT count(*)::int AS c FROM products")
    return r["c"] if r else 0


# ---------- digital_menus ----------

async def digital_menu_get(id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM digital_menus WHERE id = $1", id)


async def digital_menus_list() -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM digital_menus LIMIT 1000")


async def digital_menu_insert(row: Dict[str, Any]) -> None:
    sp = json.dumps(row.get("selected_products") or [])
    sc = json.dumps(row.get("selected_categories") or [])
    pp = json.dumps(row.get("promo_products") or [])
    await _execute(
        """INSERT INTO digital_menus (id, name, template_id, selected_products, selected_categories,
           promo_products, show_promo_slides, promo_slide_duration, products_per_page, page_duration,
           auto_rotate, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)""",
        row["id"], row["name"], row.get("template_id"), sp, sc, pp,
        row.get("show_promo_slides", False), row.get("promo_slide_duration", 8),
        row.get("products_per_page", 6), row.get("page_duration", 10),
        row.get("auto_rotate", True), row.get("status", "active"), row["created_at"],
    )


async def digital_menu_update(id: str, data: Dict[str, Any]) -> None:
    sp = json.dumps(data.get("selected_products") or [])
    sc = json.dumps(data.get("selected_categories") or [])
    pp = json.dumps(data.get("promo_products") or [])
    await _execute(
        """UPDATE digital_menus SET name = $1, template_id = $2, selected_products = $3,
           selected_categories = $4, promo_products = $5, show_promo_slides = $6, promo_slide_duration = $7,
           products_per_page = $8, page_duration = $9, auto_rotate = $10, status = $11 WHERE id = $12""",
        data["name"], data.get("template_id"), sp, sc, pp,
        data.get("show_promo_slides", False), data.get("promo_slide_duration", 8),
        data.get("products_per_page", 6), data.get("page_duration", 10),
        data.get("auto_rotate", True), data.get("status", "active"), id,
    )


async def digital_menu_delete(id: str) -> bool:
    res = await _execute_many("DELETE FROM digital_menus WHERE id = $1", id)
    return "DELETE 1" in res


# ---------- screen_zones ----------

async def screen_zones_list(screen_id: str) -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM screen_zones WHERE screen_id = $1", screen_id)


async def screen_zones_delete_by_screen_and_zone(screen_id: str, zone_id: str) -> None:
    await _execute("DELETE FROM screen_zones WHERE screen_id = $1 AND zone_id = $2", screen_id, zone_id)


async def screen_zone_insert(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO screen_zones (id, screen_id, zone_id, content_type, digital_menu_id, playlist_id,
           content_id, weather_location, custom_html)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
        row["id"], row["screen_id"], row["zone_id"], row["content_type"],
        row.get("digital_menu_id"), row.get("playlist_id"), row.get("content_id"),
        row.get("weather_location"), row.get("custom_html"),
    )


async def screen_zone_delete(id: str) -> bool:
    res = await _execute_many("DELETE FROM screen_zones WHERE id = $1", id)
    return "DELETE 1" in res


async def screen_zones_delete_by_screen(screen_id: str) -> None:
    await _execute("DELETE FROM screen_zones WHERE screen_id = $1", screen_id)


# ---------- dashboard ----------

async def locations_count() -> int:
    r = await _fetch_one("SELECT count(*)::int AS c FROM locations")
    return r["c"] if r else 0


async def screens_count() -> int:
    r = await _fetch_one("SELECT count(*)::int AS c FROM screens")
    return r["c"] if r else 0


async def screens_count_online() -> int:
    r = await _fetch_one("SELECT count(*)::int AS c FROM screens WHERE status = 'online'")
    return r["c"] if r else 0
