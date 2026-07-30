const fs = require('fs');
let code = fs.readFileSync('src/pages/Tree.tsx', 'utf8');

const svgStartToken = `{persons.map(p => {`;
const startIdx = code.indexOf(svgStartToken, code.indexOf('<svg className="absolute'));

if (startIdx !== -1) {
    const endIdx = code.indexOf('              </svg>', startIdx);
    
    const newSvgContent = `{layoutNodes.map(node => {
                const paths = [];
                if (node.children.length > 0) {
                  const parentX = node.x;
                  const parentY = node.gen * 350;
                  const offset = 120; // drop down from center
                  const startY = parentY + offset;
                  const midY = startY + 60; // horizontal line Y
                  
                  const isActive = focusedPersonId ? (
                    node.person1 === focusedPersonId || 
                    node.person2 === focusedPersonId || 
                    node.children.some(cid => {
                       const c = layoutNodes.find(n => n.id === cid);
                       return c && (c.person1 === focusedPersonId || c.person2 === focusedPersonId);
                    })
                  ) : false;

                  paths.push(
                    <path
                      key={\`\${node.id}-trunk\`}
                      d={\`M \${parentX} \${startY} L \${parentX} \${midY}\`}
                      className={\`fill-none stroke-2 transition-all duration-300 \${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}\`}
                    />
                  );

                  const childTargets = node.children.map(cid => {
                    const childNode = layoutNodes.find(n => n.id === cid);
                    let targetX = childNode ? childNode.x : 0;
                    if (childNode && childNode.isCouple) {
                       const p1 = persons.find(p => p.id === childNode.person1);
                       const p2 = persons.find(p => p.id === childNode.person2);
                       const isP1Child = p1?.parentId1 === node.person1 || p1?.parentId1 === node.person2 || p1?.parentId2 === node.person1 || p1?.parentId2 === node.person2;
                       const isP2Child = p2?.parentId1 === node.person1 || p2?.parentId1 === node.person2 || p2?.parentId2 === node.person1 || p2?.parentId2 === node.person2;
                       
                       if (isP1Child && !isP2Child) {
                           targetX = xPos.get(childNode.person1) || 0;
                       } else if (isP2Child && !isP1Child) {
                           targetX = xPos.get(childNode.person2) || 0;
                       }
                    }
                    return { cid, childNode, targetX };
                  });
                  
                  if (childTargets.length > 1) {
                     const sortedTargets = [...childTargets].sort((a, b) => a.targetX - b.targetX);
                     const minX = Math.min(sortedTargets[0].targetX, parentX);
                     const maxX = Math.max(sortedTargets[sortedTargets.length - 1].targetX, parentX);
                     
                     paths.push(
                       <path
                          key={\`\${node.id}-horiz\`}
                          d={\`M \${minX} \${midY} L \${maxX} \${midY}\`}
                          className={\`fill-none stroke-2 transition-all duration-300 \${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}\`}
                       />
                     );
                  } else if (childTargets.length === 1) {
                     const tX = childTargets[0].targetX;
                     if (tX !== parentX) {
                       paths.push(
                         <path
                            key={\`\${node.id}-horiz\`}
                            d={\`M \${parentX} \${midY} L \${tX} \${midY}\`}
                            className={\`fill-none stroke-2 transition-all duration-300 \${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}\`}
                         />
                       );
                     }
                  }
                  
                  childTargets.forEach(({ cid, childNode, targetX }) => {
                     if (!childNode) return;
                     const childY = childNode.gen * 350;
                     const childActive = isActive || (focusedPersonId && (childNode.person1 === focusedPersonId || childNode.person2 === focusedPersonId));

                     paths.push(
                       <path
                          key={\`\${node.id}-to-\${cid}\`}
                          d={\`M \${targetX} \${midY} L \${targetX} \${childY - offset}\`}
                          markerEnd={\`url(#arrow-\${childActive ? 'active' : 'inactive'})\`}
                          className={\`fill-none stroke-2 transition-all duration-300 \${childActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}\`}
                       />
                     );
                  });
                }
                
                if (node.isCouple && node.person2) {
                  const p1X = xPos.get(node.person1) || 0;
                  const p2X = xPos.get(node.person2) || 0;
                  const y = node.gen * 350;
                  
                  const isCoupleActive = focusedPersonId ? (node.person1 === focusedPersonId || node.person2 === focusedPersonId) : false;
                  
                  paths.push(
                    <g key={\`\${node.id}-couple\`}>
                      <path 
                        d={\`M \${Math.min(p1X, p2X) + 130} \${y} L \${Math.max(p1X, p2X) - 130} \${y}\`}
                        className={\`fill-none stroke-2 transition-all duration-300 \${isCoupleActive ? 'stroke-rose-400 animate-flow' : 'stroke-rose-200 stroke-dasharray-[4_4]'}\`}
                      />
                      <rect x={node.x - 12} y={y - 12} width="24" height="24" rx="12" fill="#fff" className="stroke-rose-200 stroke-1" />
                      <text x={node.x} y={y + 4} textAnchor="middle" fontSize="12" fill="#f43f5e">♥</text>
                    </g>
                  );
                }
                return paths;
              })}
`;

    code = code.substring(0, startIdx) + newSvgContent + code.substring(endIdx);
    fs.writeFileSync('src/pages/Tree.tsx', code);
    console.log('Patched SVG lines successfully!');
} else {
    console.error('Could not find SVG lines section to replace!');
}
