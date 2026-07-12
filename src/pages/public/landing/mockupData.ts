/**
 * mockupData.ts — بيانات تجميلية (وليست حقيقية) تُستخدم فقط لرسم واجهات
 * تعريفية (mockups) للمنتج في قسمَي Hero وScreenshots، بدل الاعتماد على
 * صور شاشة حقيقية غير متوفرة لدينا. القيم ثابتة (غير عشوائية) حتى لا
 * تتغيّر بين كل تصيير.
 */
import type { Lang, LocalizedText } from './types';

export const DAY_LABELS: Record<Lang, string[]> = {
  ar: ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'],
  en: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  ku: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'هـ'],
};

/** نسب حضور تجميلية للرسم البياني الأسبوعي (٪) */
export const WEEKLY_ATTENDANCE = [62, 78, 55, 90, 72, 40, 85];

export const KPI_CARDS: { label: LocalizedText; value: string; delta: string; positive: boolean }[] = [
  { label: { ar: 'الموظفون النشطون', en: 'Active Employees', ku: 'کارمەندە چالاکەکان' }, value: '248', delta: '+3.2%', positive: true },
  { label: { ar: 'نسبة الحضور اليوم', en: 'Attendance Today', ku: 'ئامادەبوونی ئەمڕۆ' }, value: '96%', delta: '+1.1%', positive: true },
  { label: { ar: 'الطلبات المعلقة', en: 'Pending Requests', ku: 'داواکاری چاوەڕوان' }, value: '12', delta: '-4', positive: true },
];

export const ACTIVITY_FEED: { initials: string; color: string; text: LocalizedText; time: LocalizedText }[] = [
  { initials: 'أح', color: '#6366f1', text: { ar: 'أحمد سجّل حضوره', en: 'Ahmad checked in', ku: 'ئەحمەد ئامادەبوونی تۆمار کرد' }, time: { ar: 'قبل ٥ د', en: '5m ago', ku: 'پێش ٥ خولەک' } },
  { initials: 'لي', color: '#10b981', text: { ar: 'لينا قدّمت طلب إجازة', en: 'Lina requested leave', ku: 'لینا داواکاری مۆڵەتی کرد' }, time: { ar: 'قبل ١٢ د', en: '12m ago', ku: 'پێش ١٢ خولەک' } },
  { initials: 'مك', color: '#f59e0b', text: { ar: 'تقرير الأداء الشهري جاهز', en: 'Monthly report is ready', ku: 'ڕاپۆرتی مانگانە ئامادەیە' }, time: { ar: 'قبل ٢٥ د', en: '25m ago', ku: 'پێش ٢٥ خولەک' } },
];

export const HR_EMPLOYEES: { name: string; dept: LocalizedText; initials: string; color: string; status: 'active' | 'leave' }[] = [
  { name: 'محمد رشيد', dept: { ar: 'المبيعات', en: 'Sales', ku: 'فرۆشتن' }, initials: 'مر', color: '#6366f1', status: 'active' },
  { name: 'زينب علي', dept: { ar: 'المالية', en: 'Finance', ku: 'دارایی' }, initials: 'زع', color: '#0ea5e9', status: 'active' },
  { name: 'كريم سالم', dept: { ar: 'اللوجستيات', en: 'Logistics', ku: 'گواستنەوە' }, initials: 'كس', color: '#f59e0b', status: 'leave' },
  { name: 'هدى ياسين', dept: { ar: 'الموارد البشرية', en: 'HR', ku: 'HR' }, initials: 'هي', color: '#ec4899', status: 'active' },
];

export const ANALYTICS_TREND = [40, 55, 48, 66, 62, 78, 74, 88, 82, 95];
