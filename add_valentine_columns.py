import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def add_valentine_columns():
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Add valentine hearts columns
        await conn.execute("""
            ALTER TABLE screens 
            ADD COLUMN IF NOT EXISTS valentine_hearts_enabled BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS valentine_hearts_intensity VARCHAR(10) DEFAULT 'medium';
        """)
        
        print("✅ Valentine hearts columns added successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(add_valentine_columns())
