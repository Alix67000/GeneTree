const fs = require('fs');

let code = fs.readFileSync('app/applet/src/pages/AddPerson.tsx', 'utf-8');

// 1. Add import for COUNTRIES_WITH_FLAGS if not present
if (!code.includes("COUNTRIES_WITH_FLAGS")) {
  code = code.replace(
    "import { Card } from '@/components/ui/Card';",
    "import { Card } from '@/components/ui/Card';\nimport { COUNTRIES_WITH_FLAGS } from '@/lib/countries';"
  );
}

// 2. Add list="countries-list" and placeholder to birthPlace input
if (!code.includes('name="birthPlace" list="countries-list"')) {
  code = code.replace(
    'name="birthPlace"',
    'name="birthPlace"\n                list="countries-list"\n                placeholder="e.g. 🇮🇷 Iran, 🇫🇷 France"'
  );
}

// 3. Add list="countries-list" and placeholder to deathPlace input
if (!code.includes('name="deathPlace" list="countries-list"')) {
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

fs.writeFileSync('app/applet/src/pages/AddPerson.tsx', code);
console.log('Successfully updated AddPerson.tsx with country autocomplete.');
