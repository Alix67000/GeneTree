const fs = require('fs');

let code = fs.readFileSync('src/pages/AddPerson.tsx', 'utf-8');

// 1. Add import
if (!code.includes("AutocompletePerson")) {
  code = code.replace(
    "import { Button } from '@/components/ui/Button';",
    "import { Button } from '@/components/ui/Button';\nimport { AutocompletePerson } from '@/components/AutocompletePerson';"
  );
}

// 2. Fix handleChange
code = code.replace(
  "const value = target.type === 'checkbox' ? target.checked : target.value;",
  "const rawValue = target.type === 'checkbox' ? target.checked : target.value;\n    const value = target.name === 'lastName' && typeof rawValue === 'string' ? rawValue.toUpperCase() : rawValue;"
);

// 3. Remove old progress bar
const oldProgressStart = "{(loading && photoFile) && (";
const oldProgressEnd = "</div>\n            )}";
const startIdx = code.indexOf(oldProgressStart);
if (startIdx !== -1) {
  const nextClosingDiv = code.indexOf(oldProgressEnd, startIdx);
  if (nextClosingDiv !== -1) {
    code = code.substring(0, startIdx) + code.substring(nextClosingDiv + oldProgressEnd.length);
  }
}

// 4. Replace Father, Mother, Spouse
const relationsStart = '<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">';
const relationsEnd = '<div className="space-y-2">\n            <label className="text-sm font-medium text-text-primary">Notes</label>';

const newRelations = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
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

          `;

const rStartIdx = code.indexOf(relationsStart);
if (rStartIdx !== -1) {
  const rEndIdx = code.indexOf(relationsEnd);
  if (rEndIdx !== -1) {
    code = code.substring(0, rStartIdx) + newRelations + code.substring(rEndIdx);
  }
}

// 5. Replace bottom button area
const buttonStart = '<div className="flex justify-end gap-4 pt-4 border-t border-border">';
const buttonEnd = '</form>';

const newButtons = `<div className="pt-6 border-t border-border space-y-4">
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
        `;

const bStartIdx = code.indexOf(buttonStart);
if (bStartIdx !== -1) {
  const bEndIdx = code.indexOf(buttonEnd);
  if (bEndIdx !== -1) {
    code = code.substring(0, bStartIdx) + newButtons + code.substring(bEndIdx);
  }
}

fs.writeFileSync('src/pages/AddPerson.tsx', code);
