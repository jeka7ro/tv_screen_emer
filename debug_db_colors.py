import asyncio
import os
import asyncpg
import json

async def check():
    url = "postgresql://postgres.isdzbwxjtfrykyoeevmy:28Ianuarie!@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
    print(f"Connecting to {url.split('@')[1]}...")
    try:
        conn = await asyncpg.connect(url)
        print("Connected.")
        
        # Check rows
        rows = await conn.fetch("SELECT id, name, color FROM playlists LIMIT 10")
        print("\nPlaylists:")
        for r in rows:
            print(f" - {r['name']} (ID: {r['id'][:8]}...): color='{r['color']}'")
            
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
