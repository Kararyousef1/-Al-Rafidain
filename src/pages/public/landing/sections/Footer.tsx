import React from 'react';
import { useLang } from '../LangContext';
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon, WhatsAppIcon } from '../ui/SocialIcons';

/**
 * روابط التواصل الاجتماعي — أضف روابط صفحاتك الفعلية هنا
 * مثال: { Icon: FacebookIcon, href: 'https://facebook.com/yourpage', label: 'Facebook' }
 */
const SOCIAL_LINKS: { Icon: React.ComponentType<{ size?: number }>; href: string; label: string }[] = [];

export function Footer() {
  const { t } = useLang();
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const productLinks = [
    { label: t('nav_portals'), action: () => scrollTo('portals') },
    { label: t('nav_pricing'), action: () => scrollTo('pricing') },
    { label: t('nav_services'), action: () => scrollTo('services') },
    { label: t('footer_faq'), action: () => scrollTo('faq') },
  ];

  const companyLinks = [t('footer_about'), t('footer_careers'), t('footer_blog'), t('footer_contact')];
  const resourceLinks = [t('footer_support'), t('footer_pricing'), t('footer_faq'), t('footer_status')];
  const legalLinks = [t('footer_privacy'), t('footer_terms'), t('footer_security')];

  return (
    <footer style={{ backgroundColor: 'var(--kv-bg-deep)', borderTop: '1px solid var(--kv-border-soft)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm">K</div>
              <span className="font-black text-white text-lg">KYV<span style={{ color: '#818cf8' }}>ZON</span></span>
            </div>
            <p style={{ color: 'rgba(180,195,255,0.55)', fontSize: '0.875rem', lineHeight: '1.8', maxWidth: '22rem' }}>
              {t('footer_tagline')}
            </p>
            <div className="flex items-center gap-2 mt-5">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a key={label} href={href} className="icon-btn" aria-label={label} target="_blank" rel="noopener noreferrer">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="text-white font-bold text-sm mb-4">{t('footer_col_product')}</div>
            <ul className="flex flex-col gap-3">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <button onClick={l.action} style={{ color: 'rgba(180,195,255,0.6)', fontSize: '0.85rem' }} className="hover:text-white transition-colors text-start">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-white font-bold text-sm mb-4">{t('footer_col_company')}</div>
            <ul className="flex flex-col gap-3">
              {companyLinks.map((l) => (
                <li key={l}>
                  <a href="#" style={{ color: 'rgba(180,195,255,0.6)', fontSize: '0.85rem' }} className="hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="text-white font-bold text-sm mb-4">{t('footer_col_resources')}</div>
            <ul className="flex flex-col gap-3">
              {resourceLinks.map((l) => (
                <li key={l}>
                  <a href="#" style={{ color: 'rgba(180,195,255,0.6)', fontSize: '0.85rem' }} className="hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid var(--kv-border-soft)' }}
        >
          <div className="text-white/30 text-xs order-3 md:order-1">
            © {new Date().getFullYear()} KYVZON · {t('footer_rights')}
          </div>
          <div className="flex items-center gap-2 order-2" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
            🇮🇶 {t('footer_made_in')}
          </div>
          <div className="flex items-center gap-5 order-1 md:order-3">
            {legalLinks.map((l) => (
              <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }} className="hover:text-white/70 transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
