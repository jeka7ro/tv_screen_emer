import os
import re

directory = 'frontend/src/pages'

# We don't want to modify client screens. The main client screen is DisplayScreen.js or maybe ScreenDesigner.js.
# Actually, window.confirm is mostly in admin dashboards. 
# Let's see which files have window.confirm
files_to_process = []
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'window.confirm' in content:
                files_to_process.append(path)

for path in files_to_process:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if useConfirm is already imported
    if 'useConfirm' not in content:
        # Find the last import and add useConfirm after it
        imports = re.findall(r'^import .*?;?\n', content, re.MULTILINE)
        if imports:
            last_import = imports[-1]
            # Figure out relative path to hooks
            # If path is frontend/src/pages/Content.js, relative is '../hooks/useConfirm'
            # If path is frontend/src/pages/dashboard/Dashboard.js, relative is '../../hooks/useConfirm'
            depth = path.count('/') - 2 # frontend/src/pages -> 3 slashes, depth 1
            if depth == 1:
                hook_path = '../hooks/useConfirm'
            elif depth == 2:
                hook_path = '../../hooks/useConfirm'
            else:
                hook_path = '../hooks/useConfirm'
            
            replacement = f"{last_import}import {{ useConfirm }} from '{hook_path}';\n"
            content = content.replace(last_import, replacement, 1)
            
    # We need to insert `const { confirm, ConfirmDialog } = useConfirm();` at the beginning of the component
    # We look for something like `export const Brands = () => {` or `const Brands = () => {`
    # and then insert it after the first `{`
    
    # Try to find component definition
    component_match = re.search(r'export (const|function) (\w+)\s*=?\s*\([^)]*\)\s*(=>)?\s*\{', content)
    if component_match:
        comp_def = component_match.group(0)
        insert_code = f"\n    const {{ confirm, ConfirmDialog }} = useConfirm();"
        content = content.replace(comp_def, comp_def + insert_code, 1)
        
    # Replace `window.confirm(MESSAGE)` with `(await confirm({ message: MESSAGE, isDanger: true }))`
    # Wait, the string can be single quoted or backticked.
    # window\.confirm\((['`"].*?['`"])\)
    content = re.sub(
        r'window\.confirm\(([`\'"].*?[`\'"])\)', 
        r'(await confirm({ message: \1, isDanger: true }))', 
        content
    )
    
    # Find the main return statement to inject <ConfirmDialog />
    # Usually it's `return (` followed by some wrapper like `<DashboardLayout>`
    # Let's insert it right after `<DashboardLayout>` or right before the last closing tag.
    # Actually, inserting it before `</DashboardLayout>` is safest.
    if '</DashboardLayout>' in content:
        content = content.replace('</DashboardLayout>', '    <ConfirmDialog />\n        </DashboardLayout>')
    elif '</Layout>' in content:
        content = content.replace('</Layout>', '    <ConfirmDialog />\n        </Layout>')
    else:
        # Just put it before the last `</div>` if possible
        pass # Might need manual fix if it's not wrapped in DashboardLayout
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Processed {len(files_to_process)} files.")
