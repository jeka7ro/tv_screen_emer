import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_mongo():
    try:
        client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        dbs = await client.list_database_names()
        print(f"MongoDB Databases: {dbs}")
        for db_name in dbs:
            if db_name in ['admin', 'config', 'local']: continue
            db = client[db_name]
            cols = await db.list_collection_names()
            print(f"  DB {db_name} collections: {cols}")
            for col_name in cols:
                count = await db[col_name].count_documents({})
                print(f"    Collection {col_name}: {count} docs")
    except Exception as e:
        print(f"Could not connect to local MongoDB: {e}")

if __name__ == "__main__":
    asyncio.run(check_mongo())
