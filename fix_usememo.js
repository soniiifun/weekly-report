const fs = require('fs');
let code = fs.readFileSync('src/components/ReportApp.tsx', 'utf8');

const useMemoStart = code.indexOf('{React.useMemo(() => {');
if (useMemoStart === -1) throw new Error('useMemo not found');

const useMemoEndString = '}, [deferredData, viewMode, isDarkMode])}';
const useMemoEnd = code.indexOf(useMemoEndString, useMemoStart);
if (useMemoEnd === -1) throw new Error('useMemo end not found');

const useMemoBlock = code.substring(useMemoStart + 1, useMemoEnd + useMemoEndString.length - 1); 

let firstPart = code.substring(0, useMemoStart);
let lastPart = code.substring(useMemoEnd + useMemoEndString.length);

code = firstPart + '{previewContent}' + lastPart;

const reportAppStart = code.indexOf('export default function ReportApp');
const isMountedIndex = code.indexOf('if (!isLoaded) return null;', reportAppStart);
if (isMountedIndex === -1) throw new Error('isLoaded not found');

code = code.substring(0, isMountedIndex) + `const previewContent = ${useMemoBlock};\n\n  ` + code.substring(isMountedIndex);

fs.writeFileSync('src/components/ReportApp.tsx', code);
console.log('Fixed useMemo successfully');
