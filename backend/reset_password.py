#!/usr/bin/env python3
"""Resetează parola unui utilizator (Supabase / Postgres). Folosește .env din backend."""
import asyncio
import os
import sys
from pathlib import Path

import asyncpg
import bcrypt
from dotenv import load_dotenv

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

    url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    if not url:
        print("Lipsește DATABASE_URL sau SUPABASE_DB_URL în backend/.env")
        sys.exit(1)
    if url.startswith("postgres://"):
        url = "postgresql://" + url[11:]
    if ("supabase.co" in url or "pooler.supabase.com" in url) and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"

    try:
        conn = await asyncpg.connect(url, command_timeout=10)
    except Exception as e:
        print("Nu s-a putut conecta la baza de date.")
        print(f"Eroare: {e}")
        sys.exit(1)

    hashed = get_password_hash(new_password)
    try:
        r = await conn.execute(
            "UPDATE users SET hashed_password = $1 WHERE email = $2",
            hashed,
            email,
        )
    finally:
        await conn.close()

    if "UPDATE 0" in r:
        print(f"Utilizator cu email '{email}' nu a fost găsit în baza de date.")
        sys.exit(1)

    print(f"Parola pentru {email} a fost resetată cu succes.")
    print("Te poți loga cu noua parolă.")


if __name__ == "__main__":
    asyncio.run(main())
