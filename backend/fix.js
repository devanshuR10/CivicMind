const fs = require('fs');
let content = fs.readFileSync('seed.js', 'utf8');
content = content.replace(/(?<!async\s+)(function\s*seedData)/g, 'async $1');
content = content.replace(/await\s+db\.prepare/g, 'db.prepare');
content = content.replace(/(?<!await\s)([\w\.]+)\.run\(/g, 'await $1.run(');
content = content.replace(/await\s+([\w\.]+)\.run\((.*?)\)\.lastInsertRowid/g, '(await $1.run($2)).lastInsertRowid');
content = content.replace(/db\.exec\(/g, 'await db.exec(');
content = content.replace(/console\.log\(\"Seeding database[^\n]*/, 'await db.initDatabase();\n  console.log(\"Seeding database\");');
fs.writeFileSync('seed.js', content);

