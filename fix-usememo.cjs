const fs = require('fs');
let code = fs.readFileSync('src/pages/Tree.tsx', 'utf8');

code = code.replace(
  'const { xPos, levels } = useMemo(() => {',
  'const { xPos, levels, layoutNodes } = useMemo(() => {'
);
code = code.replace(
  'return { xPos: xPosMap, levels: genMap };',
  'return { xPos: xPosMap, levels: genMap, layoutNodes: Array.from(nodes.values()) };'
);

fs.writeFileSync('src/pages/Tree.tsx', code);
