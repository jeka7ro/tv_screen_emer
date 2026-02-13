import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def check():
    print(f"Connecting to DB...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("Connected.")
        
        # Check columns
        cols = await conn.fetch("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'happy_hour_schedules'")
        print("Columns in happy_hour_schedules:")
        for col in cols:
            print(f" - {col['column_name']}: {col['data_type']}")
            
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
