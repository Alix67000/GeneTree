const fs = require('fs');

let code = fs.readFileSync('src/pages/AddPerson.tsx', 'utf-8');

// 1. Add AutocompletePerson component right before export function AddPerson() {
const autocompleteCode = `const AutocompletePerson = ({ 
  label, 
  valueId, 
  onChange, 
  options, 
  placeholder 
}: { 
  label: string, 
  valueId: string, 
  onChange: (id: string, name?: string) => void, 
  options: Person[],
  placeholder: string
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    if (valueId) {
      const p = options.find(o => o.id === valueId);
      if (p) {
        setSearchTerm(\`\${(p.lastName || '').toUpperCase()} \${p.firstName}\`);
      }
    } else {
      setSearchTerm('');
    }
  }, [valueId, options]);

  const filteredOptions = React.useMemo(() => {
    if (searchTerm.length < 3) return [];
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter(p => {
       const fullName = \`\${p.firstName} \${p.lastName}\`.toLowerCase();
       return fullName.includes(lowerSearch);
    });
  }, [searchTerm, options]);

  const handleSelect = (p: Person) => {
    onChange(p.id, p.lastName);
    setSearchTerm(\`\${(p.lastName || '').toUpperCase()} \${p.firstName}\`);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <input 
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          if (e.target.value === '') {
             onChange('');
          }
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
      />
      {isOpen && searchTerm.length >= 3 && filteredOptions.length > 0 && (
        <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {filteredOptions.map(p => {
             const birthYear = p.birthDate ? new Date(p.birthDate).getFullYear() : '?';
             return (
               <div 
                 key={p.id} 
                 className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                 onClick={() => handleSelect(p)}
               >
                 {(p.lastName || '').toUpperCase()} {p.firstName} ({birthYear})
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
};

export function AddPerson() {`;

code = code.replace("export function AddPerson() {", autocompleteCode);

// 2. Fix handleChange to uppercase lastName
code = code.replace(
  "const value = target.type === 'checkbox' ? target.checked : target.value;",
  \`const rawValue = target.type === 'checkbox' ? target.checked : target.value;
    const value = target.name === 'lastName' && typeof rawValue === 'string' ? rawValue.toUpperCase() : rawValue;\`
);

// 3. Remove old progress bar in photo section
const oldProgressStart = \`            {(loading && photoFile) && (\`;
const oldProgressEnd = \`            )}\`;

const photoProgressRegex = /\\{\\(loading && photoFile\\) && \\(\[\\s\\S\]*?Uploading: \\$\\{uploadProgress\\}%\\}\`\\}[\\s\\S]*?<\\/div>\\s*<\\/div>\\s*\\)\\}/;
code = code.replace(photoProgressRegex, '');

// 4. Replace Father, Mother, Spouse <select> with AutocompletePerson
const relationsRegex = /<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">[\s\S]*?(?=<\/div>\s*<div className="space-y-2">\s*<label className="text-sm font-medium text-text-primary">Notes<\/label>)/;

const newRelations = \`<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
            <AutocompletePerson
              label="Père (Father)"
              valueId={formData.parentId1}
              onChange={(id, lastName) => {
                setFormData(prev => ({ ...prev, parentId1: id }));
                if (id && lastName && !formData.lastName) {
                   setFormData(prev => ({ ...prev, lastName: lastName.toUpperCase() }));
                }
              }}
              options={persons.filter(p => p.gender === 'male' && p.id !== id)}
              placeholder="Saisissez au moins 3 lettres..."
            />
            <AutocompletePerson
              label="Mère (Mother)"
              valueId={formData.parentId2}
              onChange={(id) => setFormData(prev => ({ ...prev, parentId2: id }))}
              options={persons.filter(p => p.gender === 'female' && p.id !== id)}
              placeholder="Saisissez au moins 3 lettres..."
            />
            <AutocompletePerson
              label="Conjoint(e)"
              valueId={formData.spouseId}
              onChange={(id) => setFormData(prev => ({ ...prev, spouseId: id }))}
              options={persons.filter(p => (p.gender !== formData.gender || !p.gender) && p.id !== id)}
              placeholder="Saisissez au moins 3 lettres..."
            />
          </div>
          \`;

code = code.replace(relationsRegex, newRelations);

// 5. Replace bottom button area
const buttonRegex = /<div className="flex justify-end gap-4 pt-4 border-t border-border">[\s\S]*?(?=<\/form>)/;
const newButtons = \`<div className="pt-6 border-t border-border space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="w-full sm:w-1/3 h-12">Cancel</Button>
              <div className="flex-1 w-full relative">
                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold">
                  {loading ? 'Saving Person...' : 'Save Person'}
                </Button>
              </div>
            </div>
            {(loading || uploadProgress > 0) && (
              <div className="w-full space-y-1 text-center">
                <div className="text-xs font-semibold text-text-secondary">
                  {uploadProgress === 0 ? "Uploading photo..." : \`Photo Upload: \${uploadProgress}%\`}
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: \`\${uploadProgress}%\` }}></div>
                </div>
              </div>
            )}
          </div>
          \`;

code = code.replace(buttonRegex, newButtons);

fs.writeFileSync('src/pages/AddPerson.tsx', code);
