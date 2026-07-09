import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');

// Mapping: old lib path -> new services path (relative to src/)
const LIB_TO_SERVICE = {
  'lib/supabase':       'services/supabase',
  'lib/supabase/client':'services/supabase/client',
  'lib/supabaseAdmin':  'services/supabase/supabaseAdmin',
  'lib/errors':         'services/errors',
  'lib/utils':          'services/utils',
  'lib/aiService':      'services/ai/aiService',
  'lib/quizAiService':  'services/ai/quizAiService',
  'lib/notificationManager':  'services/notifications/notificationManager',
  'lib/notificationService':  'services/notifications/notificationService',
  'lib/notificationHelpers':  'services/notifications/notificationHelpers',
  'lib/useNotificationIntegration': 'services/notifications/useNotificationIntegration',
  'lib/attendanceNotificationService': 'services/notifications/attendanceNotificationService',
  'lib/securityService': 'services/security/securityService',
  'lib/devPinService':  'services/security/devPinService',
  'lib/leaveAttendanceLink': 'services/integrations/leaveAttendanceLink',
};

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

// Step 1: Revert all 'services/xxx' back to 'lib/xxx' for paths that are wrong
function revertWrongPaths(content) {
  // Match: from '...services/xxx' where xxx is not a correct path
  // We'll revert services/ back to lib/ only for specific patterns
  return content.replace(
    /from\s+['"]((?:\.\.\/)+)services\//g,
    (match, prefix) => `from '${prefix}lib/`
  ).replace(
    /from\s+['"]((?:\.\.\/)+)services['"]/g,
    (match, prefix) => `from '${prefix}lib'`
  );
}

let allFiles = walkDir(srcDir);
let revertedCount = 0;

// Step 1: Revert all services paths back to lib
for (const filePath of allFiles) {
  const relPath = path.relative(srcDir, filePath);
  // Skip files already in services/
  if (relPath.startsWith('services')) continue;
  if (relPath.startsWith('node_modules') || relPath.startsWith('dist')) continue;

  const content = fs.readFileSync(filePath, 'utf-8');
  const newContent = revertWrongPaths(content);

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`↩ Reverted: ${relPath}`);
    revertedCount++;
  }
}

console.log(`\nStep 1 complete: Reverted ${revertedCount} files\n`);

// Step 2: Now apply correct mapping from lib/ -> services/xxx/
let updatedCount = 0;

for (const filePath of allFiles) {
  const relPath = path.relative(srcDir, filePath);
  if (relPath.startsWith('services')) continue;
  if (relPath.startsWith('node_modules') || relPath.startsWith('dist')) continue;

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Apply each mapping in order (longest first to avoid partial matches)
  const sortedKeys = Object.keys(LIB_TO_SERVICE).sort((a, b) => b.length - a.length);

  for (const oldPath of sortedKeys) {
    const newPath = LIB_TO_SERVICE[oldPath];
    
    // Calculate depth of current file to build correct relative path
    const depth = relPath.split(path.sep).length - 1; // 0 = src root
    const upDirs = '../'.repeat(depth);
    
    // Build the old relative import pattern
    const oldImportPattern = new RegExp(
      `from\\s+['"]${upDirs}${oldPath.replace(/\//g, '\\/')}['"]`,
      'g'
    );
    const newImportValue = `${upDirs}${newPath}`;

    content = content.replace(oldImportPattern, `from '${newImportValue}'`);
    
    // Also try with trailing slash pattern for nested imports
    const oldImportSlashPattern = new RegExp(
      `from\\s+['"]${upDirs}${oldPath.replace(/\//g, '\\/')}\\/`,
      'g'
    );
    content = content.replace(oldImportSlashPattern, `from '${newImportValue}/`);
  }

  if (content !== fs.readFileSync(filePath, 'utf-8')) {
    // Actually write if changed
    const oldContent = fs.readFileSync(filePath, 'utf-8');
    // Double-check there's a real change
    if (content !== oldContent) {
      console.log(`✓ Fixed: ${relPath}`);
      updatedCount++;
    }
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

console.log(`\nStep 2 complete: Updated ${updatedCount} files`);

// Step 3: Verify no remaining lib references (should be all converted now)
console.log('\nStep 3: Verification...');
let remainingLibRefs = 0;
for (const filePath of allFiles) {
  const relPath = path.relative(srcDir, filePath);
  if (relPath.startsWith('services')) continue;
  if (relPath.startsWith('node_modules') || relPath.startsWith('dist')) continue;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const libRefs = content.match(/from\s+['"].*\/lib['"]|from\s+['"].*\/lib\//);
  if (libRefs) {
    console.log(`⚠ Still has lib ref: ${relPath} -> ${libRefs[0]}`);
    remainingLibRefs++;
  }
}

console.log(`\nRemaining lib references: ${remainingLibRefs}`);