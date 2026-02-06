import asyncio
import sys
import bcrypt
import os

# Ensure backend directory is in python path
sys.path.append("backend")

# Import db module which handles connection and env loading
from db import init_db, _execute, close_db

async def reset_password(email, new_password):
    print(f"Reseting password for {email}...")
    try:
        await init_db()
        
        # Hash the password
        hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        
        # Update in DB
        # We use raw execute here since we didn't export user_update_password in db.py public interface, 
        # but _execute is available from our import above (if not hidden, checking import)
        # Actually db.py has _execute but it might not be exported in __all__ effectively if not defined.
        # But we imported it specifically.
        
        await _execute(
            "UPDATE users SET hashed_password = $1 WHERE email = $2",
            hashed_password, email
        )
        print(f"Password for {email} has been reset to: {new_password}")
        
    except Exception as e:
        print(f"Error resetting password: {e}")
    finally:
        await close_db()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 reset_password.py \"your_new_password\"")
        sys.exit(1)
    
    new_pass = sys.argv[1]
    asyncio.run(reset_password("jeka7ro@gmail.com", new_pass))
