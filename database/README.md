# إصلاحات قاعدة البيانات - Database Fixes

## المشاكل الموجودة
1. تضارب بين جدولي `profiles` و `employees` (نفس البيانات في جدولين)
2. مشكلة توليد `employee_code` من UUID مما يسبب تضارباً
3. بيانات meta-data ناقصة عند إنشاء المستخدمين
4. السياسات (RLS) متناثرة في schema.sql القديم والجديد
5. دالة `handle_new_user()` غير مكتملة

## الحل
استخدمنا `database/schema.sql` كـ **المصدر الرسمي** الوحيد (1514 سطر) 
ونهمل `schema.sql` في الجذر (312 سطر).

### ملفات الإصلاح:
- `migrations/001_unify_profiles_employees.sql` - توحيد الحسابات
- `migrations/002_fix_triggers.sql` - إصلاح المشغلات
- `migrations/003_fix_rls.sql` - إصلاح سياسات الأمان

### لتطبيق الإصلاحات:
اذهب إلى Supabase Dashboard > SQL Editor وارفع الملفات بالترتيب.