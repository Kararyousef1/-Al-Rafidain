// ============================================================
//  أنواع الصفحة الرئيسية (Landing Page) — المصدر الموحّد
//  هذا هو المصدر الوحيد لهذه الأنواع. لا تُعِد تعريفها في أماكن أخرى.
// ============================================================

export interface LandingVideo {
  id: string;
  url: string;
  title?: string;
  placement: 'hero' | 'about' | 'dedicated_section' | 'footer';
  autoplay: boolean;
  order?: number;
}

export interface LandingProduct {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr?: string;
  descEn?: string;
  detailsAr?: string;
  detailsEn?: string;
  countAr?: string;
  countEn?: string;
  category?: string;
  imageUrl: string;
  order?: number;
}

export interface LandingNavLink {
  id: string;
  labelAr: string;
  labelEn: string;
  url: string;
  order?: number;
}

export interface LandingStat {
  id: string;
  value: number;
  suffix: string;
  labelAr: string;
  labelEn: string;
}

export interface LandingConfig {
  themeColor: string;
  logoSymbol: string;
  logoUrl: string;
  logoTextAr: string;
  logoTextEn: string;
  heroTitleAr: string;
  heroTitleEn: string;
  heroDescAr: string;
  heroDescEn: string;
  aboutP1Ar: string;
  aboutP1En: string;
  aboutP2Ar: string;
  aboutP2En: string;
  aboutP3Ar: string;
  aboutP3En: string;
  addressAr: string;
  addressEn: string;
  mapUrl?: string;
  showCareSection: boolean;
  showAgentsSection: boolean;
  showLocationSection?: boolean;
  showMarketingSection?: boolean;
  marketingTitleAr?: string;
  marketingTitleEn?: string;
  marketingIntroAr?: string;
  marketingIntroEn?: string;
  marketingVisionTitleAr?: string;
  marketingVisionTitleEn?: string;
  marketingVisionTextAr?: string;
  marketingVisionTextEn?: string;
  marketingCommitmentAr?: string;
  marketingCommitmentEn?: string;
  showVideoSection?: boolean;
  youtubeUrl?: string;
  showStatsSection?: boolean;
  videos: LandingVideo[];
  products: LandingProduct[];
  customNavLinks: LandingNavLink[];
  stats?: LandingStat[];
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    [key: string]: string | undefined;
  };
  phone?: string;
  email?: string;
}
