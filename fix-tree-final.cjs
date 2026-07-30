const fs = require('fs');
let code = fs.readFileSync('src/pages/Tree.tsx', 'utf8');
const lines = code.split('\n');
const newLines = [...lines.slice(0, 635), ...lines.slice(742)];
fs.writeFileSync('src/pages/Tree.tsx', newLines.join('\n'));
