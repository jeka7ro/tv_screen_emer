import asyncio
from backend import db

async def check_cols():
    try:
        await db.init_db()
        # query columns
        query = "SELECT column_name FROM information_schema.columns WHERE table_name = 'content'"
        # Use _fetch_all instead of _fetch
        rows = await db._fetch_all(query)
        print("Columns in 'content' table:")
        for row in rows:
            print(f"- {row['column_name']}")
            
        print("\nChecking if 'content_folders' table exists:")
        query_tables = "SELECT table_name FROM information_schema.tables WHERE table_name = 'content_folders'"
        tables = await db._fetch_all(query_tables)
        if tables:
            print("✅ 'content_folders' table exists.")
        else:
            print("❌ 'content_folders' table MISSING.")

        print("\nChecking if 'happy_hour_schedules' table exists:")
        query_tables_hh = "SELECT table_name FROM information_schema.tables WHERE table_name = 'happy_hour_schedules'"
        tables_hh = await db._fetch_all(query_tables_hh)
        if tables_hh:
            print("✅ 'happy_hour_schedules' table exists.")
        else:
            print("❌ 'happy_hour_schedules' table MISSING.")

        print("\nColumns in 'users' table:")
        query_users = "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
        rows_users = await db._fetch_all(query_users)
        for row in rows_users:
            print(f"- {row['column_name']}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_cols())
