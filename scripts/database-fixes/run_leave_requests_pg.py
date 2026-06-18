"""
تشغيل fix_leave_requests_table.sql على Supabase باستخدام pg library
"""
import subprocess
import sys
import os

# التحقق من تثبيت pg
try:
    import psycopg2
except ImportError:
    print("⚠️ psycopg2 غير مثبت. جاري التثبيت...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "--quiet"])
    import psycopg2

# قراءة معلومات الاتصال
supabase_url = None
service_key = None

for env_file in ['.env.local', '.env']:
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('VITE_SUPABASE_URL='):
                    supabase_url = line.split('=', 1)[1].strip()
                elif line.startswith('VITE_SUPABASE_SERVICE_KEY='):
                    service_key = line.split('=', 1)[1].strip()
        if supabase_url and service_key:
            break

if not supabase_url or not service_key:
    print("❌ لم يتم العثور على VITE_SUPABASE_URL أو VITE_SUPABASE_SERVICE_KEY")
    sys.exit(1)

# استخراج project_ref
project_ref = supabase_url.replace('https://', '').split('.')[0]
print(f"✅ Project: {project_ref}")

# محاولة الاتصال بـ Supabase Postgres
# في Supabase، الـ service_role key JWT يعمل كـ password عند استخدام connection pooling
# Connection string format: postgresql://postgres.[project_ref]:[password]@[region].pooler.supabase.com:6543/postgres
regions = ['aws-0-us-east-1', 'aws-0-eu-west-1', 'aws-0-us-west-1', 'aws-0-ap-southeast-1']
sql_file = 'fix_leave_requests_table.sql'

if not os.path.exists(sql_file):
    print(f"❌ الملف {sql_file} غير موجود")
    sys.exit(1)

with open(sql_file, 'r', encoding='utf-8') as f:
    sql_content = f.read()

print(f"📄 تم تحميل {sql_file} ({len(sql_content)} حرف)")

# محاولة الاتصال عبر PgBouncer (port 6543)
for region in regions:
    print(f"\n🔄 محاولة الاتصال عبر {region}...")
    try:
        conn = psycopg2.connect(
            host=f"{region}.pooler.supabase.com",
            port=6543,
            dbname="postgres",
            user=f"postgres.{project_ref}",
            password=service_key,
            sslmode="require",
            connect_timeout=10
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(sql_content)
        print(f"✅ نجح الاتصال عبر {region}!")
        print("✅ تم تنفيذ SQL بنجاح!")
        cur.close()
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"❌ فشل: {str(e)[:200]}")
        continue

# محاولة الاتصال المباشر (port 5432)
print("\n🔄 محاولة الاتصال المباشر (port 5432)...")
for region in regions:
    try:
        conn = psycopg2.connect(
            host=f"{region}.supabase.com",
            port=5432,
            dbname="postgres",
            user="postgres",
            password=service_key,
            sslmode="require",
            connect_timeout=10
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(sql_content)
        print(f"✅ نجح الاتصال المباشر!")
        cur.close()
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"❌ فشل: {str(e)[:200]}")
        continue

print("\n❌ لم نتمكن من الاتصال بـ Supabase تلقائياً.")
print("\n📋 يرجى تشغيل fix_leave_requests_table.sql يدوياً:")
print("   1. افتح https://supabase.com/dashboard")
print(f"   2. اختر المشروع: {project_ref}")
print("   3. اذهب إلى SQL Editor")
print("   4. الصق محتوى fix_leave_requests_table.sql")
print("   5. اضغط Run")
