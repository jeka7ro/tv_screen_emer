import asyncio
import os
import json
from db import _fetch_all, _fetch_one

async def check():
    print("Checking playlists table...")
    try:
        # Check columns
        cols = await _fetch_all("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'playlists'")
        print("Columns in playlists:")
        for col in cols:
            print(f" - {col['column_name']}: {col['data_type']}")
        
        # Check data
        data = await _fetch_all("SELECT id, name, color FROM playlists LIMIT 5")
        print("\nSample Data:")
        for row in data:
            print(f" - ID: {row['id']}, Name: {row['name']}, Color: {row['color']}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
