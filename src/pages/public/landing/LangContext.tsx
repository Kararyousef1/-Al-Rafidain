/**
 * LangContext.tsx — سياق اللغة المشترك.
 * بدلاً من تمرير lang عبر عشرات الخصائص (props drilling)، توفّر هذه
 * الوحدة hook واحد (useLang) يمنح كل مكوّن: اللغة الحالية، دالة التغيير،
 * اتجاه الصفحة (RTL/LTR)، ودالة الترجمة t().
 */
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang } from './types';
import { t as translate } from './i18n';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export const LANG_OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: 'ar', label: 'العربية', flag: '🇮🇶' },
  { code: 'en', label: 'English', flag: '🌐' },
  { code: 'ku', label: 'کوردی', flag: '🟨' },
];

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar');
  const isRTL = lang === 'ar' || lang === 'ku';

  // يُحدّث اتجاه ولغة مستند HTML نفسه — مهم لقارئات الشاشة ومحركات البحث،
  // وليس فقط للحاوية الداخلية للصفحة.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [lang, isRTL]);

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, isRTL, t: (key: string) => translate(key, lang) }),
    [lang, isRTL],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang يجب أن يُستخدم داخل <LangProvider>');
  return ctx;
}
