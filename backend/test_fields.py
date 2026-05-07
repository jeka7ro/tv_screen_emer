import asyncio
import httpx
import json

async def main():
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://api-eu.syrve.live/api/1/access_token",
            json={"apiLogin": "a1fe30cdeb934aa0af01b6a35244b7f0"}
        )
        token = token_resp.json().get("token")
        
        nom_resp = await client.post(
            "https://api-eu.syrve.live/api/1/nomenclature",
            headers={"Authorization": f"Bearer {token}"},
            json={"organizationId": "adddb5a0-26e5-4d50-b472-1c74726c3f72"}
        )
        data = nom_resp.json()
        
        for p in data.get("products", []):
            if "Ikura" in p["name"]:
                print(json.dumps(p, indent=2))
                break

asyncio.run(main())
