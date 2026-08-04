const fs = require('fs');

let code = fs.readFileSync('src/pages/AddPerson.tsx', 'utf-8');

// 1. Add import for COUNTRIES_WITH_FLAGS if not present
if (!code.includes("COUNTRIES_WITH_FLAGS")) {
  code = code.replace(
    "import { Card } from '@/components/ui/Card';",
    "import { Card } from '@/components/ui/Card';\nimport { COUNTRIES_WITH_FLAGS } from '@/lib/countries';"
  );
}

// 2. Add list="countries-list" and placeholder to birthPlace input
const birthPlaceTarget = `<input 
                type="text" 
                name="birthPlace" 
                value={formData.birthPlace} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />`;

const birthPlaceReplacement = `<input 
                type="text" 
                name="birthPlace" 
                list="countries-list"
                value={formData.birthPlace} 
                onChange={handleChange}
                placeholder="e.g. 🇮🇷 Iran, 🇫🇷 France"
                className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />`;

if (code.includes(birthPlaceTarget)) {
  code = code.replace(birthPlaceTarget, birthPlaceReplacement);
} else {
  // fallback search & replace
  code = code.replace(
    'name="birthPlace"',
    'name="birthPlace"\n                list="countries-list"\n                placeholder="e.g. 🇮🇷 Iran, 🇫🇷 France"'
  );
}

// 3. Add list="countries-list" and placeholder to deathPlace input
const deathPlaceTarget = `<input 
                  type="text" 
                  name="deathPlace" 
                  value={formData.deathPlace} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />`;

const deathPlaceReplacement = `<input 
                  type="text" 
                  name="deathPlace" 
                  list="countries-list"
                  value={formData.deathPlace} 
                  onChange={handleChange}
                  placeholder="e.g. 🇮🇷 Iran, 🇫🇷 France"
                  className="w-full px-4 py-2 rounded-[var(--radius-button)] border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />`;

if (code.includes(deathPlaceTarget)) {
  code = code.replace(deathPlaceTarget, deathPlaceReplacement);
} else {
  code = code.replace(
    'name="deathPlace"',
    'name="deathPlace"\n                  list="countries-list"\n                  placeholder="e.g. 🇮🇷 Iran, 🇫🇷 France"'
  );
}

// 4. Add datalist before </form> if not present
if (!code.includes("countries-list")) {
  code = code.replace(
    "</form>",
    `  <datalist id="countries-list">
    {COUNTRIES_WITH_FLAGS.map(c => (
      <option key={c.code} value={\`\${c.flag} \${c.name}\`} />
    ))}
  </datalist>
</form>`
  );
}

fs.writeFileSync('src/pages/AddPerson.tsx', code);
console.log('Successfully updated AddPerson.tsx with country autocomplete.');
