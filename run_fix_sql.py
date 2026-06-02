import urllib.request
import json
import os

# قراءة معلومات الاتصال من ملف .env.local
supabase_url = None
service_key = None

with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line.startswith('VITE_SUPABASE_URL='):
            supabase_url = line.split('=', 1)[1].strip()
        elif line.startswith('VITE_SUPABASE_SERVICE_KEY='):
            service_key = line.split('=', 1)[1].strip()

if not supabase_url or not service_key:
    print("❌ لم يتم العثور على VITE_SUPABASE_URL أو VITE_SUPABASE_SERVICE_KEY في .env.local")
    exit(1)

print(f"✅ وجدت رابط Supabase: {supabase_url}")
print(f"✅ وجدت مفتاح الخدمة: {service_key[:20]}...")

# دمج جميع ملفات SQL في SQL واحد
all_sql_files = [
    'fix_system_settings_rls.sql',
    'fix_profiles_users.sql',
    'schema.sql',
]

combined_sql = ""
for sql_file in all_sql_files:
    if os.path.exists(sql_file):
        with open(sql_file, 'r', encoding='utf-8') as f:
            content = f.read()
            combined_sql += f"\n\n-- ====== {sql_file} ======\n\n" + content
            print(f"📄 تم تحميل: {sql_file} ({len(content)} حرف)")

# SQL إضافي: إضافة مستخدمين تجريبيين حقيقيين
seed_users_sql = """
-- ====== المستخدمون التجريبيون ======
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role_id)
SELECT * FROM (VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@kayan.hr', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"مدير النظام"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', 'hr@kayan.hr', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"مسؤول الموارد البشرية"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', 'employee@kayan.hr', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"موظف"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000004', 'gatekeeper@kayan.hr', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"مسؤول البوابة"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000005', 'dev@kayan.hr', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"مطور النظام"}', false, 'authenticated')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email LIKE '%@kayan.hr');

-- إدراج البروفايلات للمستخدمين التجريبيين
INSERT INTO public.profiles (id, full_name, email, role, department, position, phone, status, rank, manufacturing_dept, created_at, updated_at)
SELECT * FROM (VALUES
  ('00000000-0000-0000-0000-000000000001', 'مدير النظام', 'admin@kayan.hr', 'admin', 'الإدارة', 'مدير نظام', '0770000001', 'active', 'executive', 'management', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'مسؤول الموارد البشرية', 'hr@kayan.hr', 'hr', 'الموارد البشرية', 'مسؤول موارد بشرية', '0770000002', 'active', 'manager', 'management', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'موظف', 'employee@kayan.hr', 'employee', 'الإنتاج', 'مشغل آلات', '0770000003', 'active', 'employee', 'syrups', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'مسؤول البوابة', 'gatekeeper@kayan.hr', 'gatekeeper', 'الأمن', 'حارس أمن', '0770000004', 'active', 'employee', 'management', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'مطور النظام', 'dev@kayan.hr', 'developer', 'تقنية المعلومات', 'مطور نظام', '0770000005', 'active', 'employee', 'management', NOW(), NOW())
) AS v
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email LIKE '%@kayan.hr')
ON CONFLICT (id) DO NOTHING;

-- إدراج إعدادات الصفحة الرئيسية (مهم لإيقاف أخطاء 404)
INSERT INTO public.system_settings (id, landing_config, general_settings, ai_settings, updated_at)
VALUES ('singleton', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;
"""

combined_sql += "\n\n" + seed_users_sql

print(f"\n📦 SQL الكلي: {len(combined_sql)} حرف")

# استخدام Management API عبر REST
project_ref = supabase_url.replace('https://', '').split('.')[0]
sql_endpoint = f"https://api.supabase.com/v1/projects/{project_ref}/sql"

headers = {
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
}

payload = json.dumps({"query": combined_sql}).encode('utf-8')

print(f"\n🚀 جاري إرسال SQL إلى Supabase Management API...")
req = urllib.request.Request(sql_endpoint, data=payload, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req, timeout=180) as response:
        result = response.read().decode('utf-8')
        print(f"✅ تم تشغيل SQL بنجاح!")
        print(f"📝 {result[:500]}")
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"❌ خطأ HTTP {e.code}: {error_body[:500]}")
    
    # محاولة بديلة: استخدام Management API /sql مباشرة
    print("\n🔄 محاولة الطريقة البديلة...")
    
    alt_headers = {
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
    }
    
    alt_payload = json.dumps({"query": combined_sql}).encode('utf-8')
    alt_req = urllib.request.Request(sql_endpoint, data=alt_payload, headers=alt_headers, method='POST')
    
    try:
        with urllib.request.urlopen(alt_req, timeout=180) as alt_resp:
            alt_result = alt_resp.read().decode('utf-8')
            print(f"✅ الطريقة البديلة نجحت!")
            print(f"📝 {alt_result[:500]}")
    except urllib.error.HTTPError as e2:
        print(f"\n❌ لم نتمكن من تشغيل SQL تلقائياً.")
        print(f"❌ الخطأ: {e2.code} - {e2.read().decode('utf-8')[:200]}")
        print(f"\n⚠️  يرجى تشغيل ملف fix_system_settings_rls.sql يدوياً من Supabase Dashboard → SQL Editor")
        print(f"   ثم من Application → إدارة المستخدمين → إضافة زر 'إنشاء مستخدمين تجريبيين'")
except Exception as e:
    print(f"❌ خطأ غير متوقع: {e}")

print("\n✨ انتهى")