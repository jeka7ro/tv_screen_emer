import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content.replace('btn-red', 'btn-primary')

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            process_file(os.path.join(root, file))
