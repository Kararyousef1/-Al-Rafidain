"""
سكربت تشغيل fix_leave_requests_table.sql على Supabase
"""
import urllib.request
import urllib.error
import json
import os

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
    exit(1)

print(f"✅ Supabase URL: {supabase_url}")
print(f"✅ Service Key: {service_key[:20]}...")

# قراءة ملف SQL
sql_file = 'fix_leave_requests_table.sql'
if not os.path.exists(sql_file):
    print(f"❌ الملف {sql_file} غير موجود")
    exit(1)

with open(sql_file, 'r', encoding='utf-8') as f:
    sql_content = f.read()

print(f"📄 تم تحميل {sql_file} ({len(sql_content)} حرف)")

# تشغيل SQL عبر Supabase SQL API
project_ref = supabase_url.replace('https://', '').split('.')[0]
sql_endpoint = f"https://api.supabase.com/v1/projects/{project_ref}/sql"

headers = {
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
}

payload = json.dumps({"query": sql_content}).encode('utf-8')

print(f"\n🚀 جاري إرسال SQL إلى Supabase Management API...")
req = urllib.request.Request(sql_endpoint, data=payload, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req, timeout=180) as response:
        result = response.read().decode('utf-8')
        print(f"✅ تم تشغيل SQL بنجاح!")
        print(f"📝 {result[:1000]}")
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"❌ خطأ HTTP {e.code}: {error_body[:1000]}")
    print(f"\n⚠️  يرجى تشغيل fix_leave_requests_table.sql يدوياً من Supabase Dashboard → SQL Editor")
except Exception as e:
    print(f"❌ خطأ غير متوقع: {e}")

print("\n✨ انتهى")
