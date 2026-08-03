const fs = require('fs');
let code = fs.readFileSync('src/components/FloatingPhotoGalaxy.tsx', 'utf-8');

code = code.replace(
  "const containerSize = 440;\n  const actualSphereRadius = 180;\n  const baseImageSize = containerSize * 0.16;",
  `const [containerSize, setContainerSize] = useState(() => Math.min(window.innerWidth - 32, 440));

  useEffect(() => {
    const handleResize = () => {
      setContainerSize(Math.min(window.innerWidth - 32, 460));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const actualSphereRadius = Math.round(containerSize * 0.42);
  const baseImageSize = Math.round(containerSize * 0.16);`
);

code = code.replace(
  "className=\"relative select-none cursor-grab active:cursor-grabbing mx-auto my-4 overflow-hidden\"",
  "className=\"relative select-none cursor-grab active:cursor-grabbing w-full max-w-md mx-auto aspect-square flex items-center justify-center overflow-hidden\""
);

fs.writeFileSync('src/components/FloatingPhotoGalaxy.tsx', code);
