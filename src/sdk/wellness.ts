/**
 * ════════════════════════════════════════════════════════════════
 *  wellness.ts - SDK طبقة بيانات العافية
 * ════════════════════════════════════════════════════════════════
 *
 *  🔧 لماذا هذا الملف؟
 *  ─────────────────────────────────────────────────────────────────
 *  النسخة السابقة كانت تحتوي على مكون React كامل في ملف .ts —
 *  وهو خطأ هيكلي (استيراد React + تصدير JSX من ملف بيانات).
 *  هذه طبقة بيانات نقية: دوال async تتعامل مع Supabase فقط.
 *
 *  ✅ تطابق Migration 052 (جدول wellness_entries + user_id)
 *  ════════════════════════════════════════════════════════════════
 */

import { supabase } from '../lib/supabase';

// ════════════════════════════════════════════════════════════════
//  الأنواع
// ════════════════════════════════════════════════════════════════

export type WellnessMood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface WellnessEntry {
  id: number;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: WellnessMood;
  stress: number; // 0-100
  energy: number; // 0-100
  score: number; // 0-100
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
}

/** الحمولة المستخدمة عند إنشاء/تحديث سجل */
export interface WellnessInput {
  mood: WellnessMood;
  stress: number;
  energy: number;
  notes?: string;
}

// ════════════════════════════════════════════════════════════════
//  دوال مساعدة
// ════════════════════════════════════════════════════════════════

const MOOD_SCORE: Record<WellnessMood, number> = {
  great: 90,
  good: 75,
  neutral: 60,
  bad: 40,
  terrible: 20,
};

/** حساب درجة العافية من 100 */
export function calculateWellnessScore(input: WellnessInput): number {
  const { stress, energy, mood } = input;
  return Math.round((100 - stress) * 0.4 + energy * 0.4 + MOOD_SCORE[mood] * 0.2);
}

/** تاريخ اليوم بصيغة YYYY-MM-DD (محلي) */
export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** تحويل صف من Supabase إلى النوع المعياري */
const toEntry = (d: any): WellnessEntry => ({
  id: d.id,
  userId: d.user_id,
  date: d.date,
  mood: (d.mood || 'neutral') as WellnessMood,
  stress: d.stress ?? 50,
  energy: d.energy ?? 50,
  score: d.score ?? 50,
  notes: d.notes ?? null,
  createdAt: d.created_at,
  updatedAt: d.updated_at,
});

// ════════════════════════════════════════════════════════════════
//  العمليات (CRUD)
// ════════════════════════════════════════════════════════════════

/**
 * جلب سجل اليوم للمستخدم (إن وُجد)
 */
export async function getTodayEntry(userId: string): Promise<WellnessEntry | null> {
  const { data, error } = await supabase
    .from('wellness_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', todayISO())
    .maybeSingle();

  if (error) throw error;
  return data ? toEntry(data) : null;
}

/**
 * حفظ سجل اليوم (إنشاء أو تحديث — الـ UNIQUE INDEX يمنع التكرار)
 */
export async function saveWellnessEntry(
  userId: string,
  input: WellnessInput
): Promise<WellnessEntry> {
  const score = calculateWellnessScore(input);
  const date = todayISO();

  // 1) هل يوجد سجل لهذا اليوم؟
  const existing = await getTodayEntry(userId);

  if (existing) {
    // 2a) تحديث
    const { data, error } = await supabase
      .from('wellness_entries')
      .update({
        mood: input.mood,
        stress: input.stress,
        energy: input.energy,
        score,
        notes: input.notes ?? null,
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;
    return toEntry(data);
  }

  // 2b) إنشاء
  const { data, error } = await supabase
    .from('wellness_entries')
    .insert({
      user_id: userId,
      date,
      mood: input.mood,
      stress: input.stress,
      energy: input.energy,
      score,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return toEntry(data);
}

/**
 * جلب سجلّات المستخدم خلال فترة (للعرض التاريخي)
 */
export async function fetchWellnessHistory(
  userId: string,
  limit = 30
): Promise<WellnessEntry[]> {
  const { data, error } = await supabase
    .from('wellness_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toEntry);
}

/**
 * حذف سجل (اختياري — للحالات القديمة)
 */
export async function deleteWellnessEntry(
  userId: string,
  entryId: number
): Promise<void> {
  const { error } = await supabase
    .from('wellness_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * إحصائيات سريعة (متوسط آخر N سجل)
 */
export async function getWellnessStats(
  userId: string,
  days = 7
): Promise<{ avgScore: number; count: number }> {
  const { data, error } = await supabase
    .from('wellness_entries')
    .select('score')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(days);

  if (error) throw error;

  const scores = (data ?? []).map((r) => r.score as number);
  const count = scores.length;
  const avgScore = count > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / count) : 0;

  return { avgScore, count };
}
