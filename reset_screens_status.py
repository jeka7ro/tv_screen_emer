#!/usr/bin/env python3
import asyncio
import sys
sys.path.insert(0, '/Users/eugeniucazmal/Downloads/dev_office/tv_screen_emer/tv_screen-main/backend')

from db import init_db, close_db, _execute, _fetch_all

async def main():
    await init_db()
    
    print('📊 Checking current screen status...\n')
    
    # Check current status
    screens = await _fetch_all('SELECT name, status, last_active FROM screens ORDER BY name LIMIT 10')
    for s in screens:
        print(f"  {s['name']:<30} status={s['status']:<10} last_active={s.get('last_active', 'NULL')}")
    
    print('\n' + '='*80)
    print('🔄 Resetting all screens to offline...')
    print('='*80 + '\n')
    
    # Reset all to offline
    await _execute("UPDATE screens SET status = 'offline', last_active = NULL")
    
    # Verify
    offline_count = await _fetch_all("SELECT COUNT(*) as c FROM screens WHERE status = 'offline'")
    print(f'✅ Reset complete! {offline_count[0]["c"]} screens are now offline\n')
    
    # Show updated status
    print('📊 Updated screen status:')
    screens = await _fetch_all('SELECT name, status, last_active FROM screens ORDER BY name LIMIT 10')
    for s in screens:
        print(f"  {s['name']:<30} status={s['status']:<10} last_active={s.get('last_active', 'NULL')}")
    
    await close_db()

if __name__ == '__main__':
    asyncio.run(main())
