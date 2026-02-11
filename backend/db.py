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
    except Exception as e:
        print(f"Manual parsing failed: {e}. High risk of connection failure.")
        # We need these variables even if parsing fails partially
        hostname = hostname if 'hostname' in locals() else "localhost"
        port = port if 'port' in locals() else 5432
        database = database if 'database' in locals() else "postgres"
        username = username if 'username' in locals() else None
        password = password if 'password' in locals() else None
        ssl_mode = "require"

    import logging
    import asyncio
    logger = logging.getLogger("uvicorn.error")
    
    # 7. Final preparation for connection
    logger.info(f"Connecting to database at {hostname}:{port}/{database} (SSL: {ssl_mode})")
    
    attempts = 3
    last_error = None
    for i in range(attempts):
        logger.info(f"Connection attempt {i+1}/{attempts}...")
        try:
            # Try connecting with parsed parameters
            pool = await asyncpg.create_pool(
                user=username,
                password=password,
                host=hostname,
                port=port,
                database=database,
                ssl=ssl_mode if ssl_mode != "disable" else None,
                min_size=1, 
                max_size=3, # Reduced for testing stability
                command_timeout=20,
                timeout=15,
                statement_cache_size=100  # Enable statement caching for performance
            )
            logger.info("Database connection established successfully via parameters.")
            break
        except Exception as e:
            last_error = e
            logger.error(f"Attempt {i+1} failed: {e}")
            
            # If it's a connection refused or timeout, wait a bit
            if i < attempts - 1:
                await asyncio.sleep(2)
            else:
                # Last resort: try the raw URL
                try:
                    logger.info("Attempting connection via raw DATABASE_URL string...")
                    pool = await asyncpg.create_pool(url, min_size=1, max_size=5, command_timeout=20)
                    logger.info("Database connection established successfully via URL string.")
                    break
                except Exception as final_e:
                    logger.error(f"Raw URL connection also failed: {final_e}")
                    raise last_error # Raise the original more descriptive error

    if not pool:
        raise RuntimeError("Failed to initialize database pool.")

    
    # Initialize tables if needed
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS password_resets (
            email TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS brands (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            logo_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    await pool.execute("""
        CREATE TABLE IF NOT EXISTS content (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            file_url TEXT NOT NULL,
            duration INT DEFAULT 10,
            category TEXT DEFAULT 'other',
            tags JSONB DEFAULT '[]',
            thumbnail_url TEXT,
            autoplay BOOLEAN DEFAULT TRUE,
            loop BOOLEAN DEFAULT TRUE,
            playlist_urls JSONB DEFAULT '[]',
            source_type TEXT DEFAULT 'file',
            file_size BIGINT DEFAULT 0,
            folder_id TEXT,
            brand JSONB DEFAULT '[]',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)


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
        if k in ["tags", "playlist_urls", "items", "selected_products", "selected_categories", "promo_products", "brand"] and isinstance(v, str):
            try:
                d[k] = json.loads(v)
            except:
                pass
    return d


def _rows(rows: List[asyncpg.Record]) -> List[Dict[str, Any]]:
    return [d for r in rows if (d := _row(r))]

async def _fetch_one(q: str, *a: Any) -> Optional[Dict[str, Any]]:
    assert pool
    r = await pool.fetchrow(q, *a)
    return _row(r)


async def _fetch_all(q: str, *a: Any) -> List[Dict[str, Any]]:
    assert pool
    rows = await pool.fetch(q, *a)
    return _rows(rows)


async def _execute(q: str, *a: Any) -> None:
    assert pool
    await pool.execute(q, *a)


async def _execute_many(q: str, *a: Any) -> str:
    assert pool
    return await pool.execute(q, *a)


# ---------- users ----------

async def user_get_by_email(email: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM users WHERE email = $1", email)


async def user_get_by_email_no_password(email: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one(
        "SELECT id, email, full_name, is_super_admin, role, location_id, status, created_at, last_login FROM users WHERE email = $1",
        email,
    )


async def user_get_email_by_id(user_id: str) -> Optional[str]:
    """Get user email by ID for notifications"""
    result = await _fetch_one("SELECT email FROM users WHERE id = $1", user_id)
    return result.get("email") if result else None


async def user_insert(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO users (id, email, full_name, hashed_password, is_super_admin, role, location_id, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
        row["id"], row["email"], row["full_name"], row["hashed_password"],
        row.get("is_super_admin", False), row.get("role", "admin"), row.get("location_id"), 
        row.get("status", "active"), row["created_at"],
    )


async def users_count() -> int:
    r = await _fetch_one("SELECT count(*)::int AS c FROM users")
    return r["c"] if r else 0


async def users_list(exclude_password: bool = True) -> List[Dict[str, Any]]:
    cols = "id, email, full_name, is_super_admin, role, location_id, status, created_at, last_login" if exclude_password else "*"
    return await _fetch_all(f"SELECT {cols} FROM users ORDER BY created_at DESC LIMIT 500")


async def user_get_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM users WHERE id = $1", user_id)


async def user_delete(user_id: str) -> bool:
    res = await _execute_many("DELETE FROM users WHERE id = $1", user_id)
    return "DELETE 1" in res


async def user_update_status(user_id: str, status: str) -> None:
    await _execute("UPDATE users SET status = $1 WHERE id = $2", status, user_id)


async def user_update_password_by_id(user_id: str, hashed_password: str) -> None:
    await _execute("UPDATE users SET hashed_password = $1 WHERE id = $2", hashed_password, user_id)


async def user_update_last_login(email: str) -> None:
    await _execute("UPDATE users SET last_login = NOW() WHERE email = $1", email)


async def user_update(user_id: str, data: Dict[str, Any]) -> None:
    if not data:
        return
    fields = []
    values = []
    for i, (k, v) in enumerate(data.items(), 1):
        fields.append(f"{k} = ${i}")
        values.append(v)
    values.append(user_id)
    query = f"UPDATE users SET {', '.join(fields)} WHERE id = ${len(values)}"
    await _execute(query, *values)


# ---------- invitations ----------

async def invitation_get_by_code(code: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one(
        "SELECT * FROM invitations WHERE code = $1 AND is_active = TRUE", code
    )


async def invitation_insert(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO invitations (id, code, created_by, expires_at, max_uses, uses, is_active, role, location_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)""",
        row["id"], row["code"], row["created_by"], row["expires_at"],
        row.get("max_uses", 1), row.get("uses", 0), row.get("is_active", True),
        row.get("role", "admin"), row.get("location_id"), row["created_at"],
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
    return await _fetch_all("""
        SELECT 
            s.*,
            l.city,
            l.name as location_name,
            c.title as current_content_title,
            c.type as current_content_type
        FROM screens s
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN screen_zones sz ON s.id = sz.screen_id AND sz.zone_id = 'zone1'
        LEFT JOIN content c ON sz.content_id = c.id
        ORDER BY l.city ASC, l.name ASC, s.name ASC
        LIMIT 1000
    """)


async def screens_by_sync_group(sync_group: str) -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM screens WHERE sync_group = $1 ORDER BY cascade_offset ASC", sync_group)


async def sync_groups_list() -> List[Dict[str, Any]]:
    return await _fetch_all("""
        WITH GroupData AS (
            SELECT 
                sync_group,
                sync_type,
                MAX(sync_group_name) as name,
                MAX(sync_fit_mode) as fit_mode,
                array_agg(name ORDER BY cascade_offset ASC) as names,
                array_agg(id ORDER BY cascade_offset ASC) as ids,
                count(id) as counts
            FROM screens
            WHERE sync_group IS NOT NULL
            GROUP BY sync_group, sync_type
        )
        SELECT 
            gd.sync_group as id,
            gd.sync_type,
            gd.name,
            gd.fit_mode,
            gd.names as screen_names,
            gd.ids as screen_ids,
            gd.counts as screen_count,
            (SELECT content_id FROM screen_zones WHERE screen_id = gd.ids[1] AND zone_id = 'main' LIMIT 1) as current_content_id
        FROM GroupData gd
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
           sync_group, cascade_offset, status, last_active, sync_type, created_at, sync_group_name, sync_fit_mode, brand, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)""",
        row["id"], row["location_id"], row["name"], row["slug"],
        row.get("resolution", "1920x1080"), row.get("orientation", "landscape"),
        row.get("template_id"), row.get("sync_group"), row.get("cascade_offset", 0),
        row.get("status", "offline"), row.get("last_active"), row.get("sync_type", "simple"), 
        row["created_at"], row.get("sync_group_name"), row.get("sync_fit_mode", "cover"),
        row.get("brand"), row.get("created_by")
    )


async def screen_update(id: str, data: Dict[str, Any]) -> None:
    await _execute(
        """UPDATE screens SET location_id = $1, name = $2, slug = $3, resolution = $4, orientation = $5,
           template_id = $6, sync_group = $7, cascade_offset = $8, status = $9, last_active = $10, 
           sync_type = $11, sync_group_name = $12, sync_fit_mode = $13, brand = $14 WHERE id = $15""",
        data["location_id"], data["name"], data["slug"],
        data.get("resolution", "1920x1080"), data.get("orientation", "landscape"),
        data.get("template_id"), data.get("sync_group"), data.get("cascade_offset", 0),
        data.get("status", "offline"), data.get("last_active"), data.get("sync_type", "simple"), 
        data.get("sync_group_name"), data.get("sync_fit_mode", "cover"), 
        data.get("brand"), id,
    )


async def screen_update_sync(id: str, group_id: Optional[str], offset: int, template_id: Optional[str], sync_type: str, group_name: Optional[str] = None, fit_mode: Optional[str] = 'cover') -> None:
    await _execute(
        "UPDATE screens SET sync_group = $2, cascade_offset = $3, template_id = $4, sync_type = $5, sync_group_name = $6, sync_fit_mode = $7 WHERE id = $1",
        id, group_id, offset, template_id, sync_type, group_name, fit_mode
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
           autoplay, loop, playlist_urls, created_at, source_type, file_size, folder_id, brand)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)""",
        row["id"], row["title"], row["type"], row["file_url"], row.get("duration", 10),
        row.get("category", "other"), tags, row.get("thumbnail_url"),
        row.get("autoplay", True), row.get("loop", True), playlist_urls, row["created_at"],
        row.get("source_type", "file"), row.get("file_size", 0), row.get("folder_id"),
        json.dumps(row.get("brand") or [])
    )


async def content_delete(id: str) -> bool:
    res = await _execute_many("DELETE FROM content WHERE id = $1", id)
    return "DELETE 1" in res


async def content_count() -> int:
    r = await _fetch_one("SELECT count(*)::int AS c FROM content")
    return r["c"] if r else 0


async def content_update_title(content_id: str, title: str) -> None:
    """Update content title (rename)"""
    await _execute("UPDATE content SET title = $1 WHERE id = $2", title, content_id)

async def content_update_brand(content_id: str, brand: List[str]) -> None:
    await _execute("UPDATE content SET brand = $1 WHERE id = $2", json.dumps(brand), content_id)


# ========== CONTENT FOLDERS ==========

async def folder_list() -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM content_folders ORDER BY created_at DESC")


async def folder_get_by_id(folder_id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM content_folders WHERE id = $1", folder_id)


async def folder_insert(row: Dict[str, Any]) -> str:
    res = await _fetch_one(
        """INSERT INTO content_folders (id, name, description, color, icon, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
        row["id"], row["name"], row.get("description"), row.get("color", "#6366f1"),
        row.get("icon", "folder"), row["created_at"], row.get("updated_at")
    )
    return res["id"]


async def folder_update(folder_id: str, data: Dict[str, Any]) -> None:
    # Build dynamic UPDATE query based on provided fields
    fields = []
    values = []
    param_idx = 1
    
    if "name" in data:
        fields.append(f"name = ${param_idx}")
        values.append(data["name"])
        param_idx += 1
    if "description" in data:
        fields.append(f"description = ${param_idx}")
        values.append(data["description"])
        param_idx += 1
    if "color" in data:
        fields.append(f"color = ${param_idx}")
        values.append(data["color"])
        param_idx += 1
    if "icon" in data:
        fields.append(f"icon = ${param_idx}")
        values.append(data["icon"])
        param_idx += 1
    
    # Always update updated_at
    fields.append(f"updated_at = NOW()")
    
    if not fields:
        return
    
    query = f"UPDATE content_folders SET {', '.join(fields)} WHERE id = ${param_idx}"
    values.append(folder_id)
    
    await _execute(query, *values)


async def folder_delete(folder_id: str) -> bool:
    # First, set folder_id to NULL for all content in this folder
    await _execute("UPDATE content SET folder_id = NULL WHERE folder_id = $1", folder_id)
    # Then delete the folder
    await _execute("DELETE FROM content_folders WHERE id = $1", folder_id)
    return True


async def content_update_folder(content_id: str, folder_id: Optional[str]) -> None:
    """Move content to a folder (or to root if folder_id is None)"""
    await _execute("UPDATE content SET folder_id = $1 WHERE id = $2", folder_id, content_id)


async def folder_get_content_count(folder_id: str) -> int:
    """Get count of content items in a folder"""
    return await _fetch_val("SELECT COUNT(*) FROM content WHERE folder_id = $1", folder_id)


# ---------- playlists ----------

async def playlist_get(id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM playlists WHERE id = $1", id)


async def playlists_list() -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM playlists LIMIT 1000")


async def playlist_insert(row: Dict[str, Any]) -> None:
    items = json.dumps(row.get("items") or [])
    await _execute(
        """INSERT INTO playlists (id, name, description, items, autoplay, loop, status, created_at, brand, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)""",
        row["id"], row["name"], row.get("description"), items,
        row.get("autoplay", True), row.get("loop", True), row.get("status", "active"), row["created_at"],
        row.get("brand"), row.get("created_by")
    )


async def playlist_update(id: str, data: Dict[str, Any]) -> None:
    items = json.dumps(data.get("items") or [])
    await _execute(
        """UPDATE playlists SET name = $1, description = $2, items = $3, autoplay = $4, loop = $5, status = $6, brand = $7
           WHERE id = $8""",
        data["name"], data.get("description"), items,
        data.get("autoplay", True), data.get("loop", True), data.get("status", "active"), 
        data.get("brand"), id,
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
           auto_rotate, background_image_url, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)""",
        row["id"], row["name"], row.get("template_id"), sp, sc, pp,
        row.get("show_promo_slides", False), row.get("promo_slide_duration", 8),
        row.get("products_per_page", 6), row.get("page_duration", 10),
        row.get("auto_rotate", True), row.get("background_image_url"), row.get("status", "active"), row["created_at"],
    )


async def digital_menu_update(id: str, data: Dict[str, Any]) -> None:
    sp = json.dumps(data.get("selected_products") or [])
    sc = json.dumps(data.get("selected_categories") or [])
    pp = json.dumps(data.get("promo_products") or [])
    await _execute(
        """UPDATE digital_menus SET name = $1, template_id = $2, selected_products = $3,
           selected_categories = $4, promo_products = $5, show_promo_slides = $6, promo_slide_duration = $7,
           products_per_page = $8, page_duration = $9, auto_rotate = $10, background_image_url = $11, 
           status = $12 WHERE id = $13""",
        data["name"], data.get("template_id"), sp, sc, pp,
        data.get("show_promo_slides", False), data.get("promo_slide_duration", 8),
        data.get("products_per_page", 6), data.get("page_duration", 10),
        data.get("auto_rotate", True), data.get("background_image_url"), data.get("status", "active"), id,
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

async def locations_count(location_id: Optional[str] = None) -> int:
    if location_id:
        return 1
    r = await _fetch_one("SELECT count(*)::int AS c FROM locations")
    return r["c"] if r else 0


async def screens_count(location_id: Optional[str] = None) -> int:
    if location_id:
        r = await _fetch_one("SELECT count(*)::int AS c FROM screens WHERE location_id = $1", location_id)
    else:
        r = await _fetch_one("SELECT count(*)::int AS c FROM screens")
    return r["c"] if r else 0



async def screens_count_online(location_id: Optional[str] = None) -> int:
    if location_id:
        r = await _fetch_one("SELECT count(*)::int AS c FROM screens WHERE status = 'online' AND location_id = $1", location_id)
    else:
        r = await _fetch_one("SELECT count(*)::int AS c FROM screens WHERE status = 'online'")
    return r["c"] if r else 0


# ---------- password resets ----------

async def password_reset_create(email: str, token: str, expires_at: Any) -> None:
    # Upsert: if email exists, update token and expiry
    await _execute(
        """INSERT INTO password_resets (email, token, expires_at, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (email) DO UPDATE 
           SET token = $2, expires_at = $3, created_at = NOW()""",
        email, token, expires_at
    )


async def password_reset_get(token: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM password_resets WHERE token = $1", token)


async def password_reset_delete(token: str) -> None:
    await _execute("DELETE FROM password_resets WHERE token = $1", token)


async def user_update_password(email: str, hashed_password: str) -> None:
    await _execute("UPDATE users SET hashed_password = $1 WHERE email = $2", hashed_password, email)


# ---------- audio streaming ----------

async def audio_playlist_create(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO audio_playlists (id, name, location_id, ad_frequency, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)""",
        row["id"], row["name"], row.get("location_id"), row.get("ad_frequency", 3), row.get("description"), row["created_at"]
    )


async def audio_playlists_list() -> List[Dict[str, Any]]:
    return await _fetch_all("""
        SELECT ap.*, l.name as location_name 
        FROM audio_playlists ap 
        LEFT JOIN locations l ON ap.location_id = l.id 
        ORDER BY ap.created_at DESC
    """)


async def audio_playlist_get(id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM audio_playlists WHERE id = $1", id)


async def audio_playlist_update(id: str, data: Dict[str, Any]) -> None:
    await _execute(
        """UPDATE audio_playlists SET name = $1, location_id = $2, ad_frequency = $3, description = $4
           WHERE id = $5""",
        data["name"], data.get("location_id"), data.get("ad_frequency", 3), data.get("description"), id
    )


async def audio_playlist_delete(id: str) -> bool:
    res = await _execute_many("DELETE FROM audio_playlists WHERE id = $1", id)
    return "DELETE 1" in res


async def audio_track_insert(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO audio_tracks (id, playlist_id, title, url, type, source_type, duration, position, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
        row["id"], row["playlist_id"], row["title"], row["url"], row.get("type", "music"),
        row.get("source_type", "file"), row.get("duration", 0), row.get("position", 0), row["created_at"]
    )


async def audio_tracks_by_playlist(playlist_id: str) -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM audio_tracks WHERE playlist_id = $1 ORDER BY position ASC, created_at ASC", playlist_id)


async def audio_track_delete(id: str) -> bool:
    res = await _execute_many("DELETE FROM audio_tracks WHERE id = $1", id)
    return "DELETE 1" in res


# ============================================================================
# HAPPY HOUR SCHEDULES
# ============================================================================

async def happy_hour_list():
    """Get all happy hour schedules"""
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM happy_hour_schedules
            ORDER BY created_at DESC
        """)
        return [dict(r) for r in rows]

async def happy_hour_get(schedule_id: str):
    """Get a single happy hour schedule by ID"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT * FROM happy_hour_schedules
            WHERE id = $1
        """, schedule_id)
        return dict(row) if row else None

async def happy_hour_insert(data: dict):
    """Create a new happy hour schedule"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO happy_hour_schedules (
                name, city, screen_ids, start_time, end_time,
                content_type, content_id, playlist_id, active, days_of_week, created_by, location_ids
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        """,
            data.get('name'),
            data.get('city'),
            data.get('screen_ids', []),
            data.get('start_time'),
            data.get('end_time'),
            data.get('content_type'),
            data.get('content_id'),
            data.get('playlist_id'),
            data.get('active', True),
            data.get('days_of_week', [1, 2, 3, 4, 5, 6, 7]),
            data.get('created_by'),
            data.get('location_ids', [])
        )
        return dict(row)

async def happy_hour_update(schedule_id: str, data: dict):
    """Update an existing happy hour schedule"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE happy_hour_schedules
            SET name = $2, city = $3, screen_ids = $4, start_time = $5,
                end_time = $6, content_type = $7, content_id = $8,
                playlist_id = $9, active = $10, days_of_week = $11,
                location_ids = $12, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        """,
            schedule_id,
            data.get('name'),
            data.get('city'),
            data.get('screen_ids', []),
            data.get('start_time'),
            data.get('end_time'),
            data.get('content_type'),
            data.get('content_id'),
            data.get('playlist_id'),
            data.get('active', True),
            data.get('days_of_week', [1, 2, 3, 4, 5, 6, 7]),
            data.get('location_ids', [])
        )
        return dict(row) if row else None

async def happy_hour_delete(schedule_id: str):
    """Delete a happy hour schedule"""
    async with pool.acquire() as conn:
        await conn.execute("""
            DELETE FROM happy_hour_schedules
            WHERE id = $1
        """, schedule_id)

async def happy_hours_active_now():
    """Get currently active happy hour schedules"""
    now = datetime.now()
    current_time = now.strftime("%H:%M:%S")
    current_day = now.isoweekday() # 1-7
    
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM happy_hour_schedules
            WHERE active = true 
              AND $1 = ANY(days_of_week)
              AND start_time <= $2
              AND end_time >= $3
        """, current_day, current_time, current_time)
        return _rows(rows)

# ---------- brands ----------

async def brand_insert(row: Dict[str, Any]) -> None:
    await _execute(
        """INSERT INTO brands (id, name, address, logo_url, created_at)
           VALUES ($1, $2, $3, $4, $5)""",
        row["id"], row["name"], row.get("address"), row.get("logo_url"), row["created_at"]
    )

async def brands_list() -> List[Dict[str, Any]]:
    return await _fetch_all("SELECT * FROM brands ORDER BY name ASC")

async def brand_get(brand_id: str) -> Optional[Dict[str, Any]]:
    return await _fetch_one("SELECT * FROM brands WHERE id = $1", brand_id)

async def brand_update(brand_id: str, row: Dict[str, Any]) -> None:
    await _execute(
        "UPDATE brands SET name=$1, address=$2, logo_url=$3 WHERE id=$4",
        row["name"], row.get("address"), row.get("logo_url"), brand_id
    )

async def brand_delete(brand_id: str) -> bool:
    count = await _fetch_one("SELECT count(*) as c FROM brands WHERE id = $1", brand_id)
    if count["c"] == 0:
        return False
    await _execute("DELETE FROM brands WHERE id = $1", brand_id)
    return True
    """Get currently active happy hour schedules based on time and day"""
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM happy_hour_schedules
            WHERE active = true
            AND CURRENT_TIME BETWEEN start_time AND end_time
            AND EXTRACT(ISODOW FROM CURRENT_DATE) = ANY(days_of_week)
        """)
        return [dict(r) for r in rows]
