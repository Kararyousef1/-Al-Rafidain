import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');

// Mapping of wrong -> correct paths (relative to src/)
const FIXES = [
  // Supabase
  { from: /services\/supabase['"]/g, to: "services/supabase/supabase'" },
  // Notifications
  { from: /services\/notificationService['"]/g, to: "services/notifications/notificationService'" },
  { from: /services\/notificationManager['"]/g, to: "services/notifications/notificationManager'" },
  { from: /services\/notificationHelpers['"]/g, to: "services/notifications/notificationHelpers'" },
  { from: /services\/attendanceNotificationService['"]/g, to: "services/notifications/attendanceNotificationService'" },
  { from: /services\/useNotificationIntegration['"]/g, to: "services/notifications/useNotificationIntegration'" },
  // Security
  { from: /services\/securityService['"]/g, to: "services/security/securityService'" },
  { from: /services\/devPinService['"]/g, to: "services/security/devPinService'" },
  // AI
  { from: /services\/aiService['"]/g, to: "services/ai/aiService'" },
  { from: /services\/quizAiService['"]/g, to: "services/ai/quizAiService'" },
  // Integrations
  { from: /services\/leaveAttendanceLink['"]/g, to: "services/integrations/leaveAttendanceLink'" },
  // Root services
  { from: /services\/errors['"]/g, to: "services/errors'" },
  { from: /services\/utils['"]/g, to: "services/utils'" },
];

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
let fixedCount = 0;

for (const filePath of allFiles) {
  const relPath = path.relative(srcDir, filePath);
  if (relPath.startsWith('services')) continue; // Skip files already in services/
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  
  for (const fix of FIXES) {
    content = content.replace(fix.from, fix.to);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed: ${relPath}`);
    fixedCount++;
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);

// Verify
console.log('\nVerification: checking for remaining wrong paths...');
let remaining = 0;
for (const filePath of allFiles) {
  const relPath = path.relative(srcDir, filePath);
  if (relPath.startsWith('services')) continue;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const fix of FIXES) {
    if (fix.from.test(content)) {
      console.log(`⚠ ${relPath} still has: ${fix.from}`);
      remaining++;
    }
  }
}
console.log(`\nRemaining wrong paths: ${remaining}`);