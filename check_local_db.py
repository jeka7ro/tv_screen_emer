import asyncio
import asyncpg

async def check_local_db():
    # Common local default credentials
    uris = [
        "postgresql://postgres:postgres@localhost:5432/postgres",
        "postgresql://postgres:password@localhost:5432/postgres",
        "postgresql://postgres:postgres@localhost:5432/tv_screen",
        "postgresql://postgres:@localhost:5432/postgres"
    ]
    
    for url in uris:
        print(f"Trying connection to: {url}")
        try:
            conn = await asyncpg.connect(url, timeout=2)
            print("  ✅ Connected!")
            
            # Check for users table
            try:
                row = await conn.fetchrow("SELECT hashed_password FROM users WHERE email = 'jeka7ro@gmail.com'")
                if row:
                    print(f"  🎉 FOUND USER IN LOCAL DB! Hash: {row['hashed_password']}")
                else:
                    print("  ❌ User not found in this DB.")
            except Exception as e:
                print(f"  ❌ Error querying users: {e}")
                
            await conn.close()
            return # Stop if we found a DB, even if user isn't there (to avoid confusion)
        except Exception as e:
            print(f"  Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(check_local_db())
