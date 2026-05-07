import sqlite3

def patch_db():
    try:
        conn = sqlite3.connect('backend/database.db')
        c = conn.cursor()
        c.execute("UPDATE content_folders SET color = NULL WHERE color = '#ef4444' OR color = '#dc2626' OR color = '#f87171'")
        conn.commit()
        conn.close()
        print("Patched database folder colors.")
    except Exception as e:
        print(f"Error: {e}")

patch_db()
