/**
 * ════════════════════════════════════════════════════════════════
 *  Auth SDK - إدارة المصادقة المحسنة
 *  تم التحديث لاستخدام الأنواع الموحدة والمعالجة المحسنة
 * ════════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import { normalizeUser, normalizeRole } from '../utils/userUtils';
import type { User, UserRole } from '../types';

// ════════════════════════════════════════════════════════════════
//  المصادقة الأساسية
// ════════════════════════════════════════════════════════════════

/**
 * تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
 * يدعم كلاً من البريد الكامل واسم المستخدم فقط
 */
export async function login(email: string, password: string) {
  // إصلاح: استخدام domain صحيح للشركة
  const finalEmail = email.includes('@') ? email : `${email}@rafidain.hr`;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: finalEmail,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * تسجيل الخروج مع تنظيف كامل
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * الحصول على الجلسة الحالية
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * الاستماع لتغييرات حالة المصادقة
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// ════════════════════════════════════════════════════════════════
//  إدارة المستخدمين (للإدارة فقط)
// ════════════════════════════════════════════════════════════════

export interface CreateUserParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  department?: string;
  position?: string;
  phone?: string;
}

/**
 * إنشاء مستخدم جديد (آمن عبر supabaseAdmin)
 */
export async function createUser(params: CreateUserParams) {
  const { email, password, fullName, role, department, position, phone } = params;

  // التحقق من صحة البيانات
  if (!email?.trim() || !password?.trim() || !fullName?.trim()) {
    throw new Error('البريد الإلكتروني وكلمة المرور والاسم الكامل مطلوبة');
  }

  // تحليل الاسم
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || fullName;
  const lastName = nameParts.slice(1).join(' ') || '';

  // محاولة إنشاء المستخدم عبر admin API
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        role: normalizeRole(role),
      },
    });

    if (error) throw error;
    
    // إنشاء ملف تعريف في profiles
    if (data.user) {
      await createUserProfile(data.user.id, {
        full_name: fullName,
        email,
        role: normalizeRole(role),
        department,
        position,
        phone,
      });
    }
    
    return data;
  }

  // Backup: إنشاء عبر API العادي
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        role: normalizeRole(role),
        department,
        position,
        phone,
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * إنشاء ملف تعريف في جدول profiles
 */
async function createUserProfile(userId: string, profileData: any) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: profileData.full_name,
        email: profileData.email,
        role: profileData.role,
        department: profileData.department,
        position: profileData.position,
        phone: profileData.phone,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.warn('Failed to create profile:', error.message);
    }
  } catch (err) {
    console.warn('Error creating profile:', err);
  }
}

/**
 * تحديث بيانات المستخدم بطريقة آمنة ومتسقة
 */
export async function updateUser(
  userId: string,
  data: {
    fullName?: string;
    email?: string;
    role?: UserRole;
    department?: string;
    position?: string;
    phone?: string;
    status?: string;
    permissions?: string[];
    can_manage_breaks?: boolean;
  }
) {
  if (!supabaseAdmin) {
    throw new Error('مفتاح Service Role غير متوفر - تواصل مع المطور');
  }

  const updates: any = {};
  
  // تحضير البيانات المحدثة
  if (data.fullName) {
    const nameParts = data.fullName.trim().split(' ');
    updates.user_metadata = {
      full_name: data.fullName,
      first_name: nameParts[0] || data.fullName,
      last_name: nameParts.slice(1).join(' ') || '',
    };
  }
  
  if (data.email) updates.email = data.email;
  if (data.role) updates.user_metadata = { ...updates.user_metadata, role: normalizeRole(data.role) };

  // تحديث في auth.users إذا لزم الأمر
  if (Object.keys(updates).length > 0) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updates);
    if (authError) {
      console.warn('Auth update warning:', authError.message);
      // لا نرمي خطأ هنا لأن profiles أهم
    }
  }

  // تحديث profiles (الأساسي)
  const profileUpdate: any = {
    updated_at: new Date().toISOString(),
  };
  
  if (data.fullName) profileUpdate.full_name = data.fullName;
  if (data.email) profileUpdate.email = data.email;
  if (data.role) profileUpdate.role = normalizeRole(data.role);
  if (data.department !== undefined) profileUpdate.department = data.department;
  if (data.position !== undefined) profileUpdate.position = data.position;
  if (data.phone !== undefined) profileUpdate.phone = data.phone;
  if (data.status !== undefined) profileUpdate.status = data.status;
  if (data.permissions !== undefined) profileUpdate.permissions = data.permissions;
  if (data.can_manage_breaks !== undefined) profileUpdate.can_manage_breaks = data.can_manage_breaks;

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId);

  if (profileError) throw profileError;

  // تحديث employees للتوافق (اختياري)
  try {
    const empUpdate: any = {};
    if (data.fullName) {
      const nameParts = data.fullName.trim().split(' ');
      empUpdate.first_name = nameParts[0] || data.fullName;
      empUpdate.last_name = nameParts.slice(1).join(' ') || '';
      empUpdate.full_name_ar = data.fullName;
    }
    if (data.email) empUpdate.email = data.email;
    if (data.role) empUpdate.role = normalizeRole(data.role);
    if (data.status) empUpdate.is_active = data.status === 'active';
    if (data.can_manage_breaks !== undefined) empUpdate.can_manage_breaks = data.can_manage_breaks;

    if (Object.keys(empUpdate).length > 0) {
      empUpdate.updated_at = new Date().toISOString();
      await supabaseAdmin
        .from('employees')
        .update(empUpdate)
        .eq('user_id', userId);
    }
  } catch (empError) {
    console.warn('Employee table update failed (non-critical):', empError);
  }

  return true;
}

/**
 * حذف مستخدم بشكل آمن ومنظم
 */
export async function deleteUser(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('مفتاح Service Role غير متوفر - تواصل مع المطور');
  }

  try {
    // 1. حذف العلاقات التابعة (إن وجدت)
    const tablesToClean = [
      'employee_skills',
      'employee_certifications', 
      'notifications',
      'attendance_logs',
      'problems'
    ];

    for (const table of tablesToClean) {
      try {
        await supabaseAdmin
          .from(table)
          .delete()
          .or(`employee_id.eq.${userId},user_id.eq.${userId},recipient_id.eq.${userId}`)
          .throwOnError();
      } catch (cleanupError) {
        console.warn(`Cleanup warning for ${table}:`, cleanupError);
        // نكمل حتى لو فشل تنظيف جدول معين
      }
    }

    // 2. حذف من employees
    await supabaseAdmin
      .from('employees')
      .delete()
      .eq('user_id', userId);

    // 3. حذف من profiles
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    // 4. حذف من auth.users (النهائي)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    console.log(`✅ User ${userId} deleted successfully`);
    return true;
    
  } catch (error) {
    console.error('Delete user error:', error);
    throw new Error(`فشل في حذف المستخدم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
  }
}

/**
 * الحصول على ملف تعريف المستخدم بطريقة محسنة
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    // 1. محاولة من profiles أولاً (المصدر المفضل)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profile && !profileError) {
      return normalizeUser(profile);
    }

    // 2. محاولة من employees كـ fallback
    const { data: emp, error: empError } = await supabase
      .from('employees')
      .select('*, departments(name)')
      .eq('user_id', userId)
      .maybeSingle();

    if (emp && !empError && emp.user_id) {
      const employeeData = {
        id: userId,                    // Frontend ID
        user_id: emp.user_id,         // Auth ID
        employee_id: emp.id,          // Backend ID
        full_name: emp.full_name_ar || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        email: emp.email || '',
        role: emp.role,
        department: emp.departments?.name || null,
        position: emp.position || null,
        phone: emp.phone || null,
        profile_image: emp.avatar_url || null,
        status: emp.is_active ? 'active' : 'inactive',
        can_manage_breaks: emp.can_manage_breaks || false,
        created_at: emp.created_at,
        updated_at: emp.updated_at,
        permissions: [],
      };

      return normalizeUser(employeeData);
    }

    // 3. لا يوجد ملف تعريف
    console.warn(`No profile found for user ${userId}`);
    return null;

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * البحث عن المستخدمين (للإدارة)
 */
export async function searchUsers(query: string, limit: number = 20): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit)
      .order('full_name');

    if (error) throw error;

    return data.map(normalizeUser);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * الحصول على إحصائيات المستخدمين
 */
export async function getUserStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  byRole: Record<UserRole, number>;
}> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, status');

    if (error) throw error;

    const    stats = {
      total: data.length,
      active: data.filter(u => u.status === 'active' || !u.status).length,
      inactive: data.filter(u => u.status === 'inactive').length,
      byRole: {} as Record<UserRole, number>
    };

    // إحصائيات الأدوار
    const roles: UserRole[] = ['employee', 'hr', 'admin', 'gatekeeper', 'developer', 'supervisor', 'manager'];
    
    roles.forEach(role => {
      stats.byRole[role] = data.filter(u => normalizeRole(u.role) === role).length;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      byRole: {} as Record<UserRole, number>
    };
  }
}

/**
 * تغيير كلمة المرور (للمستخدم نفسه)
 */
export async function changePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return true;
}

/**
 * إعادة تعيين كلمة المرور عبر البريد الإلكتروني
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (error) throw error;
  return true;
}

/**
 * تحديث البريد الإلكتروني
 */
export async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({
    email: newEmail
  });

  if (error) throw error;
  return true;
}

/**
 * التحقق من صحة جلسة المستخدم
 */
export async function validateSession(): Promise<{ isValid: boolean; user: User | null }> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return { isValid: false, user: null };
    }

    const profile = await getUserProfile(session.user.id);
    
    return { 
      isValid: true, 
      user: profile 
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, user: null };
  }
}

/**
 * تجديد الجلسة
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) throw error;
  return data;
}