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
        
        for table in ['playlists', 'happy_hour_schedules']:
            print(f"\nSchema for {table}:")
            cols = await conn.fetch(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
            for col in cols:
                print(f" - {col['column_name']}: {col['data_type']}")
            
            # Check a sample row
            row = await conn.fetchrow(f"SELECT * FROM {table} LIMIT 1")
            if row:
                print(f"\nSample row from {table}:")
                for k, v in row.items():
                    print(f"  {k}: {type(v)} = {v}")
            else:
                print(f"\nNo data in {table}")
                
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
