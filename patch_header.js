import fs from 'fs';
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf-8');

const navLinksToReplace = `              <NavLink to="/network" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Système Solaire</NavLink>
              <NavLink to="/pathfinder" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Pathfinder</NavLink>
              <NavLink to="/passport" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Passport</NavLink>
              <NavLink to="/star-network" className={({isActive}) => isActive ? "text-primary border-b-2 border-primary pb-1" : "hover:text-primary transition-colors"}>Star Network</NavLink>`;

const dropdownCode = `              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  Views ▾
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden flex flex-col py-1">
                  <NavLink to="/network" className={({isActive}) => \`px-4 py-2 text-sm hover:bg-surface-hover transition-colors \${isActive ? 'text-primary font-bold' : ''}\`}>Solar Kinship (Radial)</NavLink>
                  <NavLink to="/star-network" className={({isActive}) => \`px-4 py-2 text-sm hover:bg-surface-hover transition-colors \${isActive ? 'text-primary font-bold' : ''}\`}>Star Network</NavLink>
                  <NavLink to="/pathfinder" className={({isActive}) => \`px-4 py-2 text-sm hover:bg-surface-hover transition-colors \${isActive ? 'text-primary font-bold' : ''}\`}>Kinship Pathfinder</NavLink>
                  <NavLink to="/passport" className={({isActive}) => \`px-4 py-2 text-sm hover:bg-surface-hover transition-colors \${isActive ? 'text-primary font-bold' : ''}\`}>Passport View</NavLink>
                </div>
              </div>`;

code = code.replace(navLinksToReplace, dropdownCode);

fs.writeFileSync('src/components/layout/Header.tsx', code);
