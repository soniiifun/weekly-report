const fs = require('fs');
let code = fs.readFileSync('src/components/ReportApp.tsx', 'utf8');

// Replace -calc(X * var(...)) with calc(-X * var(...))
code = code.replace(/-calc\(([0-9.]+)\s*\*/g, 'calc(-$1 *');

fs.writeFileSync('src/components/ReportApp.tsx', code);
console.log('Fixed invalid calc syntax');
