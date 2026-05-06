import os
import httpx
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

async def sync_iiko_for_location(location_id: str, location_name: str, org_id: str, db_products_list_func, db_product_insert_func, db_product_update_func):
    name_lower = location_name.lower()
    if "smash" in name_lower:
        IIKO_API_LOGIN = "124d0880f4b44717b69ee21d45fc2656" # Smash Me
    else:
        IIKO_API_LOGIN = "a1fe30cdeb934aa0af01b6a35244b7f0" # Sushi Master / Asian / Default
        
    if not IIKO_API_LOGIN:
        raise Exception("IIKO_API_LOGIN is not configured in .env")

        
    if not org_id:
        raise Exception("Location does not have an IIKO Organization ID configured.")

    async with httpx.AsyncClient() as client:
        # 1. Authenticate with IIKO
        token_resp = await client.post(
            "https://api-eu.syrve.live/api/1/access_token",
            json={"apiLogin": IIKO_API_LOGIN}
        )
        if token_resp.status_code != 200:
            raise Exception(f"Failed to authenticate with IIKO: {token_resp.text}")
            
        token = token_resp.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get nomenclature
        nom_resp = await client.post(
            "https://api-eu.syrve.live/api/1/nomenclature",
            headers=headers,
            json={"organizationId": org_id}
        )
        
        if nom_resp.status_code != 200:
            raise Exception(f"Failed to fetch nomenclature: {nom_resp.text}")
            
        data = nom_resp.json()
        groups = {g["id"]: g["name"] for g in data.get("groups", [])}
        products = data.get("products", [])
        
        # Fetch existing products for this location
        all_existing = await db_products_list_func()
        existing_map = {}
        for p in all_existing:
            if p.get("location_id") == location_id and p.get("iiko_id"):
                existing_map[p["iiko_id"]] = p
                
        synced_count = 0
        for p in products:
            if p.get("type") != "Dish": 
                continue
                
            # Parse price
            size_prices = p.get("sizePrices", [])
            price = 0
            if size_prices and size_prices[0].get("price", {}).get("currentPrice"):
                price = size_prices[0]["price"]["currentPrice"]
                
            # Get category
            category_id = p.get("parentGroup")
            category_name = groups.get(category_id, "other").lower()
            
            # Map IIKO category to our categories
            mapped_category = "other"
            for cat in ["sushi", "rolls", "sashimi", "tempura", "soup", "salad", "dessert", "drinks"]:
                if cat in category_name:
                    mapped_category = cat
                    break
                    
            # Brand filtering logic
            if "smash" in name_lower:
                if "sushi master" in category_name or "ikura" in category_name or "we love" in category_name:
                    continue
            elif "ikura" in name_lower:
                if "sushi master" in category_name or "we love" in category_name or "smash" in category_name:
                    continue
            elif "we love" in name_lower:
                if "sushi master" in category_name or "ikura" in category_name or "smash" in category_name:
                    continue
            else:
                # Default is Sushi Master
                if "ikura" in category_name or "we love" in category_name or "smash" in category_name:
                    continue

            image_url = None
            if p.get("imageLinks"):
                image_url = p["imageLinks"][0]
                
            # Upsert logic
            iiko_id = p.get("id")
            existing = existing_map.get(iiko_id)
            
            product_dict = {
                "name": p.get("name"),
                "description": p.get("description", ""),
                "price": float(price),
                "currency": "RON",
                "category": mapped_category,
                "image_url": image_url or (existing.get("image_url") if existing else None),
                "available": True,
                "featured": existing.get("featured", False) if existing else False,
                "order_index": p.get("order", 0),
                "location_id": location_id,
                "iiko_id": iiko_id,
                "created_at": existing.get("created_at") if existing else datetime.now(timezone.utc)
            }
            
            if existing:
                await db_product_update_func(existing["id"], product_dict)
            else:
                import uuid
                product_dict["id"] = str(uuid.uuid4())
                await db_product_insert_func(product_dict)
                
            synced_count += 1
            
        return synced_count
