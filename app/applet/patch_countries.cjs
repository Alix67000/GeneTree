const fs = require('fs');

let code = fs.readFileSync('src/pages/AddPerson.tsx', 'utf-8');

// 1. Add import if not present
if (!code.includes("COUNTRIES_WITH_FLAGS")) {
  code = code.replace(
    "import { Card } from '@/components/ui/Card';",
    "import { Card } from '@/components/ui/Card';\nimport { COUNTRIES_WITH_FLAGS } from '@/lib/countries';"
  );
}

// 2. Add list="countries-list" to birthPlace input
code = code.replace(
  `name="birthPlace"\n                   value={formData.birthPlace}`,
  `name="birthPlace"\n                   list="countries-list"\n                   value={formData.birthPlace}`
);

// Also handle single line or different formatting for birthPlace
code = code.replace(
  `name="birthPlace" value={formData.birthPlace}`,
  `name="birthPlace" list="countries-list" value={formData.birthPlace}`
);

// 3. Add list="countries-list" to deathPlace input
code = code.replace(
  `name="deathPlace"\n                   value={formData.deathPlace}`,
  `name="deathPlace"\n                   list="countries-list"\n                   value={formData.deathPlace}`
);
code = code.replace(
  `name="deathPlace" value={formData.deathPlace}`,
  `name="deathPlace" list="countries-list" value={formData.deathPlace}`
);

// 4. Add datalist before </form>
if (!code.includes("countries-list")) {
  const target = "</form>";
  const datalistCode = `
      <datalist id="countries-list">
        {COUNTRIES_WITH_FLAGS.map(c => (
          <option key={c.code} value={\`\${c.flag} \${c.name}\`} />
        ))}
      </datalist>
    </form>`;
  code = code.replace(target, datalistCode);
}

fs.writeFileSync('src/pages/AddPerson.tsx', code);
console.log('Successfully patched AddPerson.tsx');
