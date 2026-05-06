import fs from 'fs';

const filePath = 'src/components/AdminPortal.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Line 3890 (0-indexed 3889) is the garbage line
// But let's be more robust: find the line starting with wAARCAA7ADsDASIAAhEBAxEB
const newLines = lines.filter(line => !line.includes('wAARCAA7ADsDASIAAhEBAxEB'));

fs.writeFileSync(filePath, newLines.join('\n'));
console.log('Fixed AdminPortal.tsx');
