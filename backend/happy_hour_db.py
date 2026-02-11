# ============================================================================
# HAPPY HOUR SCHEDULES
# ============================================================================

async def happy_hour_list():
    """Get all happy hour schedules"""
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM happy_hour_schedules
            ORDER BY created_at DESC
        """)
        return [dict(r) for r in rows]

async def happy_hour_get(schedule_id: str):
    """Get a single happy hour schedule by ID"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT * FROM happy_hour_schedules
            WHERE id = $1
        """, schedule_id)
        return dict(row) if row else None

async def happy_hour_insert(data: dict):
    """Create a new happy hour schedule"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO happy_hour_schedules (
                name, city, screen_ids, start_time, end_time,
                content_type, content_id, playlist_id, active, days_of_week
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        """,
            data.get('name'),
            data.get('city'),
            data.get('screen_ids', []),
            data.get('start_time'),
            data.get('end_time'),
            data.get('content_type'),
            data.get('content_id'),
            data.get('playlist_id'),
            data.get('active', True),
            data.get('days_of_week', [1, 2, 3, 4, 5, 6, 7])
        )
        return dict(row)

async def happy_hour_update(schedule_id: str, data: dict):
    """Update an existing happy hour schedule"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE happy_hour_schedules
            SET name = $2, city = $3, screen_ids = $4, start_time = $5,
                end_time = $6, content_type = $7, content_id = $8,
                playlist_id = $9, active = $10, days_of_week = $11,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        """,
            schedule_id,
            data.get('name'),
            data.get('city'),
            data.get('screen_ids', []),
            data.get('start_time'),
            data.get('end_time'),
            data.get('content_type'),
            data.get('content_id'),
            data.get('playlist_id'),
            data.get('active', True),
            data.get('days_of_week', [1, 2, 3, 4, 5, 6, 7])
        )
        return dict(row) if row else None

async def happy_hour_delete(schedule_id: str):
    """Delete a happy hour schedule"""
    async with pool.acquire() as conn:
        await conn.execute("""
            DELETE FROM happy_hour_schedules
            WHERE id = $1
        """, schedule_id)

async def happy_hours_active_now():
    """Get currently active happy hour schedules based on time and day"""
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM happy_hour_schedules
            WHERE active = true
            AND CURRENT_TIME BETWEEN start_time AND end_time
            AND EXTRACT(ISODOW FROM CURRENT_DATE) = ANY(days_of_week)
        """)
        return [dict(r) for r in rows]
