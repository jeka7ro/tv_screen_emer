import asyncio
import asyncpg
import os

DB_USER = "postgres"
DB_PASSWORD = "password"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "tv_screen_db"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

async def add_color_column():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Check if column exists
        column_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'playlists'
                AND column_name = 'color'
            );
        """)

        if not column_exists:
            print("Adding 'color' column to 'playlists' table...")
            await conn.execute("""
                ALTER TABLE playlists
                ADD COLUMN color VARCHAR(50) DEFAULT '#4F46E5';
            """)
            print("Column 'color' added successfully.")
        else:
            print("Column 'color' already exists.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(add_color_column())
