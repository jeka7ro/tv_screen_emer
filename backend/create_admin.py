#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.emergent_db
    
    # Check existing users
    users = await db.users.find().to_list(length=100)
    print(f"Found {len(users)} existing users:")
    for u in users:
        print(f"  - {u.get('email')} (role: {u.get('role')})")
    
    # Check if admin exists
    admin = await db.users.find_one({"email": "admin@test.com"})
    if admin:
        print("\n✅ Admin user already exists!")
        return
    
    # Create admin
    print("\n🔨 Creating admin user...")
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@test.com",
        "full_name": "Admin Test",
        "hashed_password": pwd_context.hash("admin123"),
        "role": "super_admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(admin_user)
    print("✅ Admin user created!")
    print("   Email: admin@test.com")
    print("   Password: admin123")

if __name__ == "__main__":
    asyncio.run(main())
