import asyncio
import os
import asyncpg
from dotenv import load_dotenv

async def migrate():
    load_dotenv()
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL not found in .env")
        return

    print("Connecting to database...")
    conn = await asyncpg.connect(url)
    try:
        print("Checking if 'brand' column exists in 'content' table...")
        columns = await conn.fetch("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'content' AND column_name = 'brand'
        """)
        
        if not columns:
            print("Adding 'brand' column to 'content' table...")
            await conn.execute("ALTER TABLE content ADD COLUMN brand TEXT")
            print("Column 'brand' added successfully.")
        else:
            print("Column 'brand' already exists.")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
