/**
 * ════════════════════════════════════════════════════════════════
 *  دوال مساعدة للمستخدمين - نظام الرافدين HR
 *  توحيد طريقة التعامل مع بيانات المستخدمين من مصادر مختلفة
 * ════════════════════════════════════════════════════════════════
 */

import type { User, UserRole } from '../types';

// ═══════════════ دوال التطبيع والتوحيد ═══════════════

/**
 * تحويل البيانات من أي مصدر (profiles, employees, local) إلى User موحد
 */
export function normalizeUser(data: any): User {
  if (!data) {
    throw new Error('User data is required');
  }

  return {
    // الهوية - أولوية للـ Frontend ID
    id: data.id || data.user_id || generateTempId(),
    user_id: data.user_id || data.id,
    employee_id: data.employee_id || data.emp_id,
    
    // الاسم - اختيار أفضل نسخة متوفرة
    full_name: normalizeFullName(data),
    name: data.name || data.full_name,
    username: data.username,
    
    // الاتصال
    email: data.email || '',
    phone: data.phone,
    
    // الوظيفة
    role: normalizeRole(data.role),
    rank: data.rank || 'employee',
    department: data.department || data.departments?.name,
    position: data.position,
    manufacturingDept: data.manufacturingDept,
    
    // الصورة - أولوية للأحدث
    profile_image: data.profile_image || data.avatar_url || data.avatar,
    avatar: data.avatar || data.profile_image || data.avatar_url,
    certificateImage: data.certificateImage,
    
    // الحالة والموقع
    location: data.location,
    status: normalizeStatus(data.status, data.is_active),
    
    // التواريخ
    created_at: data.created_at,
    updated_at: data.updated_at,
    joinDate: data.joinDate || data.join_date,
    employeeId: data.employeeId || data.employee_id,
    
    // الإدارة
    manager: data.manager,
    salary: data.salary,
    
    // الصلاحيات - تفضيل المصفوفة على الكائن
    permissions: normalizePermissions(data.permissions, data.custom_permissions),
    custom_permissions: data.custom_permissions,
    can_manage_breaks: data.can_manage_breaks || false,
    
    // الأمان
    gatekeeper_type: data.gatekeeper_type,
    gatekeeper_pin: data.gatekeeper_pin,
    passcode: data.passcode,
    
    // الإحصائيات
    wellnessScore: data.wellnessScore || data.wellness_score || 0,
    problemsCount: data.problemsCount || data.problems_count || 0,
    
    // بيانات إضافية
    cv_data: data.cv_data,
  };
}

/**
 * تطبيع الاسم الكامل من مصادر مختلفة
 */
function normalizeFullName(data: any): string {
  // إذا كان full_name متوفر، استخدمه
  if (data.full_name?.trim()) {
    return data.full_name.trim();
  }
  
  // إذا كان name متوفر، استخدمه
  if (data.name?.trim()) {
    return data.name.trim();
  }
  
  // جمع من first_name و last_name
  const firstName = data.first_name?.trim() || '';
  const lastName = data.last_name?.trim() || '';
  const fullFromParts = `${firstName} ${lastName}`.trim();
  
  if (fullFromParts) {
    return fullFromParts;
  }
  
  // جمع من full_name_ar (لجدول employees)
  if (data.full_name_ar?.trim()) {
    return data.full_name_ar.trim();
  }
  
  // افتراضي
  return 'مستخدم غير معرف';
}

/**
 * تطبيع الدور من أنواع مختلفة
 */
export function normalizeRole(role: any): UserRole {
  if (!role || typeof role !== 'string') {
    return 'employee';
  }

  const roleMap: Record<string, UserRole> = {
    'system_admin': 'admin',
    'hr_manager': 'hr',
    'department_manager': 'manager',
    'team_supervisor': 'supervisor',
    'security_guard': 'gatekeeper',
    'system_developer': 'developer',
  };

  const normalizedRole = roleMap[role.toLowerCase()] || role.toLowerCase();
  
  // التحقق من أن الدور صحيح
  const validRoles: UserRole[] = ['employee', 'hr', 'admin', 'gatekeeper', 'developer', 'supervisor', 'manager'];
  
  return validRoles.includes(normalizedRole as UserRole) 
    ? normalizedRole as UserRole 
    : 'employee';
}

/**
 * تطبيع حالة المستخدم
 */
function normalizeStatus(status: any, isActive?: boolean): 'active' | 'inactive' | 'on_leave' {
  // إذا كان status واضح
  if (status === 'active' || status === 'inactive' || status === 'on_leave') {
    return status;
  }
  
  // إذا كان هناك is_active boolean
  if (typeof isActive === 'boolean') {
    return isActive ? 'active' : 'inactive';
  }
  
  // افتراضي
  return 'active';
}

/**
 * تطبيع الصلاحيات من مصادر مختلفة
 */
function normalizePermissions(permissions: any, customPermissions: any): string[] {
  // إذا كانت permissions مصفوفة، استخدمها
  if (Array.isArray(permissions)) {
    return permissions.filter(p => typeof p === 'string');
  }
  
  // إذا كانت custom_permissions كائن، حولها لمصفوفة
  if (customPermissions && typeof customPermissions === 'object') {
    return Object.entries(customPermissions)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key);
  }
  
  // افتراضي
  return [];
}

/**
 * توليد ID مؤقت للمستخدمين المحليين
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════ دوال المساعدة للعرض ═══════════════

/**
 * الحصول على اسم العرض المناسب
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'مستخدم';
  
  return user.full_name || user.name || 'مستخدم غير معرف';
}

/**
 * الحصول على صورة المستخدم
 */
export function getUserProfileImage(user: User | null | undefined): string | null {
  if (!user) return null;
  
  return user.profile_image || user.avatar || null;
}

/**
 * الحصول على بادجة الدور بالعربية
 */
export function getUserRoleBadge(role: UserRole): string {
  const roleBadges: Record<UserRole, string> = {
    employee: 'موظف',
    supervisor: 'مشرف',
    manager: 'مدير',
    hr: 'موارد بشرية',
    admin: 'مدير النظام',
    gatekeeper: 'حارس',
    developer: 'مطور',
  };
  
  return roleBadges[role] || 'موظف';
}

/**
 * التحقق من صحة البيانات الأساسية للمستخدم
 */
export function validateUserData(user: User): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!user.id) {
    errors.push('معرف المستخدم مطلوب');
  }
  
  if (!user.full_name?.trim()) {
    errors.push('اسم المستخدم مطلوب');
  }
  
  if (!user.email?.trim()) {
    errors.push('البريد الإلكتروني مطلوب');
  }
  
  if (!user.role) {
    errors.push('دور المستخدم مطلوب');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * التحقق من إمكانية المستخدم لإدارة الاستراحات
 */
export function canUserManageBreaks(user: User): boolean {
  return user.can_manage_breaks === true || 
         ['admin', 'hr', 'supervisor', 'manager'].includes(user.role);
}

/**
 * التحقق من نشاط المستخدم
 */
export function isUserActive(user: User): boolean {
  return user.status === 'active' || user.status == null;
}

/**
 * تحديث بيانات المستخدم مع الحفاظ على التوافق
 */
export function updateUserData(currentUser: User, updates: Partial<User>): User {
  const updatedUser = { ...currentUser, ...updates };
  
  // تأكد من تحديث كل من full_name و name
  if (updates.full_name) {
    updatedUser.name = updates.full_name;
  }
  if (updates.name && !updates.full_name) {
    updatedUser.full_name = updates.name;
  }
  
  // تحديث updated_at
  updatedUser.updated_at = new Date().toISOString();
  
  return updatedUser;
}