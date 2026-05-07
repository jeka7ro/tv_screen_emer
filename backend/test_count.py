import asyncio
import db
from dotenv import load_dotenv
load_dotenv()

async def main():
    await db.init_db()
    c = await db._fetch_one('SELECT count(*) as cnt FROM content')
    print("COUNT IS:", c['cnt'])

asyncio.run(main())
