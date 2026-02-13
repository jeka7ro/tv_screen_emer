#!/usr/bin/env python3
"""Create a test admin user for local development"""
import asyncio
import sys
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.emergent_db
    
    # Check if admin user already exists
    existing = await db.users.find_one({"email": "admin@test.com"})
    if existing:
        print("✅ Admin user already exists: admin@test.com")
        print("   Password: admin123")
        return
    
    # Create admin user
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
    print("✅ Created admin user successfully!")
    print("   Email: admin@test.com")
    print("   Password: admin123")
    print("   Role: super_admin")

if __name__ == "__main__":
    asyncio.run(create_admin_user())
