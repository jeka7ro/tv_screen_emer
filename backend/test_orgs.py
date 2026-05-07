import asyncio
import httpx
import json

async def fetch_orgs(api_key):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://api-eu.syrve.live/api/1/access_token",
            json={"apiLogin": api_key}
        )
        token = token_resp.json().get("token")
        
        orgs_resp = await client.post(
            "https://api-eu.syrve.live/api/1/organizations",
            headers={"Authorization": f"Bearer {token}"},
            json={"returnAdditionalInfo": True}
        )
        return orgs_resp.json()

async def main():
    print("Fetching Sushi Master/Ikura orgs...")
    orgs1 = await fetch_orgs("a1fe30cdeb934aa0af01b6a35244b7f0")
    print(f"Found {len(orgs1.get('organizations', []))} orgs.")
    
    print("Fetching Smash Me orgs...")
    orgs2 = await fetch_orgs("124d0880f4b44717b69ee21d45fc2656")
    print(f"Found {len(orgs2.get('organizations', []))} orgs.")
    
    # print the first org of each to see structure
    if orgs1.get('organizations'):
        print(json.dumps(orgs1['organizations'][0], indent=2))
    if orgs2.get('organizations'):
        print(json.dumps(orgs2['organizations'][0], indent=2))

asyncio.run(main())
