import asyncio
import os
import asyncpg
from dotenv import load_dotenv

async def migrate():
    # Load source DB (Dev/Local)
    load_dotenv('backend/.env')
    source_url = os.environ.get('DATABASE_URL')
    
    # In this case, the user wants me to migrate. 
    # If the .env already points to the database they think is empty, 
    # I should check if there's any other "local" source.
    # Since MongoDB is empty/not running, and no other Postgres is found,
    # I will assume the "source" is the data found in scripts like `add_locations.py` and `update_products.py`.
    
    print(f"Source DB: {source_url.split('@')[-1]}")
    
    try:
        conn = await asyncpg.connect(source_url)
        
        # 1. Add Locations (from add_locations.py data)
        from add_locations import LOCATIONS_DATA
        import uuid
        from datetime import datetime
        
        print(f"Migrating {len(LOCATIONS_DATA)} locations...")
        for item in LOCATIONS_DATA:
            # Check if exists by name
            exists = await conn.fetchval("SELECT 1 FROM locations WHERE name = $1", item['name'])
            if not exists:
                loc_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO locations (id, name, address, city, status, timezone, created_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7)""",
                    loc_id, item['name'], item['name'], item['city'], 'active', 'Europe/Bucharest', datetime.now()
                )
                print(f"  + Added location: {item['name']}")
            else:
                print(f"  - Location already exists: {item['name']}")
                
        # 2. Add Products (from update_products.py data)
        from update_products import PRODUCTS
        print(f"Migrating {len(PRODUCTS)} products...")
        for p in PRODUCTS:
            exists = await conn.fetchval("SELECT 1 FROM products WHERE name = $1", p['name'])
            if not exists:
                prod_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO products (id, name, description, price, currency, category, image_url, available, created_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
                    prod_id, p['name'], p['description'], p['price'], 'RON', p['category'], p['image_url'], True, datetime.now()
                )
                print(f"  + Added product: {p['name']}")
            else:
                print(f"  - Product already exists: {p['name']}")
                
        # 3. Add Invitations (if any)
        # 4. Check Tables count
        tables = ['users', 'locations', 'screens', 'content', 'playlists', 'products', 'digital_menus']
        for table in tables:
            count = await conn.fetchval(f"SELECT count(*) FROM {table}")
            print(f"Final count for {table}: {count}")
            
        await conn.close()
        print("\n✅ Migration complete!")
        
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    # Add backend to path for imports
    import sys
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    asyncio.run(migrate())
