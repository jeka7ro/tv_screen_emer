import asyncio
from datetime import datetime, timezone
from db import init_db, billing_summary, close_db

async def test():
    await init_db()
    try:
        from_d = datetime.fromisoformat("2026-03-31T21:00:00.000+00:00")
        to_d = datetime.fromisoformat("2026-04-30T20:59:59.000+00:00")
        res = await billing_summary(date_from=from_d, date_to=to_d)
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        await close_db()

if __name__ == '__main__':
    asyncio.run(test())
