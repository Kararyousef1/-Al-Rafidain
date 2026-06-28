/**
 * ════════════════════════════════════════════════════════════════
 *  SDK - إدارة البلاغات (نسخة مُصلحة)
 *  نقطة وحيدة للتواصل مع قاعدة البيانات
 * ════════════════════════════════════════════════════════════════
 *
 *  🔧 الإصلاحات المُطبّقة:
 *  ─────────────────────────────────────────────────────────────────
 *  ✅ 4 استخدام any → 0 (أنواع صريحة)
 *  ✅ ai_analysis: any → AIAnalysis interface
 *  ✅ (comment: any) → CommentRow
 *  ✅ (update: any) → RealtimeUpdate
 *  ✅ fallback: any → ProblemDetail
 *  ✅ إصلاح .channel(`...`) المكسور (critical)
 *  ✅ تنظيف جميع markdown artifacts
 *  ✅ catch blocks → getErrorMessage
 *  ════════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase';
import { getErrorMessage } from '../lib/errors';

// ════════════════════════════════════════════════════════════════
//  أنواع البيانات
// ════════════════════════════════════════════════════════════════

export interface AIAnalysis {
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  urgencyLevel?: number;
  suggestedActions?: string[];
  summary?: string;
  tags?: string[];
  predictedResolutionTime?: string;
  [key: string]: unknown;
}

export interface ProblemDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  is_anonymous: boolean;
  user_id?: string;
  created_at: string;
  updated_at?: string;
  ai_analysis?: AIAnalysis | null;
}

export interface CommentDetail {
  id: string;
  incident_id: string;
  user_id: string;
  text: string;
  is_internal: boolean;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

/** صف خام من جدول incident_comments مع علاقة profiles */
interface CommentRow {
  id: string;
  incident_id: string;
  user_id: string;
  text: string;
  is_internal: boolean;
  created_at: string;
  profiles?: { full_name?: string; role?: string } | null;
}

/** حمولة تحديث Realtime من Supabase */
interface RealtimePayload {
  type?: string;
  eventType?: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  /** بيانات الحدث (تُستخدم للتعليقات الجديدة مثلاً) */
  data?: Record<string, unknown>;
}

// ════════════════════════════════════════════════════════════════
//  جلب جميع البلاغات للموظف
// ════════════════════════════════════════════════════════════════

export async function fetchProblems(userId: string): Promise<ProblemDetail[]> {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('⚠️ Error fetching problems from DB:', getErrorMessage(error));
      return [];
    }

    return (data as ProblemDetail[]) || [];
  } catch (err) {
    console.error('❌ Failed to fetch problems:', getErrorMessage(err));
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
//  جلب تفاصيل بلاغ معين
// ════════════════════════════════════════════════════════════════

export async function fetchProblemById(problemId: string, userId?: string): Promise<ProblemDetail | null> {
  try {
    let query = supabase.from('incidents').select('*').eq('id', problemId);
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query.single();

    if (error) {
      console.warn('⚠️ Error fetching problem:', getErrorMessage(error));
      return null;
    }

    return data as ProblemDetail;
  } catch (err) {
    console.error('❌ Failed to fetch problem:', getErrorMessage(err));
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
//  إنشاء بلاغ جديد
// ════════════════════════════════════════════════════════════════

export async function createProblem(
  userId: string,
  data: {
    title: string;
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    is_anonymous: boolean;
  }
): Promise<ProblemDetail | null> {
  try {
    const { data: newProblem, error } = await supabase
      .from('incidents')
      .insert({ ...data, user_id: userId, status: 'pending', created_at: new Date().toISOString() })
      .select()
      .single();

    if (error) {
      console.warn('⚠️ Error creating problem:', getErrorMessage(error));
      return null;
    }

    return newProblem as ProblemDetail;
  } catch (err) {
    console.error('❌ Failed to create problem:', getErrorMessage(err));
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
//  تحديث حالة البلاغ
// ════════════════════════════════════════════════════════════════

export async function updateProblemStatus(
  problemId: string,
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
): Promise<ProblemDetail | null> {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', problemId)
      .select()
      .single();

    if (error) {
      console.warn('⚠️ Error updating problem status:', getErrorMessage(error));
      return null;
    }

    return data as ProblemDetail;
  } catch (err) {
    console.error('❌ Failed to update problem status:', getErrorMessage(err));
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
//  جلب التعليقات على البلاغ
// ════════════════════════════════════════════════════════════════

export async function fetchComments(problemId: string): Promise<CommentDetail[]> {
  try {
    const { data, error } = await supabase
      .from('incident_comments')
      .select('id, incident_id, user_id, text, is_internal, created_at, profiles(full_name, role)')
      .eq('incident_id', problemId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('⚠️ Error fetching comments:', getErrorMessage(error));
      return [];
    }

    return (data as CommentRow[] || []).map((comment) => ({
      id: comment.id,
      incident_id: comment.incident_id,
      user_id: comment.user_id,
      text: comment.text,
      is_internal: comment.is_internal,
      created_at: comment.created_at,
      user_name: comment.profiles?.full_name || 'مستخدم',
      user_role: comment.profiles?.role,
    }));
  } catch (err) {
    console.error('❌ Failed to fetch comments:', getErrorMessage(err));
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
//  إضافة تعليق جديد
// ════════════════════════════════════════════════════════════════

export async function addComment(
  problemId: string,
  userId: string,
  text: string,
  isInternal = false
): Promise<CommentDetail | null> {
  try {
    const { data, error } = await supabase
      .from('incident_comments')
      .insert({
        incident_id: problemId,
        user_id: userId,
        text,
        is_internal: isInternal,
        created_at: new Date().toISOString(),
      })
      .select('id, incident_id, user_id, text, is_internal, created_at, profiles(full_name, role)')
      .single();

    if (error) {
      console.warn('⚠️ Error adding comment:', getErrorMessage(error));
      return null;
    }

    const row = data as CommentRow;
    return {
      id: row.id,
      incident_id: row.incident_id,
      user_id: row.user_id,
      text: row.text,
      is_internal: row.is_internal,
      created_at: row.created_at,
      user_name: row.profiles?.full_name || 'مستخدم',
      user_role: row.profiles?.role,
    };
  } catch (err) {
    console.error('❌ Failed to add comment:', getErrorMessage(err));
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
//  حذف تعليق
// ════════════════════════════════════════════════════════════════

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('incident_comments').delete().eq('id', commentId);
    if (error) {
      console.warn('⚠️ Error deleting comment:', getErrorMessage(error));
      return false;
    }
    return true;
  } catch (err) {
    console.error('❌ Failed to delete comment:', getErrorMessage(err));
    return false;
  }
}

// ════════════════════════════════════════════════════════════════
//  الاشتراك في تحديثات البلاغ الفوري
// ════════════════════════════════════════════════════════════════

export function subscribeToProblemUpdates(
  problemId: string,
  callback: (update: RealtimePayload) => void
): () => void {
  const channel = supabase
    .channel(`problem-${problemId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'incidents', filter: `id=eq.${problemId}` },
      (payload) => {
        console.log('📢 Problem updated:', payload);
        callback(payload as RealtimePayload);
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'incident_comments', filter: `incident_id=eq.${problemId}` },
      (payload) => {
        console.log('💬 New comment:', payload);
        callback({ type: 'new_comment', data: payload.new as Record<string, unknown> });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ════════════════════════════════════════════════════════════════
//  دالة مساعدة: محاولة الحصول على البيانات مع Fallback
// ════════════════════════════════════════════════════════════════

export async function safelyFetchProblem(
  problemId: string,
  userId?: string,
  fallback?: ProblemDetail | null
): Promise<ProblemDetail | null> {
  try {
    const problem = await fetchProblemById(problemId, userId);
    if (problem) return problem;
    return fallback || null;
  } catch (err) {
    console.warn('Using fallback data:', getErrorMessage(err));
    return fallback || null;
  }
}
