// Node.js script to run SQL on Supabase using postgres.js
// الاستخدام: node run_sql_node.mjs <sql_file>
import { readFileSync } from 'fs';
import pg from 'pg';

const { Client } = pg;

const envFile = readFileSync('.env.local', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envFile.match(/VITE_SUPABASE_SERVICE_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.error('❌ لم يتم العثور على VITE_SUPABASE_URL أو VITE_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const serviceKey = keyMatch[1].trim();
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

console.log(`✅ Project: ${projectRef}`);

// محاولة الاتصال المباشر بـ Supabase
// الـ service_role JWT لا يعمل كـ Postgres password، نحتاج إلى database password
// لكن يمكن تجربة...

const tryConnect = async (connStr, label) => {
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log(`✅ نجح الاتصال: ${label}`);
    return client;
  } catch (e) {
    console.log(`❌ فشل ${label}: ${e.message.slice(0, 150)}`);
    return null;
  }
};

const regions = ['us-east-1', 'eu-west-1', 'us-west-1', 'ap-southeast-1'];
let client = null;

for (const region of regions) {
  client = await tryConnect(
    `postgresql://postgres.${projectRef}:${serviceKey}@${region}.pooler.supabase.com:6543/postgres`,
    `pooler ${region}`
  );
  if (client) break;
}

if (!client) {
  console.log('\n⚠️  تعذر الاتصال التلقائي. الـ service_role JWT لا يعمل كـ Postgres password.');
  console.log('📋 يرجى تشغيل fix_leave_requests_table.sql يدوياً من Supabase Dashboard → SQL Editor');
  process.exit(1);
}

const sqlFile = process.argv[2] || 'fix_leave_requests_table.sql';
const sql = readFileSync(sqlFile, 'utf-8');

console.log(`📄 تنفيذ ${sqlFile} (${sql.length} حرف)...`);

try {
  await client.query(sql);
  console.log('✅ تم تنفيذ SQL بنجاح!');
} catch (e) {
  console.error('❌ خطأ في تنفيذ SQL:', e.message);
} finally {
  await client.end();
}
