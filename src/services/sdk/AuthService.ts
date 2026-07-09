/**
 * ════════════════════════════════════════════════════════════════
 *  AuthService - خدمة المصادقة (نسخة SDK جديدة)
 *  مسؤولة فقط عن: Login, Logout, Session, Password
 *  لا تحتوي أي منطق للموظفين أو الصلاحيات
 * ════════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase/supabase';
import { SdkError, SdkErrorCode } from './BaseService';

export interface LoginResult {
  user: {
    id: string;
    email: string;
  } | null;
  session: unknown;
}

export interface SessionResult {
  session: {
    user: {
      id: string;
      email: string;
    } | null;
  } | null;
}

class AuthService {
  /**
   * تسجيل الدخول
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new SdkError(
          SdkErrorCode.PERMISSION_DENIED,
          error.message === 'Invalid login credentials'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : error.message,
        );
      }

      return {
        user: data.user
          ? { id: data.user.id, email: data.user.email || '' }
          : null,
        session: data.session,
      };
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * تسجيل الخروج
   */
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw SdkError.fromSupabaseError(error);
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * الحصول على الجلسة الحالية
   */
  async getSession(): Promise<SessionResult> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw SdkError.fromSupabaseError(error);
      return data as SessionResult;
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * تحديث الجلسة
   */
  async refreshSession(): Promise<SessionResult | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw SdkError.fromSupabaseError(error);
      return data as SessionResult;
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * إعادة تعيين كلمة المرور
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw SdkError.fromSupabaseError(error);
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * تحديث كلمة المرور
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw SdkError.fromSupabaseError(error);
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * الحصول على المستخدم الحالي
   */
  async getCurrentUser(): Promise<{ id: string; email: string } | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw SdkError.fromSupabaseError(error);
      if (!user) return null;
      return { id: user.id, email: user.email || '' };
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * التحقق من صحة الجلسة
   */
  async validateSession(): Promise<boolean> {
    try {
      const session = await this.getSession();
      return !!session?.session?.user;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();