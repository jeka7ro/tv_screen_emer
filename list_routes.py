import sys
import os
sys.path.append(os.getcwd())

from backend.server import app

print("Listing all registered routes:")
for route in app.routes:
    if hasattr(route, 'methods'):
        print(f"{route.methods} {route.path}")
    else:
        print(f"MOUNT {route.path}")
