/**
 * ════════════════════════════════════════════════════════════════
 *  Auth SDK - إدارة المصادقة المحسنة (نسخة مُصلحة)
 * ════════════════════════════════════════════════════════════════
 *
 *  🔧 الإصلاحات المُطبّقة:
 *  ─────────────────────────────────────────────────────────────────
 *  ✅ 5 استخدام any → 0 (أنواع صريحة)
 *  ✅ session: any → Session (من @supabase/supabase-js)
 *  ✅ profileData: any → ProfileData interface
 *  ✅ updates/profileUpdate/empUpdate: any → أنواع Record صريحة
 *  ✅ إصلاح console.log/warn/error المكسورة (3 مواضع)
 *  ✅ إصلاح .or(`...`) المكسورة (2 مواضع)
 *  ✅ تنظيف جميع markdown artifacts (15+ موضع)
 *  ✅ catch blocks → getErrorMessage
 *  ════════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import { normalizeUser, normalizeRole } from '../utils/userUtils';
import { getErrorMessage } from '../lib/errors';
import type { User, UserRole } from '../types';
import type { Session } from '@supabase/supabase-js';

// ════════════════════════════════════════════════════
// أنواع محلية (تحلّ محل any)
// ════════════════════════════════════════════════════

interface ProfileData {
  full_name: string;
  email: string;
  role: string;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
}

interface EmployeeRecord {
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  full_name_ar?: string;
  email?: string;
  role?: string;
  position?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  can_manage_breaks?: boolean;
  created_at?: string;
  updated_at?: string;
  departments?: { name: string } | null;
}

// ════════════════════════════════════════════════════
// المصادقة الأساسية
// ════════════════════════════════════════════════════

/**
 * تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
 * يدعم كلاً من البريد الكامل واسم المستخدم فقط
 */
export async function login(email: string, password: string) {
  const finalEmail = email.includes('@') ? email : `${email}@rafidain.hr`;
  const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
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
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// ════════════════════════════════════════════════════
// إدارة المستخدمين (للإدارة فقط)
// ════════════════════════════════════════════════════

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

  if (!email?.trim() || !password?.trim() || !fullName?.trim()) {
    throw new Error('البريد الإلكتروني وكلمة المرور والاسم الكامل مطلوبة');
  }

  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || fullName;
  const lastName = nameParts.slice(1).join(' ') || '';

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
async function createUserProfile(userId: string, profileData: ProfileData) {
  try {
    const { error } = await supabase.from('profiles').upsert({
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
    }, { onConflict: 'id' });

    if (error) console.warn('Failed to create profile:', getErrorMessage(error));
  } catch (err) {
    console.warn('Error creating profile:', getErrorMessage(err));
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
  if (!supabaseAdmin) throw new Error('مفتاح Service Role غير متوفر - تواصل مع المطور');

  // تحضير تحديثات auth.users
  const userMetadata: Record<string, string> = {};

  if (data.fullName) {
    const nameParts = data.fullName.trim().split(' ');
    userMetadata.full_name = data.fullName;
    userMetadata.first_name = nameParts[0] || data.fullName;
    userMetadata.last_name = nameParts.slice(1).join(' ') || '';
  }
  if (data.role) userMetadata.role = normalizeRole(data.role);

  const authUpdates: { email?: string; user_metadata?: Record<string, string> } = {};
  if (data.email) authUpdates.email = data.email;
  if (Object.keys(userMetadata).length > 0) authUpdates.user_metadata = userMetadata;

  if (Object.keys(authUpdates).length > 0) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);
    if (authError) console.warn('Auth update warning:', getErrorMessage(authError));
  }

  // تحديث profiles (الأساسي)
  const profileUpdate: Record<string, string | boolean | string[] | undefined> = {
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

  const { error: profileError } = await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', userId);
  if (profileError) throw profileError;

  // تحديث employees للتوافق (اختياري)
  try {
    const empUpdate: Record<string, string | boolean | undefined> = {};

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
      await supabaseAdmin.from('employees').update(empUpdate).eq('user_id', userId);
    }
  } catch (empError) {
    console.warn('Employee table update failed (non-critical):', getErrorMessage(empError));
  }

  return true;
}

/**
 * حذف مستخدم بشكل آمن ومنظم
 */
export async function deleteUser(userId: string) {
  if (!supabaseAdmin) throw new Error('مفتاح Service Role غير متوفر - تواصل مع المطور');

  try {
    const tablesToClean = ['employee_skills', 'employee_certifications', 'notifications', 'attendance_logs', 'problems'];

    for (const table of tablesToClean) {
      try {
        await supabaseAdmin
          .from(table)
          .delete()
          .or(`employee_id.eq.${userId},user_id.eq.${userId},recipient_id.eq.${userId}`)
          .throwOnError();
      } catch (cleanupError) {
        console.warn(`Cleanup warning for ${table}:`, getErrorMessage(cleanupError));
      }
    }

    await supabaseAdmin.from('employees').delete().eq('user_id', userId);
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    console.log(`✅ User ${userId} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Delete user error:', getErrorMessage(error));
    throw new Error(`فشل في حذف المستخدم: ${getErrorMessage(error)}`);
  }
}

/**
 * الحصول على ملف تعريف المستخدم بطريقة محسنة
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('*').eq('id', userId).maybeSingle();

    if (profile && !profileError) {
      return normalizeUser(profile);
    }

    // Fallback من employees
    const { data: emp, error: empError } = await supabase
      .from('employees').select('*, departments(name)').eq('user_id', userId).maybeSingle();

    const empRecord = emp as EmployeeRecord | null;
    if (empRecord && !empError && empRecord.user_id) {
      const employeeData = {
        id: userId,
        user_id: empRecord.user_id,
        employee_id: empRecord.id,
        full_name: empRecord.full_name_ar || `${empRecord.first_name || ''} ${empRecord.last_name || ''}`.trim(),
        email: empRecord.email || '',
        role: empRecord.role,
        department: empRecord.departments?.name || null,
        position: empRecord.position || null,
        phone: empRecord.phone || null,
        profile_image: empRecord.avatar_url || null,
        status: empRecord.is_active ? 'active' : 'inactive',
        can_manage_breaks: empRecord.can_manage_breaks || false,
        created_at: empRecord.created_at,
        updated_at: empRecord.updated_at,
        permissions: [],
      };
      return normalizeUser(employeeData);
    }

    console.warn(`No profile found for user ${userId}`);
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', getErrorMessage(error));
    return null;
  }
}

/**
 * البحث عن المستخدمين (للإدارة)
 */
export async function searchUsers(query: string, limit = 20): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit)
      .order('full_name');

    if (error) throw error;
    return (data || []).map(normalizeUser);
  } catch (error) {
    console.error('Error searching users:', getErrorMessage(error));
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
    const { data, error } = await supabase.from('profiles').select('role, status');
    if (error) throw error;

    const profiles = data as Array<{ role?: string; status?: string }> | null;
    const roles: UserRole[] = ['employee', 'hr', 'admin', 'gatekeeper', 'developer', 'supervisor', 'manager'];
    const emptyByRole = {} as Record<UserRole, number>;
    roles.forEach((r) => (emptyByRole[r] = 0));

    const stats = {
      total: profiles?.length || 0,
      active: (profiles || []).filter((u) => u.status === 'active' || !u.status).length,
      inactive: (profiles || []).filter((u) => u.status === 'inactive').length,
      byRole: { ...emptyByRole },
    };

    roles.forEach((role) => {
      stats.byRole[role] = (profiles || []).filter((u) => normalizeRole(u.role) === role).length;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', getErrorMessage(error));
    const roles: UserRole[] = ['employee', 'hr', 'admin', 'gatekeeper', 'developer', 'supervisor', 'manager'];
    const emptyByRole = {} as Record<UserRole, number>;
    roles.forEach((r) => (emptyByRole[r] = 0));
    return { total: 0, active: 0, inactive: 0, byRole: emptyByRole };
  }
}

/**
 * تغيير كلمة المرور (للمستخدم نفسه)
 */
export async function changePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return true;
}

/**
 * إعادة تعيين كلمة المرور عبر البريد الإلكتروني
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
  return true;
}

/**
 * تحديث البريد الإلكتروني
 */
export async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
  return true;
}

/**
 * التحقق من صحة جلسة المستخدم
 */
export async function validateSession(): Promise<{ isValid: boolean; user: User | null }> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return { isValid: false, user: null };
    const profile = await getUserProfile(session.user.id);
    return { isValid: true, user: profile };
  } catch (error) {
    console.error('Session validation error:', getErrorMessage(error));
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
