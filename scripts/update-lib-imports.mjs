import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src', 'services');

// Map of target folders and their depth from src/
const folderDepth = {
  'ai': 2,
  'notifications': 2,
  'security': 2,
  'supabase': 2,
  'integrations': 2,
  '': 1, // root of services
};

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
      let newContent = content;

      // Determine depth: relative path from services/ to the file
      const relPath = path.relative(srcDir, fullPath);
      const parts = relPath.split(path.sep);
      const depth = parts.length; // 1 = root, 2 = subfolder

      // Replace: from '../lib/...' -> from '../services/...' (for files still in lib)
      // But we're updating files IN services, so we need to fix their internal imports
      
      // For files in services/notifications/ (depth 2):
      // '../core/' -> '../../core/'
      // '../types/' -> '../../shared/types/'
      // '../sdk/' -> '../../sdk/'
      // '../lib/' -> '../' (since lib is at same level as services)
      
      if (depth === 2) {
        // File is in a subfolder like services/notifications/
        newContent = newContent.replace(
          /from\s+['"]\.\.\/core\//g,
          "from '../../core/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/shared\//g,
          "from '../../shared/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/sdk\//g,
          "from '../../sdk/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/types\//g,
          "from '../../shared/types/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/types['"]/g,
          "from '../../shared/types'"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/lib\//g,
          "from '../"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/utils\//g,
          "from '../../utils/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/hooks\//g,
          "from '../../shared/hooks/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/constants\//g,
          "from '../../core/constants/"
        );
      } else if (depth === 1) {
        // File is in services/ root
        newContent = newContent.replace(
          /from\s+['"]\.\.\/core\//g,
          "from '../core/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/shared\//g,
          "from '../shared/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/sdk\//g,
          "from '../sdk/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/types\//g,
          "from '../shared/types/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/types['"]/g,
          "from '../shared/types'"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/lib\//g,
          "from './"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/utils\//g,
          "from '../utils/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/hooks\//g,
          "from '../shared/hooks/"
        );
        newContent = newContent.replace(
          /from\s+['"]\.\.\/constants\//g,
          "from '../core/constants/"
        );
      }

      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf-8');
        console.log(`✓ Updated: ${path.relative(path.join(__dirname, '..', 'src'), fullPath)}`);
        updatedCount++;
      }
    }
  }
}

walkDir(srcDir);
console.log(`\n✅ Updated ${updatedCount} files`);