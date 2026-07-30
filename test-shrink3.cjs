const fs = require('fs');
let code = fs.readFileSync('src/pages/Tree.tsx', 'utf8');
const start = code.indexOf('<style>{`');
const end = code.indexOf('</style>') + 8;
code = code.substring(0, start) + code.substring(end);
fs.writeFileSync('src/pages/Tree-shrink3.tsx', code);
