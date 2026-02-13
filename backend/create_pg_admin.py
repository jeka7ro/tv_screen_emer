#!/usr/bin/env python3
"""Create admin user in PostgreSQL database"""
import asyncio
import asyncpg
import bcrypt
import uuid
from datetime import datetime, timezone
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

async def create_admin():
    # Connect to PostgreSQL
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Check if admin exists
        existing = await conn.fetchrow("SELECT * FROM users WHERE email = 'admin@test.com'")
        if existing:
            print("✅ Admin user already exists: admin@test.com")
            print("   Password: admin123")
            return
        
        # Hash password
        hashed = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
        
        # Create admin
        await conn.execute("""
            INSERT INTO users (id, email, full_name, hashed_password, is_super_admin, role, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, str(uuid.uuid4()), "admin@test.com", "Admin Test", hashed, True, "admin", "active", datetime.now(timezone.utc))
        
        print("✅ Admin user created successfully!")
        print("   Email: admin@test.com")
        print("   Password: admin123")
        print("   Role: super_admin")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
