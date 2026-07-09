import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');

let updatedCount = 0;

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') walkDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      let newContent = content.replace(
        /from\s+['"]((?:\.\.\/)+)types['"]/g,
        "from '$1shared/types'"
      );
      newContent = newContent.replace(
        /from\s+['"]((?:\.\.\/)+)types\//g,
        "from '$1shared/types/"
      );
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf-8');
        console.log(`✓ Updated: ${path.relative(srcDir, fullPath)}`);
        updatedCount++;
      }
    }
  }
}

walkDir(srcDir);
console.log(`\n✅ Updated ${updatedCount} files`);