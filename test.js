const fs = require('fs');
let code = fs.readFileSync('src/pages/Tree.tsx', 'utf8');
const lines = code.split('\n');
console.log("Line 741:", lines[740]);
console.log("Line 742:", lines[741]);
console.log("Line 743:", lines[742]);
