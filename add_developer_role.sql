-- ============================================
-- أمر SQL لإضافة خيار 'developer' إلى حقل role
-- ============================================

-- 1. إزالة القيد الحالي على حقل role (إذا كان موجوداً)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. إضافة القيد الجديد مع تضمين 'developer'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('employee', 'hr', 'admin', 'gatekeeper', 'developer'));

-- 3. إضافة حقل is_developer للتمييز السهل
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_developer BOOLEAN DEFAULT FALSE;

-- 4. إنشاء مطور افتراضي (يمكنك تعديل البيانات)
-- INSERT INTO profiles (id, full_name, email, role, is_developer, status, permissions)
-- VALUES (
--   gen_random_uuid(),
--   'مطور النظام',
--   'dev@alrafidain.com',
--   'developer',
--   true,
--   'active',
--   ARRAY['developer-dashboard', 'developer-attendance', 'developer-logs', 'developer-db', 'notifications']
-- );

-- 5. إعطاء جميع المستخدمين الحقل الجديد بقيمة افتراضية
UPDATE profiles SET is_developer = FALSE WHERE is_developer IS NULL;

-- 6. عرض جميع الأدوار المتاحة
SELECT DISTINCT role FROM profiles;