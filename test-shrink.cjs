const fs = require('fs');
let code = fs.readFileSync('src/pages/Tree.tsx', 'utf8');
const start = code.indexOf('{layoutNodes.map(node => {');
const end = code.indexOf('              </svg>');
code = code.substring(0, start) + '{[]}\n' + code.substring(end);
fs.writeFileSync('src/pages/Tree-shrink.tsx', code);
