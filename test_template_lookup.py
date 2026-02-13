import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from server import get_predefined_templates

templates = get_predefined_templates()
print(f"Total templates: {len(templates)}")
for t in templates:
    print(f"  - ID: {t['id']}, Name: {t['name']}")

# Test lookup
template_id = "sidebar"
found = next((t for t in templates if t["id"] == template_id), None)
print(f"\nLookup for '{template_id}': {found is not None}")
if found:
    print(f"  Found: {found['name']} with {len(found['zones'])} zones")
