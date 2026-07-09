import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');

const WRONG_TO_CORRECT = {
  'services/supabase': 'services/supabase/supabase',
  'services/notificationService': 'services/notifications/notificationService',
  'services/notificationManager': 'services/notifications/notificationManager',
  'services/notificationHelpers': 'services/notifications/notificationHelpers',
  'services/attendanceNotificationService': 'services/notifications/attendanceNotificationService',
  'services/useNotificationIntegration': 'services/notifications/useNotificationIntegration',
  'services/securityService': 'services/security/securityService',
  'services/devPinService': 'services/security/devPinService',
  'services/aiService': 'services/ai/aiService',
  'services/quizAiService': 'services/ai/quizAiService',
  'services/leaveAttendanceLink': 'services/integrations/leaveAttendanceLink',
};

function walkDir(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git' && !file.startsWith('services')) {
        results = results.concat(walkDir(fullPath));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = walkDir(srcDir);
let fixedCount = 0;

// Sort by longest path first to avoid partial replacements
const sortedKeys = Object.keys(WRONG_TO_CORRECT).sort((a, b) => b.length - a.length);

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  for (const wrong of sortedKeys) {
    const correct = WRONG_TO_CORRECT[wrong];
    // Match any relative path ending with the wrong path
    const regex = new RegExp(`(from\\s+['"](?:\\.\\.\\/)*)${wrong.replace(/\//g, '\\/')}(['"])`, 'g');
    const newContent = content.replace(regex, `$1${correct}$2`);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    const rel = path.relative(srcDir, filePath);
    console.log(`✓ Fixed: ${rel}`);
    fixedCount++;
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);

// Final verification
console.log('\n--- Final Verification ---');
let remaining = 0;
for (const wrong of sortedKeys) {
  const regex = new RegExp(wrong.replace(/\//g, '\\/'), 'g');
  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (regex.test(content)) {
      const rel = path.relative(srcDir, filePath);
      console.log(`⚠ ${rel} still has: ${wrong}`);
      remaining++;
    }
  }
}
console.log(`\nRemaining wrong paths: ${remaining}`);