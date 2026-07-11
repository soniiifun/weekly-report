const fs = require('fs');
let code = fs.readFileSync('src/components/ReportApp.tsx', 'utf8');

// Replace container-type
code = code.replace(/container-type:\s*inline-size;/g, '/* removed container-type */');

// Remove backdrop-filter
code = code.replace(/backdrop-filter:\s*blur\([^)]+\);/g, '/* removed backdrop-filter */');
code = code.replace(/backdropFilter:\s*'blur\([^)]+\)',/g, '/* removed backdrop-filter */');

// Add fullscreen class
code = code.replace(/className="report-preview-container"/g, 'className={`report-preview-container ${isWebFullscreen ? "fullscreen-mode" : ""}`}');

// Add CSS variables to style block
const cssVarBlock = `
          :root { --cqi-unit: 0.45vw; }
          .fullscreen-mode { --cqi-unit: 0.95vw; }
          @media (max-width: 1024px) { :root { --cqi-unit: 0.9vw; } }
          
          .slides-container { display: flex; flex-direction: column; gap: 2rem; }
`;
code = code.replace(/\.slides-container { display: flex; flex-direction: column; gap: 2rem; }/g, cssVarBlock);

// Replace Xcqi with calc(X * var(--cqi-unit))
code = code.replace(/([0-9.]+)cqi/g, 'calc($1 * var(--cqi-unit))');

fs.writeFileSync('src/components/ReportApp.tsx', code);
console.log('Fixed cqi with vw approach');
