-- ============================================
-- إضافة خيار 'developer' إلى ENUM user_role
-- هذا يختلف عن CHECK constraint - هو ALTER TYPE
-- ============================================

-- الخطوة 1: فحص نوع العمود الحالي
SELECT data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'role';

-- إذا كان 'USER-DEFINED' (أي ENUM)، نفذ:
-- إضافة قيمة 'developer' إلى الـ ENUM
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer';

-- إذا كان 'text' أو 'varchar' (وليس ENUM)، نفذ هذا بدلاً من ذلك:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check_dev
--   CHECK (role IN ('employee', 'hr', 'admin', 'gatekeeper', 'developer', 'supervisor', 'manager'));

-- الخطوة 2: إضافة حقل is_developer للتمييز السهل
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_developer BOOLEAN DEFAULT FALSE;

-- الخطوة 3: تعيين is_developer = true لأي مستخدم developer
UPDATE profiles SET is_developer = true WHERE role = 'developer' AND is_developer = false;

-- الخطوة 4: منح الصلاحيات الافتراضية لأي مستخدم developer موجود
UPDATE profiles
SET permissions = ARRAY['developer-dashboard', 'developer-attendance', 'developer-logs', 'developer-db', 'notifications', 'dashboard']
WHERE role = 'developer' AND (permissions IS NULL OR permissions = '{}'::text[]);

-- الخطوة 5: عرض الأدوار الموجودة بعد التحديث
SELECT role, COUNT(*) as count, is_developer
FROM profiles
GROUP BY role, is_developer
ORDER BY role;

-- الخطوة 6: عرض كل مطور موجود
SELECT id, full_name, email, role, is_developer, permissions
FROM profiles
WHERE role = 'developer';