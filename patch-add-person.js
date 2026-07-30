const fs = require('fs');
let code = fs.readFileSync('src/pages/AddPerson.tsx', 'utf8');

// 1. Add new imports and components at the top
const importsTarget = `import { FiUpload, FiImage } from 'react-icons/fi';`;
const importsReplacement = `import { FiUpload, FiImage, FiX } from 'react-icons/fi';

const LOCAL_GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Masculin (Male)' },
  { value: 'female', label: 'Féminin (Female)' },
];

function PersonAutocomplete({ 
  label, 
  value, 
  options, 
  onChange 
}: { 
  label: string; 
  value: string; 
  options: Person[]; 
  onChange: (val: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Sync search with selected value
  useEffect(() => {
    if (value) {
      const selected = options.find(o => o.id === value);
      if (selected) {
        setSearch(\`\${selected.firstName} \${selected.lastName}\`);
      } else {
        setSearch('');
      }
    } else {
      setSearch('');
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = search.length >= 3 
    ? options.filter(p => \`\${p.firstName} \${p.lastName}\`.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="relative space-y-2" ref={wrapperRef}>
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <div className="relative">
        <input 
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') onChange('');
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Taper 3 lettres..."
          className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {value && (
           <button 
             type="button" 
             onClick={(e) => { e.stopPropagation(); onChange(''); }} 
             className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
           >
             <FiX size={14} />
           </button>
        )}
      </div>
      
      {isOpen && search.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(p => (
              <div 
                key={p.id}
                onClick={() => {
                  onChange(p.id);
                  setIsOpen(false);
                }}
                className="px-4 py-2 cursor-pointer hover:bg-primary/5 text-sm font-medium"
              >
                {p.firstName} {p.lastName} {p.birthDate ? \`(\${new Date(p.birthDate).getFullYear()})\` : ''}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-text-secondary">Aucun membre trouvé</div>
          )}
        </div>
      )}
    </div>
  );
}`;
code = code.replace(importsTarget, importsReplacement);

// 2. Default gender to male
code = code.replace(`gender: 'unknown' as Gender`, `gender: 'male' as Gender`);

// 3. Remove GENDER_OPTIONS from imports
code = code.replace(`import { COLLECTIONS, GENDER_OPTIONS } from '@/lib/constants';`, `import { COLLECTIONS } from '@/lib/constants';`);

// 4. Update gender select
const genderSelectTarget = `<select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            >
              {GENDER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>`;
const genderSelectReplacement = `<select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            >
              {LOCAL_GENDER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>`;
code = code.replace(genderSelectTarget, genderSelectReplacement);

// 5. Replace parents and spouse selects
const relationFieldsTarget = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Parent 1</label>
              <select 
                name="parentId1" 
                value={formData.parentId1} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="">None / Unknown</option>
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Parent 2</label>
              <select 
                name="parentId2" 
                value={formData.parentId2} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="">None / Unknown</option>
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Conjoint(e)</label>
              <select 
                name="spouseId" 
                value={formData.spouseId} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="">None / Unknown</option>
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
          </div>`;

const relationFieldsReplacement = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
            <PersonAutocomplete 
              label="Père (Father)"
              value={formData.parentId1}
              options={persons.filter(p => p.gender === 'male' && p.id !== id)}
              onChange={(val) => {
                setFormData(prev => ({ ...prev, parentId1: val }));
                if (val && !formData.lastName) {
                   const father = persons.find(p => p.id === val);
                   if (father && father.lastName) {
                      setFormData(prev => ({ ...prev, lastName: father.lastName }));
                   }
                }
              }}
            />
            <PersonAutocomplete 
              label="Mère (Mother)"
              value={formData.parentId2}
              options={persons.filter(p => p.gender === 'female' && p.id !== id)}
              onChange={(val) => setFormData(prev => ({ ...prev, parentId2: val }))}
            />
            <PersonAutocomplete 
              label="Conjoint(e)"
              value={formData.spouseId}
              options={persons.filter(p => (p.gender !== formData.gender || !p.gender) && p.id !== id)}
              onChange={(val) => setFormData(prev => ({ ...prev, spouseId: val }))}
            />
          </div>`;
          
code = code.replace(relationFieldsTarget, relationFieldsReplacement);

// Fix TS types for PersonAutocomplete options
code = code.replace(`import { Gender } from '@/types';`, `import { Gender, Person } from '@/types';`);

fs.writeFileSync('src/pages/AddPerson.tsx', code);
