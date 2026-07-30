const fs = require('fs');
let code = fs.readFileSync('src/pages/Tree.tsx', 'utf8');
const lines = code.split('\n');
const top = lines.slice(0, 741); // 0 to 740 is 741 lines. line 741 is index 740
const bottom = lines.slice(1377); // 1377 to end
const finalLines = [...top, '              </svg>', ...bottom];
fs.writeFileSync('src/pages/Tree.tsx', finalLines.join('\n'));
