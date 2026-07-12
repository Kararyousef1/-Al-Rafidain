import React from 'react';
import { Award } from 'lucide-react';
import { useLang } from '../LangContext';
import { Reveal } from '../ui/Reveal';
import { StatCounter } from '../ui/StatCounter';
import { WHY_REASONS, STATS } from '../data';

export function WhyKyvzon() {
  const { lang, t } = useLang();

  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: 'var(--kv-bg-alt)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="glass-dark rounded-3xl p-8 md:p-14">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div className="section-label"><Award size={12} /> {t('why_label')}</div>
              <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-6">{t('why_title')}</h2>
              <p style={{ color: 'rgba(180,195,255,0.78)', lineHeight: '1.8', marginBottom: '32px' }}>{t('why_desc')}</p>

              <div className="grid grid-cols-2 gap-4">
                {WHY_REASONS.map((it, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <it.icon size={14} style={{ color: '#818cf8' }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white leading-tight">{it.title[lang]}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(180,195,255,0.5)', marginTop: 2, lineHeight: 1.5 }}>{it.desc[lang]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '32px' }}>
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-3">🇮🇶</div>
                    <div className="text-2xl font-black text-white">العراق — Iraq</div>
                    <div style={{ color: 'rgba(180,195,255,0.7)', fontSize: '0.875rem', marginTop: '4px' }}>بغداد · Baghdad</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: '٦', l: { ar: 'بوابات', en: 'Portals', ku: 'دەروازەکان' } },
                      { v: '∞', l: { ar: 'موظفون', en: 'Employees', ku: 'کارمەند' } },
                      { v: '٣', l: { ar: 'لغات', en: 'Languages', ku: 'زمان' } },
                      { v: '٢٤/٧', l: { ar: 'دعم', en: 'Support', ku: 'پشتگیری' } },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-2xl font-black text-indigo-400">{s.v}</div>
                        <div className="text-xs text-white/45 mt-1">{s.l[lang]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* KPI row */}
          <Reveal delay={0.1}>
            <div className="mt-10 pt-10 grid grid-cols-2 md:grid-cols-4 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="col-span-2 md:col-span-4 mb-1 text-center" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(160,175,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('why_kpi_label')}
              </div>
              {STATS.map((s, i) => (
                <div key={i} className="text-center">
                  <StatCounter value={s.value} suffix={s.suffix} className="text-2xl md:text-3xl font-black text-white" />
                  <div style={{ color: 'rgba(180,195,255,0.5)', fontSize: '0.72rem', marginTop: 4 }}>{s.label[lang]}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
