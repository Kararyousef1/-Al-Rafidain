/**
 * ════════════════════════════════════════════════════════════════
 *  SDK - إدارة البلاغات
 *  نقطة وحيدة للتواصل مع قاعدة البيانات
 * ════════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase';
import type { Problem, Comment } from '../types';

// ════════════════════════════════════════════════════════════════
//  Types
// ════════════════════════════════════════════════════════════════

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
  ai_analysis?: any;
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
      console.warn('⚠️ Error fetching problems from DB:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('❌ Failed to fetch problems:', err);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
//  جلب تفاصيل بلاغ معين
// ════════════════════════════════════════════════════════════════

export async function fetchProblemById(
  problemId: string,
  userId?: string
): Promise<ProblemDetail | null> {
  try {
    let query = supabase
      .from('incidents')
      .select('*')
      .eq('id', problemId);

    // إذا كان المستخدم عادي، تأكد أنه مالك البلاغ
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      console.warn('⚠️ Error fetching problem:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ Failed to fetch problem:', err);
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
      .insert({
        ...data,
        user_id: userId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn('⚠️ Error creating problem:', error.message);
      return null;
    }

    return newProblem;
  } catch (err) {
    console.error('❌ Failed to create problem:', err);
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
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', problemId)
      .select()
      .single();

    if (error) {
      console.warn('⚠️ Error updating problem status:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ Failed to update problem status:', err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
//  جلب التعليقات على البلاغ
// ════════════════════════════════════════════════════════════════

export async function fetchComments(
  problemId: string
): Promise<CommentDetail[]> {
  try {
    const { data, error } = await supabase
      .from('incident_comments')
      .select(`
        id,
        incident_id,
        user_id,
        text,
        is_internal,
        created_at,
        profiles(full_name, role)
      `)
      .eq('incident_id', problemId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('⚠️ Error fetching comments:', error.message);
      return [];
    }

    return (data || []).map((comment: any) => ({
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
    console.error('❌ Failed to fetch comments:', err);
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
  isInternal: boolean = false
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
      .select(
        `
        id,
        incident_id,
        user_id,
        text,
        is_internal,
        created_at,
        profiles(full_name, role)
      `
      )
      .single();

    if (error) {
      console.warn('⚠️ Error adding comment:', error.message);
      return null;
    }

    return {
      id: data.id,
      incident_id: data.incident_id,
      user_id: data.user_id,
      text: data.text,
      is_internal: data.is_internal,
      created_at: data.created_at,
      user_name: data.profiles?.full_name || 'مستخدم',
      user_role: data.profiles?.role,
    };
  } catch (err) {
    console.error('❌ Failed to add comment:', err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
//  حذف تعليق
// ════════════════════════════════════════════════════════════════

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('incident_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.warn('⚠️ Error deleting comment:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('❌ Failed to delete comment:', err);
    return false;
  }
}

// ════════════════════════════════════════════════════════════════
//  الاشتراك في تحديثات البلاغ الفوري
// ════════════════════════════════════════════════════════════════

export function subscribeToProblemUpdates(
  problemId: string,
  callback: (update: any) => void
): (() => void) {
  const channel = supabase
    .channel(`problem-${problemId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'incidents',
        filter: `id=eq.${problemId}`,
      },
      (payload) => {
        console.log('📢 Problem updated:', payload);
        callback(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'incident_comments',
        filter: `incident_id=eq.${problemId}`,
      },
      (payload) => {
        console.log('💬 New comment:', payload);
        callback({ type: 'new_comment', data: payload.new });
      }
    )
    .subscribe();

  // إرجاع دالة للإلغاء
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
  fallback?: any
) {
  try {
    const problem = await fetchProblemById(problemId, userId);
    if (problem) return problem;
    return fallback || null;
  } catch (err) {
    console.warn('Using fallback data:', err);
    return fallback || null;
  }
}