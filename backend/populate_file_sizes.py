import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import httpx

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def populate():
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found")
        return
    
    # Connect to DB
    url = DATABASE_URL.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
    conn = await asyncpg.connect(url)
    
    try:
        print("🔍 Fetching content list...")
        items = await conn.fetch("SELECT id, file_url FROM content WHERE file_size = 0 OR file_size IS NULL;")
        print(f"📦 Found {len(items)} items to check")
        
        async with httpx.AsyncClient() as client:
            for item in items:
                file_url = item['file_url']
                content_id = item['id']
                
                # Prepend backend URL if it's a relative local path
                # Note: On Render, the Backend URL is public, so HEAD should work if the server is up.
                # However, many files are on Supabase.
                full_url = file_url
                if file_url.startswith("/api/uploads"):
                    # We can't easily check local files from here if server is not fully up or routing is complex
                    # But most are Supabase anyway.
                    print(f"⏩ Skipping {content_id} (local path)")
                    continue

                try:
                    print(f"🔄 HEAD request for: {full_url}")
                    # Use follow_redirects=True for Supabase storage URLs
                    response = await client.head(full_url, follow_redirects=True, timeout=10.0)
                    
                    size = int(response.headers.get("Content-Length", 0))
                    
                    if size > 0:
                        await conn.execute("UPDATE content SET file_size = $1 WHERE id = $2", size, content_id)
                        print(f"✅ Updated {content_id}: {size} bytes")
                    else:
                        print(f"⚠️  Could not find size for {content_id} (status: {response.status_code})")
                        
                except Exception as e:
                    print(f"❌ Error processing {content_id}: {e}")
                
    except Exception as e:
        print(f"❌ Fatal error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(populate())
