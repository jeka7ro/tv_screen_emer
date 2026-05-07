import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://api-eu.syrve.live/api/1/access_token",
            json={"apiLogin": "a1fe30cdeb934aa0af01b6a35244b7f0"}
        )
        token = token_resp.json().get("token")
        
        # Org ID for Sushi Master CLUJ
        nom_resp = await client.post(
            "https://api-eu.syrve.live/api/1/nomenclature",
            headers={"Authorization": f"Bearer {token}"},
            json={"organizationId": "adddb5a0-26e5-4d50-b472-1c74726c3f72"}
        )
        data = nom_resp.json()
        groups = {g["id"]: g["name"] for g in data.get("groups", [])}
        
        for p in data.get("products", []):
            if "Ikura" in p["name"]:
                size_prices = p.get("sizePrices", [])
                price = size_prices[0].get("price", {}).get("currentPrice") if size_prices else "No Price"
                print(f"Product: {p['name']} | Price: {price} | Group: {groups.get(p.get('parentGroup'))}")
                break

asyncio.run(main())
