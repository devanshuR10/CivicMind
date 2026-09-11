import os, re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'(?<!await\s)(db\s*\.\s*prepare\s*\(\s*\`[^\`]*\`\s*\)\s*\.\s*(?:get|all|run)\s*\()'
    content = re.sub(pattern, r'await \1', content)

    pattern2 = r'(?<!await\s)(db\s*\.\s*prepare\s*\(\s*\"[^\"]*\"\s*\)\s*\.\s*(?:get|all|run)\s*\()'
    content = re.sub(pattern2, r'await \1', content)

    pattern3 = r'(?<!await\s)(db\s*\.\s*prepare\s*\(\s*\'[^\']*\'\s*\)\s*\.\s*(?:get|all|run)\s*\()'
    content = re.sub(pattern3, r'await \1', content)
    
    # Also fix anything that was missed like db.prepare().run()
    content = re.sub(r'(?<!await\s)(db\s*\.\s*prepare\([^)]+\)\s*\.\s*(?:get|all|run)\s*\()', r'await \1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root: continue
    for f in files:
        if f.endswith('.js') and f not in ['db.js', 'seed.js', 'server.js']:
            process_file(os.path.join(root, f))

