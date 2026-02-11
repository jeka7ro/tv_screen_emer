# Happy Hour API Endpoints

@api_router.get("/api/happy-hours")
async def get_happy_hours(current_user: dict = Depends(get_current_user)):
    """Get all happy hour schedules"""
    schedules = await happy_hour_list()
    return schedules

@api_router.get("/api/happy-hours/active")
async def get_active_happy_hours():
    """Get currently active happy hour schedules (public endpoint)"""
    schedules = await happy_hours_active_now()
    return schedules

@api_router.get("/api/happy-hours/{schedule_id}")
async def get_happy_hour(schedule_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single happy hour schedule"""
    schedule = await happy_hour_get(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Happy hour schedule not found")
    return schedule

@api_router.post("/api/happy-hours")
async def create_happy_hour(data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new happy hour schedule"""
    if current_user.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    schedule = await happy_hour_insert(data)
    return schedule

@api_router.put("/api/happy-hours/{schedule_id}")
async def update_happy_hour(schedule_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Update an existing happy hour schedule"""
    if current_user.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    schedule = await happy_hour_update(schedule_id, data)
    if not schedule:
        raise HTTPException(status_code=404, detail="Happy hour schedule not found")
    return schedule

@api_router.delete("/api/happy-hours/{schedule_id}")
async def delete_happy_hour(schedule_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a happy hour schedule"""
    if current_user.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await happy_hour_delete(schedule_id)
    return {"message": "Happy hour schedule deleted successfully"}
