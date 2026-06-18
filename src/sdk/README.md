# SDK Layer - طبقة الخدمات المركزية

هذه الطبقة توحد جميع استعلامات قاعدة البيانات في مكان واحد، مما يسهل:
- تغيير مزود قاعدة البيانات (Supabase → PostgreSQL → أي مزود آخر)
- اختبار الكود (Mocking)
- إعادة استخدام الكود
- تتبع الأخطاء (Logging)
- التحقق من الصلاحيات

## المبدأ
```
Pages/Components → Hooks → SDK (هذا المجلد) → Database
```

## الملفات
- `supabase.ts` - إعدادات Supabase الأساسية
- `supabaseAdmin.ts` - إعدادات Supabase الإدارية  
- `users.ts` - إدارة المستخدمين (CRUD)
- `employees.ts` - إدارة الموظفين (لنظام الحضور)
- `auth.ts` - المصادقة
- `attendance.ts` - الحضور
- `notifications.ts` - الإشعارات
- `index.ts` - تصدير موحد