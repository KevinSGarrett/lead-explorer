import fs from 'fs'; import path from 'path';
const png = process.argv[2] || 'design/uizard/Demo.png';
const base = path.basename(png, path.extname(png));
fs.mkdirSync('generated/uizard', { recursive: true });
fs.writeFileSync(`generated/uizard/${base}.tsx`,
`export default function ${base.replace(/[^A-Za-z0-9]/g,'_')}(){return <div>Generated from ${base}</div>;}`);
console.log('wrote', `generated/uizard/${base}.tsx`);
