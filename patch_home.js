const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

code = code.replace(
  "import { BirthdaysWidget } from '@/components/BirthdaysWidget';",
  "import { BirthdaysWidget } from '@/components/BirthdaysWidget';\nimport { FloatingPhotoGalaxy } from '@/components/FloatingPhotoGalaxy';"
);

// We can remove the useMemo logic in Home.tsx since we moved it to FloatingPhotoGalaxy
code = code.replace(
  /const { mosaicPersons, withPhotoCount } = useMemo\(\(\) => {[\s\S]*?}, \[persons\]\);/,
  ''
);

code = code.replace(
  /\{mosaicPersons\.length > 0 && \([\s\S]*?\}\)/,
  '<FloatingPhotoGalaxy />'
);

fs.writeFileSync('src/pages/Home.tsx', code);
