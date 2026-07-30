const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('src/pages/Tree.tsx', 'utf8');
const sourceFile = ts.createSourceFile('Tree.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function printErrors(node) {
    // just looking at syntax errors
}
console.log("File parsed. Diagnostics:");
// actually, I'll just use tsc and capture the exact line of the error.
