"""
One-time migration: Copy all media files from Supabase Storage → Cloudflare R2

Approach: Query the database for all file_url values, download from Supabase public URL,
upload to R2 with the same path structure.

Run: python migrate_to_r2.py

Requires: pip install boto3 httpx asyncpg python-dotenv
"""

import os
import asyncio
import boto3
import httpx
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv(Path(__file__).parent / ".env")

# Database
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

# Supabase content prefix (to extract file path)
SUPABASE_CONTENT_PREFIX = "https://isdzbwxjtfrykyoeevmy.supabase.co/storage/v1/object/public/content/"
SUPABASE_AUDIO_PREFIX = "https://isdzbwxjtfrykyoeevmy.supabase.co/storage/v1/object/public/audio/"

# R2 config
R2_ACCOUNT_ID = "1378a4d9395b9206eb7a53d12cb5872b"
R2_ACCESS_KEY_ID = "f26b3fa3b6c0f1c6a851cc08fbac5a51"
R2_SECRET_ACCESS_KEY = "44af4f66a2fddc9457cb1deb8cc0e89c61ca3d1787e6099149853bc784f1546f"
R2_BUCKET_NAME = "smr-media"
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_PUBLIC_URL = "https://pub-cd1de53230f443a194fe03b7d619b451.r2.dev"

# Initialize R2 (S3-compatible) client
s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
)

CONTENT_TYPES = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
    ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
    ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
}

def get_content_type(filename):
    ext = Path(filename).suffix.lower()
    return CONTENT_TYPES.get(ext, "application/octet-stream")

def extract_path_from_url(url):
    """Extract the storage path from a Supabase URL"""
    if url.startswith(SUPABASE_CONTENT_PREFIX):
        return url[len(SUPABASE_CONTENT_PREFIX):]
    if url.startswith(SUPABASE_AUDIO_PREFIX):
        return "audio/" + url[len(SUPABASE_AUDIO_PREFIX):]
    return None

async def get_all_media_urls():
    """Get all unique media URLs from the database"""
    import asyncpg
    
    url = DATABASE_URL
    if ("supabase.co" in url or "pooler.supabase.com" in url) and "sslmode=" not in url:
        url += "?sslmode=require" if "?" not in url else "&sslmode=require"
    
    conn = await asyncpg.connect(url)
    
    urls = set()
    
    # Content file_url
    rows = await conn.fetch("SELECT file_url FROM content WHERE file_url IS NOT NULL AND file_url != ''")
    for row in rows:
        urls.add(row["file_url"])
    
    # Content thumbnail_url
    rows = await conn.fetch("SELECT thumbnail_url FROM content WHERE thumbnail_url IS NOT NULL AND thumbnail_url != ''")
    for row in rows:
        urls.add(row["thumbnail_url"])
    
    # Product image_url
    rows = await conn.fetch("SELECT image_url FROM products WHERE image_url IS NOT NULL AND image_url != ''")
    for row in rows:
        urls.add(row["image_url"])
    
    # Brand logo_url
    rows = await conn.fetch("SELECT logo_url FROM brands WHERE logo_url IS NOT NULL AND logo_url != ''")
    for row in rows:
        urls.add(row["logo_url"])
    
    # Digital menu background
    rows = await conn.fetch("SELECT background_image_url FROM digital_menus WHERE background_image_url IS NOT NULL AND background_image_url != ''")
    for row in rows:
        urls.add(row["background_image_url"])
    
    # Audio tracks
    try:
        rows = await conn.fetch("SELECT file_url FROM audio_tracks WHERE file_url IS NOT NULL AND file_url != ''")
        for row in rows:
            urls.add(row["file_url"])
    except Exception:
        print("  ℹ  No audio_tracks table found, skipping")
    
    await conn.close()
    
    # Filter only Supabase URLs
    supabase_urls = [u for u in urls if u.startswith("https://isdzbwxjtfrykyoeevmy.supabase.co")]
    
    print(f"\n  📊 Found {len(supabase_urls)} Supabase media files in database")
    print(f"  📊 Skipped {len(urls) - len(supabase_urls)} non-Supabase URLs")
    
    return supabase_urls

def upload_to_r2(file_bytes, r2_key, content_type):
    """Upload bytes to R2"""
    s3.put_object(
        Bucket=R2_BUCKET_NAME,
        Key=r2_key,
        Body=file_bytes,
        ContentType=content_type,
    )

async def migrate_file(client, url, stats):
    """Download from Supabase and upload to R2"""
    r2_key = extract_path_from_url(url)
    if not r2_key:
        stats["skipped"] += 1
        return
    
    # Check if already exists in R2
    try:
        s3.head_object(Bucket=R2_BUCKET_NAME, Key=r2_key)
        print(f"  ⏭  Already in R2: {r2_key}")
        stats["existed"] += 1
        return
    except:
        pass
    
    # Download from Supabase public URL
    print(f"  ⬇  {r2_key} ...", end=" ", flush=True)
    try:
        resp = await client.get(url)
        if resp.status_code != 200:
            print(f"❌ HTTP {resp.status_code}")
            stats["failed"] += 1
            return
        
        file_bytes = resp.content
        content_type = get_content_type(r2_key)
        
        # Upload to R2
        upload_to_r2(file_bytes, r2_key, content_type)
        
        size_kb = len(file_bytes) / 1024
        if size_kb > 1024:
            print(f"✅ ({size_kb/1024:.1f} MB)")
        else:
            print(f"✅ ({size_kb:.0f} KB)")
        stats["migrated"] += 1
        
    except Exception as e:
        print(f"❌ {e}")
        stats["failed"] += 1

async def main():
    print("🚀 Supabase → R2 Migration (via Database)")
    print(f"   R2 bucket: {R2_BUCKET_NAME}")
    print(f"   R2 public: {R2_PUBLIC_URL}")
    
    # Get all media URLs from database
    urls = await get_all_media_urls()
    
    if not urls:
        print("\n  ⚠️  No Supabase media URLs found in database!")
        return
    
    stats = {"migrated": 0, "failed": 0, "existed": 0, "skipped": 0}
    
    # Download and upload each file
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        for i, url in enumerate(urls, 1):
            print(f"\n[{i}/{len(urls)}]", end="")
            await migrate_file(client, url, stats)
    
    print(f"\n{'='*60}")
    print(f"✅ Migration complete!")
    print(f"   Migrated:      {stats['migrated']}")
    print(f"   Already in R2:  {stats['existed']}")
    print(f"   Failed:         {stats['failed']}")
    print(f"   Skipped:        {stats['skipped']}")
    print(f"\n   Verify at: {R2_PUBLIC_URL}")
    print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(main())
