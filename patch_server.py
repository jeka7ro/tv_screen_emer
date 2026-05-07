with open("backend/server.py", "r") as f:
    content = f.read()

replacement = """@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str, current_user: User = Depends(require_admin)):
    ok = await location_delete(location_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"status": "ok"}

@api_router.post("/locations/sync-iiko")
async def sync_locations_with_iiko(current_user: User = Depends(require_admin)):
    import httpx
    
    async def fetch_orgs(api_key):
        async with httpx.AsyncClient() as client:
            token_resp = await client.post("https://api-eu.syrve.live/api/1/access_token", json={"apiLogin": api_key})
            if token_resp.status_code != 200: return []
            token = token_resp.json().get("token")
            orgs_resp = await client.post(
                "https://api-eu.syrve.live/api/1/organizations",
                headers={"Authorization": f"Bearer {token}"},
                json={"returnAdditionalInfo": True}
            )
            return orgs_resp.json().get("organizations", []) if orgs_resp.status_code == 200 else []

    orgs1 = await fetch_orgs("a1fe30cdeb934aa0af01b6a35244b7f0") # Sushi / Asian
    orgs2 = await fetch_orgs("124d0880f4b44717b69ee21d45fc2656") # Smash
    
    all_orgs = orgs1 + orgs2
    existing_locations = await locations_list()
    existing_org_ids = {loc.get("iiko_organization_id") for loc in existing_locations if loc.get("iiko_organization_id")}
    
    added = 0
    for org in all_orgs:
        org_id = org.get("id")
        if org_id not in existing_org_ids:
            import uuid
            new_loc = {
                "id": str(uuid.uuid4()),
                "name": org.get("name"),
                "address": org.get("restaurantAddress", ""),
                "city": "Unknown",
                "status": "active",
                "security_code": "",
                "iiko_organization_id": org_id,
                "timezone": "Europe/Bucharest",
                "created_at": datetime.now(timezone.utc)
            }
            await location_insert(new_loc)
            existing_org_ids.add(org_id)
            added += 1
            
    return {"message": "Sincronizare locații cu succes", "added": added}

# ============ PRODUCTS ROUTES ============"""

content = content.replace("""@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str, current_user: User = Depends(require_admin)):
    ok = await location_delete(location_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"status": "ok"}

# ============ PRODUCTS ROUTES ============""", replacement)

with open("backend/server.py", "w") as f:
    f.write(content)
