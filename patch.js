const fs = require('fs');
let code = fs.readFileSync('src/pages/Tree.tsx', 'utf8');

const targetSVG = `                {persons.map(p => {
                  const paths = [];
                  const childX = xPos.get(p.id) || 0;
                  const childY = (levels.get(p.id) || 0) * 350;
                  const offset = 120; // Half of card height + padding
                  
                  if (p.parentId1) {
                    const p1X = xPos.get(p.parentId1) || 0;
                    const p1Y = (levels.get(p.parentId1) || 0) * 350;
                    const isActive = focusedPersonId ? (p.id === focusedPersonId || p.parentId1 === focusedPersonId) : false;
                    paths.push(
                      <path 
                        key={\`\${p.id}-p1\`}
                        d={\`M \${p1X} \${p1Y + offset} C \${p1X} \${p1Y + offset + 80}, \${childX} \${childY - offset - 80}, \${childX} \${childY - offset}\`}
                        markerEnd={\`url(#arrow-\${isActive ? 'active' : 'inactive'})\`}
                        className={\`fill-none stroke-2 transition-all duration-300 \${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}\`}
                      />
                    );
                  }
                  if (p.parentId2) {
                    const p2X = xPos.get(p.parentId2) || 0;
                    const p2Y = (levels.get(p.parentId2) || 0) * 350;
                    const isActive = focusedPersonId ? (p.id === focusedPersonId || p.parentId2 === focusedPersonId) : false;
                    paths.push(
                      <path 
                        key={\`\${p.id}-p2\`}
                        d={\`M \${p2X} \${p2Y + offset} C \${p2X} \${p2Y + offset + 80}, \${childX} \${childY - offset - 80}, \${childX} \${childY - offset}\`}
                        markerEnd={\`url(#arrow-\${isActive ? 'active' : 'inactive'})\`}
                        className={\`fill-none stroke-2 transition-all duration-300 \${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}\`}
                      />
                    );
                  }
                  
                  if (p.spouseId && p.id < p.spouseId) {
                    const sX = xPos.get(p.spouseId) || 0;
                    const sY = (levels.get(p.spouseId) || 0) * 350;
                    const isActive = focusedPersonId ? (p.id === focusedPersonId || p.spouseId === focusedPersonId) : false;
                    paths.push(
                      <g key={\`\${p.id}-spouse\`}>
                        <path 
                          d={\`M \${childX + 130} \${childY} L \${sX - 130} \${sY}\`}
                          className={\`fill-none stroke-2 transition-all duration-300 \${isActive ? 'stroke-rose-400 animate-flow' : 'stroke-rose-200 stroke-dasharray-[4_4]'}\`}
                        />
                        <rect x={(childX + sX)/2 - 12} y={childY - 12} width="24" height="24" rx="12" fill="#fff" className="stroke-rose-200 stroke-1" />
                        <text x={(childX + sX)/2} y={childY + 4} textAnchor="middle" fontSize="12" fill="#f43f5e">♥</text>
                      </g>
                    )
                  }
                  return paths;
                })}`;

const replacementSVG = `                {persons.map(p => {
                  const paths = [];
                  const childX = xPos.get(p.id) || 0;
                  const childY = (levels.get(p.id) || 0) * 350;
                  const offset = 120; // Half of card height + padding
                  
                  if (p.parentId1 || p.parentId2) {
                    let parentX = 0;
                    let parentY = 0;
                    
                    if (p.parentId1 && p.parentId2) {
                       const p1X = xPos.get(p.parentId1) || 0;
                       const p1Y = (levels.get(p.parentId1) || 0) * 350;
                       const p2X = xPos.get(p.parentId2) || 0;
                       const p2Y = (levels.get(p.parentId2) || 0) * 350;
                       parentX = (p1X + p2X) / 2;
                       parentY = Math.max(p1Y, p2Y);
                    } else if (p.parentId1) {
                       parentX = xPos.get(p.parentId1) || 0;
                       parentY = (levels.get(p.parentId1) || 0) * 350;
                    } else if (p.parentId2) {
                       parentX = xPos.get(p.parentId2) || 0;
                       parentY = (levels.get(p.parentId2) || 0) * 350;
                    }

                    const isActive = focusedPersonId ? (p.id === focusedPersonId || p.parentId1 === focusedPersonId || p.parentId2 === focusedPersonId) : false;
                    const startY = parentY + offset;
                    const midY = startY + 60;
                    
                    paths.push(
                      <path 
                        key={\`\${p.id}-parents\`}
                        d={\`M \${parentX} \${startY} L \${parentX} \${midY} L \${childX} \${midY} L \${childX} \${childY - offset}\`}
                        markerEnd={\`url(#arrow-\${isActive ? 'active' : 'inactive'})\`}
                        className={\`fill-none stroke-2 transition-all duration-300 \${isActive ? 'stroke-primary animate-flow' : 'stroke-slate-300/60'}\`}
                        strokeLinejoin="round"
                      />
                    );
                  }
                  
                  if (p.spouseId && p.id < p.spouseId) {
                    const sX = xPos.get(p.spouseId) || 0;
                    const sY = (levels.get(p.spouseId) || 0) * 350;
                    const isActive = focusedPersonId ? (p.id === focusedPersonId || p.spouseId === focusedPersonId) : false;
                    paths.push(
                      <g key={\`\${p.id}-spouse\`}>
                        <path 
                          d={\`M \${childX + 130} \${childY} L \${sX - 130} \${sY}\`}
                          className={\`fill-none stroke-2 transition-all duration-300 \${isActive ? 'stroke-rose-400 animate-flow' : 'stroke-rose-200 stroke-dasharray-[4_4]'}\`}
                        />
                        <rect x={(childX + sX)/2 - 12} y={childY - 12} width="24" height="24" rx="12" fill="#fff" className="stroke-rose-200 stroke-1" />
                        <text x={(childX + sX)/2} y={childY + 4} textAnchor="middle" fontSize="12" fill="#f43f5e">♥</text>
                      </g>
                    )
                  }
                  return paths;
                })}`;

code = code.replace(targetSVG, replacementSVG);
fs.writeFileSync('src/pages/Tree.tsx', code);
