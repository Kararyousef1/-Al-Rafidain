import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');

let totalUpdated = 0;
let totalFiles = 0;

function walkDir(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(walkDir(fullPath));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = walkDir(srcDir);

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  let changed = false;

  // Calculate relative depth from file to src/
  const relPath = path.relative(srcDir, filePath);
  const depth = relPath.split(path.sep).length - 1; // 0 = src root, 1 = subfolder, etc.
  
  const up = '../'.repeat(depth);
  const upOneMore = '../'.repeat(depth + 1);

  // Skip files that are already in services/ - they were handled by the first script
  if (relPath.startsWith('services')) continue;

  // Replace patterns:
  // from '../lib/xxx' -> from '../services/xxx'
  // from 'lib/xxx' -> from 'services/xxx'
  
  // 1. Relative paths: from '../lib/' -> from '../services/'
  newContent = newContent.replace(
    /from\s+['"]((?:\.\.\/)+)lib\//g,
    (match, prefix) => `from '${prefix}services/`
  );
  
  // 2. from '../lib' -> from '../services'
  newContent = newContent.replace(
    /from\s+['"]((?:\.\.\/)+)lib['"]/g,
    (match, prefix) => `from '${prefix}services'`
  );

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✓ ${relPath}`);
    totalUpdated++;
  }
  totalFiles++;
}

console.log(`\n✅ Updated ${totalUpdated} files out of ${totalFiles} total files`);