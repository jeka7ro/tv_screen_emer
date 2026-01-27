#!/usr/bin/env python3
"""Resetează parola unui utilizator. Folosește .env din backend."""
import asyncio
import os
import sys
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def main():
    if len(sys.argv) < 3:
        print("Utilizare: python reset_password.py <email> <parola_noua>")
        print("Exemplu: python reset_password.py jeka7ro@gmail.com ParolaNoua123!")
        sys.exit(1)

    email = sys.argv[1].strip()
    new_password = sys.argv[2]

    mongo_url = os.environ.get("MONGO_URL", "")
    if not mongo_url:
        print("Lipsește MONGO_URL în backend/.env")
        sys.exit(1)
    if "?" in mongo_url:
        mongo_url += "&serverSelectionTimeoutMS=5000"
    else:
        mongo_url += "?serverSelectionTimeoutMS=5000"

    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ["DB_NAME"]]
        await client.admin.command("ping")
    except Exception as e:
        print("Nu s-a putut conecta la MongoDB. Asigură-te că rulează (ex: mongod).")
        print(f"Eroare: {e}")
        sys.exit(1)

    hashed = get_password_hash(new_password)
    r = await db.users.update_one(
        {"email": email},
        {"$set": {"hashed_password": hashed}}
    )

    if r.matched_count == 0:
        print(f"Utilizator cu email '{email}' nu a fost găsit în baza de date.")
        sys.exit(1)

    print(f"Parola pentru {email} a fost resetată cu succes.")
    print("Te poți loga cu noua parolă.")


if __name__ == "__main__":
    asyncio.run(main())
