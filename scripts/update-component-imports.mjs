import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');
const componentsDir = path.join(srcDir, 'components');
const isDryRun = process.argv.includes('--dry-run');

const files = [];
function findFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findFiles(full);
    else if ((entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) && !entry.name.endsWith('.d.ts')) {
      files.push(full);
    }
  }
}

findFiles(srcDir);

// يطابق: from (any path ending with components/(ui|notifications)/...)
const importRegex = /from\s+(['"])((?:\.{1,2}\/)*components\/(ui|notifications)\/[^'"]*)\1/g;

let filesUpdated = 0;
let importsFixed = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const fileDir = path.dirname(file);

  const updated = original.replace(importRegex, (match, quote, fullSpecifier) => {
    const parts = fullSpecifier.split('/');
    const subfolder = parts.includes('ui') ? 'ui' : 'notifications';
    const compIndex = parts.lastIndexOf('components');
    const afterComponents = parts.slice(compIndex + 2).join('/');
    
    const targetAbsPath = path.join(componentsDir, subfolder, afterComponents);
    let relPath = path.relative(fileDir, targetAbsPath).replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath;

    const newSpecifier = `from ${quote}${relPath}${quote}`;
    if (newSpecifier !== match) importsFixed++;
    return newSpecifier;
  });

  if (updated !== original) {
    if (!isDryRun) fs.writeFileSync(file, updated);
    filesUpdated++;
    console.log(isDryRun ? '[dry-run] would update:' : 'Updated:', path.relative(srcDir, file));
  }
}

console.log(`\n${isDryRun ? '[dry-run] ' : ''}Total files updated: ${filesUpdated}, imports fixed: ${importsFixed}`);