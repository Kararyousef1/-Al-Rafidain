-- ============================================
-- إضافة خيار 'developer' إلى عمود role في profiles
-- ============================================

-- 1. إزالة القيد القديم (الذي لا يحوي 'developer')
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_valid;

-- 2. عرض القيد الموجود (للتشخيص)
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND contype = 'c'
  AND conname LIKE '%role%';

-- 3. إضافة القيد الجديد مع تضمين 'developer'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check_dev') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check_dev
      CHECK (role IN ('employee', 'hr', 'admin', 'gatekeeper', 'developer', 'supervisor', 'manager'));
  END IF;
END $$;

-- 4. إضافة حقل is_developer للتمييز السهل
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_developer BOOLEAN DEFAULT FALSE;

-- 5. إعطاء جميع المستخدمين الحقل الجديد بقيمة افتراضية
UPDATE profiles SET is_developer = FALSE WHERE is_developer IS NULL;

-- 6. عرض جميع الأدوار المتاحة في الجدول
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'role';

-- 7. اختبار إضافة مستخدم مطور (إلغاء التعليق بعد تشغيل 1-5)
// INSERT INTO profiles (full_name, email, role, is_developer, status, permissions)
// VALUES ('مطور النظام', 'dev@alrafidain.com', 'developer', true, 'active',
//   ARRAY['developer-dashboard', 'developer-attendance', 'developer-logs', 'developer-db', 'notifications']::text[]);

-- 8. عرض كل الأدوار الموجودة
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;