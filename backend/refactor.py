import os, re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Make route handlers async
    content = re.sub(r'(?<!async\s)function\s*\(\s*req,\s*res\s*\)', r'async function(req, res)', content)
    content = re.sub(r'(?<!async\s)function\s*\(\s*req,\s*res,\s*next\s*\)', r'async function(req, res, next)', content)
    content = re.sub(r'(?<!async\s)\(\s*req,\s*res\s*\)\s*=>', r'async (req, res) =>', content)
    content = re.sub(r'(?<!async\s)\(\s*req,\s*res,\s*next\s*\)\s*=>', r'async (req, res, next) =>', content)

    # 2. Add await to db.prepare().run/get/all
    content = re.sub(r'(?<!await\s)(db\.prepare\([^)]+\)\s*\.\s*(?:get|run|all)\()', r'await \1', content)

    # 3. Add await to stmt.run/get/all where stmt was defined by db.prepare
    content = re.sub(r'(?<!await\s)(\w+(?:Stmt|Query)\s*\.\s*(?:get|run|all)\()', r'await \1', content)
    
    # 4. Same for any db.exec
    content = re.sub(r'(?<!await\s)(db\.exec\()', r'await \1', content)

    # 5. Some variable names are just "const user = db.prepare(...).get()", rule #2 catches these.
    # What if it's "const check = db.prepare(...); check.get()"? Rule #3 might miss it if it's not named Stmt.
    # Let's add a generic lookbehind for lines containing .get( or .all( or .run( that we know are DB calls.
    # We will search for: db.prepare(.*)
    # Then wait, let's just replace the files and test.

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root: continue
    for f in files:
        if f.endswith('.js') and f not in ['db.js', 'seed.js', 'server.js']:
            process_file(os.path.join(root, f))
