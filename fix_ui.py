import os
import re

directory = 'frontend/src'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Rule 1: target="_blank" -> remove or replace
            # Rule 1b: window.confirm -> we'll tackle this separately maybe

            # Replace rounded-lg and rounded-xl in Button, input, select, Link tags
            def replace_rounded(match):
                tag = match.group(0)
                # If it's an interactive element, we want rounded-full
                if re.search(r'<(button|input|select|Link|Button)', tag, re.IGNORECASE):
                    tag = re.sub(r'rounded-(lg|xl)', 'rounded-full', tag)
                return tag
            
            # This regex tries to match HTML tags
            # It's a bit naive, but it might work for most simple cases
            # A better approach is to just do a global replace of "rounded-lg" to "rounded-full" if the line contains "btn" or "button" or "input" or "glass-input" or "glass-select"
            
            new_content = []
            for line in content.split('\n'):
                # If line contains button/input/link/select and rounded-(lg|xl), make it rounded-full
                if re.search(r'<(button|Button|input|select|Link|a\s)', line, re.IGNORECASE) or re.search(r'class(Name)?=.*(btn|input|select|hover:bg)', line, re.IGNORECASE):
                    line = re.sub(r'rounded-lg', 'rounded-full', line)
                    line = re.sub(r'rounded-xl', 'rounded-full', line)
                # If line has target="_blank", we could remove it, but let's just leave it for now or remove it
                # If it's an image/card/panel, rounded-lg should be rounded-2xl
                elif re.search(r'class(Name)?=.*(bg-white|p-|glass|shadow|border)', line, re.IGNORECASE):
                    line = re.sub(r'rounded-lg', 'rounded-2xl', line)
                    line = re.sub(r'rounded-xl', 'rounded-2xl', line)
                
                new_content.append(line)
                
            content = '\n'.join(new_content)

            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

print("Finished applying UI rules.")
