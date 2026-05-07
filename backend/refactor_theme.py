import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to replace Tailwind classes like bg-red-600 with bg-brand-600
    # Watch out for non-tailwind words like "red"
    # Common tailwind prefixes for colors:
    prefixes = ['bg', 'text', 'border', 'ring', 'from', 'to', 'via', 'shadow', 'divide', 'decoration']
    
    modified = False
    for p in prefixes:
        # Regex to match prefix-red-XXX
        pattern = r'\b' + p + r'-red-(\d{2,3}(?:/\d+)?|500/50|900/20|600/90|600/50|50/30|500/10)\b'
        
        def replacer(match):
            return p + '-brand-' + match.group(1)
            
        new_content, count = re.subn(pattern, replacer, content)
        if count > 0:
            modified = True
            content = new_content
            
    # Also handle some custom cases if missed
    # Check for hardcoded red hex/rgba? Usually Tailwind is enough.

    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Refactored {filepath}")

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            process_file(os.path.join(root, file))
