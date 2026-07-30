const fs = require('fs');
let code = fs.readFileSync('src/pages/Tree-shrink.tsx', 'utf8');
const start = code.indexOf('<svg');
const end = code.indexOf('              </svg>');
code = code.substring(0, start) + '<svg>\n' + code.substring(end);
fs.writeFileSync('src/pages/Tree-shrink2.tsx', code);
