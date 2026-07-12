import React from 'react';
import { TrendingUp, Bell, Search } from 'lucide-react';
import { useLang } from '../LangContext';
import { BrowserFrame } from '../ui/DeviceFrame';
import { DAY_LABELS, WEEKLY_ATTENDANCE, KPI_CARDS, ACTIVITY_FEED } from '../mockupData';

/** Mockup للوحة التحكم — مبني بالكامل بـ CSS/SVG وليس صورة حقيقية، لضمان اتساقه مع هوية KYVZON */
export function HeroMockup() {
  const { lang, t } = useLang();
  const days = DAY_LABELS[lang];

  return (
    <div className="relative w-full max-w-[560px] mx-auto">
      {/* توهّج خلفي خلف الإطار */}
      <div
        className="absolute -inset-6 rounded-[32px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 30% 20%, rgba(99,102,241,0.35), transparent 60%)', filter: 'blur(30px)' }}
        aria-hidden="true"
      />

      <BrowserFrame url="app.kyvzon.com/dashboard" className="relative anim-float" >
        <div style={{ padding: 18, background: 'linear-gradient(180deg, #0d1020, #0a0c18)' }}>
          {/* Topbar داخل التطبيق */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white font-black text-sm">
                {lang === 'ar' ? 'مرحباً، عمر 👋' : lang === 'en' ? 'Welcome, Omar 👋' : 'بەخێربێیت، عومەر 👋'}
              </div>
              <div style={{ color: 'rgba(180,195,255,0.5)', fontSize: '0.7rem', marginTop: 2 }}>
                {lang === 'ar' ? 'إليك ملخص اليوم' : lang === 'en' ? "Here's today's summary" : 'ئەمە کورتەی ئەمڕۆیە'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge" style={{ padding: '4px 10px', fontSize: '0.65rem' }}>
                <span className="glow-dot" />
                {t('hero_mockup_live')}
              </span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={12} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
            </div>
          </div>

          {/* شريط بحث زخرفي */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
            <Search size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem' }}>
              {lang === 'ar' ? 'ابحث عن موظف، تقرير، طلب...' : lang === 'en' ? 'Search employee, report, request...' : 'گەڕان بۆ کارمەند، ڕاپۆرت...'}
            </span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {KPI_CARDS.map((k, i) => (
              <div key={i} className="mockup-kpi">
                <div style={{ color: 'rgba(180,195,255,0.55)', fontSize: '0.62rem', marginBottom: 6, lineHeight: 1.3 }}>{k.label[lang]}</div>
                <div className="flex items-end justify-between">
                  <span className="text-white font-black" style={{ fontSize: '1.05rem' }}>{k.value}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: k.positive ? '#34d399' : '#f87171' }}>{k.delta}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart + activity feed */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3 mockup-kpi" style={{ padding: '14px 14px 10px' }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  {lang === 'ar' ? 'الحضور الأسبوعي' : lang === 'en' ? 'Weekly Attendance' : 'ئامادەبوونی هەفتانە'}
                </span>
                <TrendingUp size={12} style={{ color: '#818cf8' }} />
              </div>
              <div className="flex items-end justify-between gap-1.5" style={{ height: 64 }}>
                {WEEKLY_ATTENDANCE.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className="mockup-bar w-full"
                      style={{
                        height: `${h * 0.6}px`,
                        background: i === 3
                          ? 'linear-gradient(180deg, #818cf8, #6366f1)'
                          : 'rgba(99,102,241,0.25)',
                      }}
                    />
                    <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2 mockup-kpi" style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                {lang === 'ar' ? 'آخر النشاطات' : lang === 'en' ? 'Recent Activity' : 'دوایین چالاکی'}
              </div>
              <div className="flex flex-col gap-2">
                {ACTIVITY_FEED.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        background: `${a.color}33`, color: a.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.5rem', fontWeight: 800,
                      }}
                    >
                      {a.initials}
                    </div>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.3 }}>{a.text[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </BrowserFrame>

      {/* بطاقة عائمة علوية */}
      <div
        className="hidden md:block absolute glass-dark rounded-2xl px-4 py-3 anim-float"
        style={{ top: -22, insetInlineStart: -28, animationDelay: '0.4s', animationDuration: '7s' }}
      >
        <div className="flex items-center gap-2">
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={14} style={{ color: '#34d399' }} />
          </div>
          <div>
            <div className="text-white font-black" style={{ fontSize: '0.85rem' }}>+18%</div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
              {lang === 'ar' ? 'إنتاجية' : lang === 'en' ? 'Productivity' : 'بەرهەمهێنان'}
            </div>
          </div>
        </div>
      </div>

      {/* بطاقة عائمة سفلية */}
      <div
        className="hidden md:block absolute glass-dark rounded-2xl px-4 py-3 anim-float"
        style={{ bottom: -18, insetInlineEnd: -20, animationDelay: '1.1s', animationDuration: '6s' }}
      >
        <div className="flex items-center gap-2">
          <span className="glow-dot" />
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            {lang === 'ar' ? '٦ بوابات متصلة' : lang === 'en' ? '6 portals connected' : '٦ دەروازە پەیوەستن'}
          </span>
        </div>
      </div>
    </div>
  );
}
