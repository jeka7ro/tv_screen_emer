import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    replacements = {
        r'(?<!dark:)bg-white(?!/)': r'bg-white dark:bg-slate-900',
        r'(?<!dark:)bg-white/(\d+)': r'bg-white/\1 dark:bg-slate-900/\1',
        r'(?<!dark:)bg-slate-50(?!/)': r'bg-slate-50 dark:bg-slate-800/50',
        r'(?<!dark:)bg-slate-100(?!/)': r'bg-slate-100 dark:bg-slate-800',
        r'(?<!dark:)text-slate-800\b': r'text-slate-800 dark:text-slate-200',
        r'(?<!dark:)text-slate-700\b': r'text-slate-700 dark:text-slate-300',
        r'(?<!dark:)text-slate-600\b': r'text-slate-600 dark:text-slate-400',
        r'(?<!dark:)text-slate-500\b': r'text-slate-500 dark:text-slate-400',
        r'(?<!dark:)border-slate-100(?!/)': r'border-slate-100 dark:border-slate-800',
        r'(?<!dark:)border-slate-200(?!/)': r'border-slate-200 dark:border-slate-700',
        r'(?<!dark:)border-slate-300(?!/)': r'border-slate-300 dark:border-slate-600',
        r'(?<!dark:)border-slate-100/(\d+)': r'border-slate-100/\1 dark:border-slate-800/\1',
        r'(?<!dark:)border-slate-200/(\d+)': r'border-slate-200/\1 dark:border-slate-700/\1',
        r'(?<!dark:)border-slate-300/(\d+)': r'border-slate-300/\1 dark:border-slate-600/\1',
        r'(?<!dark:)from-slate-50(?!/)': r'from-slate-50 dark:from-slate-900',
        r'(?<!dark:)to-slate-100(?!/)': r'to-slate-100 dark:to-slate-800',
        r'(?<!dark:)via-slate-100(?!/)': r'via-slate-100 dark:via-slate-800',
        r'(?<!dark:)from-slate-100(?!/)': r'from-slate-100 dark:from-slate-800',
        r'(?<!dark:)to-white(?!/)': r'to-white dark:to-slate-900',
        r'(?<!dark:)from-white(?!/)': r'from-white dark:from-slate-900',
        r'(?<!dark:)via-white(?!/)': r'via-white dark:via-slate-900',
        r'(?<!dark:)to-slate-50/(\d+)': r'to-slate-50/\1 dark:to-slate-900/\1',
        r'(?<!dark:)hover:bg-slate-50(?!/)': r'hover:bg-slate-50 dark:hover:bg-slate-800/50',
        r'(?<!dark:)hover:bg-slate-100(?!/)': r'hover:bg-slate-100 dark:hover:bg-slate-800',
        r'(?<!dark:)hover:text-slate-800\b': r'hover:text-slate-800 dark:hover:text-slate-100',
        r'(?<!dark:)hover:text-slate-700\b': r'hover:text-slate-700 dark:hover:text-slate-200',
    }

    modified = False
    for pattern, replacement in replacements.items():
        new_content, count = re.subn(pattern, replacement, content)
        if count > 0:
            modified = True
            content = new_content

    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx') or file.endswith('.css'):
            # Skip the output CSS if it exists
            process_file(os.path.join(root, file))
