import asyncio
import os
from dotenv import load_dotenv
import asyncpg
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

# --- Define the STRICT model (that might be crashing) ---
class StrictUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    full_name: str # Required!
    hashed_password: str
    is_super_admin: bool = False
    role: str = "admin"
    status: str = "active"
    created_at: datetime # Required!
    last_login: Optional[datetime] = None

# --- Define the RELAXED model (that I just pushed) ---
class RelaxedUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    full_name: Optional[str] = "Unknown"
    hashed_password: str
    is_super_admin: bool = False
    role: str = "admin"
    status: str = "active"
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

async def debug_users():
    if not DATABASE_URL:
        print("❌ DATABASE_URL missing")
        return

    url = DATABASE_URL
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
        
    print(f"🔄 Connecting to DB...")
    conn = await asyncpg.connect(url)
    try:
        rows = await conn.fetch("SELECT * FROM users")
        print(f"found {len(rows)} users.")
        
        for row in rows:
            user_data = dict(row)
            print(f"\nChecking user: {user_data.get('email')}")
            print(f"  created_at type: {type(user_data.get('created_at'))}")
            print(f"  full_name value: {user_data.get('full_name')}")
            
            # Test STRICT
            try:
                StrictUser(**user_data)
                print("  ✅ Strict Model: PASS")
            except Exception as e:
                print(f"  ❌ Strict Model: FAIL - {e}")
                
            # Test RELAXED
            try:
                RelaxedUser(**user_data)
                print("  ✅ Relaxed Model: PASS")
            except Exception as e:
                print(f"  ❌ Relaxed Model: FAIL - {e}")
                
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(debug_users())
