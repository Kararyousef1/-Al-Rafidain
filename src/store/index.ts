import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type {
  User, Problem, Notification, UserRole,
  WellnessData, ChatMessage, AuditLog, Employee, Analytics
} from '../types';
import type { LandingConfig, LandingVideo, LandingProduct, LandingNavLink, LandingStat } from '../types/landing';
import {
  mockUser, mockProblems, mockNotifications,
  mockWellnessData, mockEmployees, mockAnalytics, mockAuditLogs
} from '../data/mockData';

// الصلاحيات الافتراضية لكل دور
const defaultRolePermissions: Record<UserRole, string[]> = {
  employee: ['dashboard', 'problems', 'wellness', 'survey', 'training', 'sops', 'ai-chat', 'contact', 'profile', 'notifications', 'attendance', 'leave-requests'],
  hr: ['dashboard', 'movement-analysis', 'problems', 'analytics', 'team', 'talent-market', 'communication', 'reports', 'notifications'],
  gatekeeper: ['gatekeeper-portal', 'notifications'],
  admin: ['dashboard', 'cms', 'employees', 'permissions', 'gatekeeper-permissions', 'reports', 'settings', 'audit-log', 'sops', 'sops-reports', 'ai-config', 'notifications', 'gallery-video', 'attendance', 'leave-requests', 'developer-db'],
  developer: ['developer-dashboard', 'developer-attendance', 'developer-logs', 'developer-db', 'notifications', 'dashboard'],
  supervisor: ['dashboard', 'problems', 'team', 'reports', 'supervisor-breaks', 'profile', 'attendance', 'leave-requests', 'notifications'],
  manager: ['dashboard', 'problems', 'team', 'reports', 'analytics', 'supervisor-breaks', 'profile', 'attendance', 'leave-requests', 'notifications'],
};

const getEffectivePermissions = (role: UserRole, dbPermissions?: string[] | null) => {
  if (dbPermissions && Array.isArray(dbPermissions) && dbPermissions.length > 0) {
    return dbPermissions;
  }
  return defaultRolePermissions[role] || defaultRolePermissions['employee'];
};

let _profileChannel: any = null;

const setupRealtimeProfileSubscription = (userId: string | undefined, setFn: any) => {
  if (!userId) return;
  if (_profileChannel) {
    supabase.removeChannel(_profileChannel);
    _profileChannel = null;
  }
  
  // يشترك في تغييرات جدول profiles للمستخدم الحالي
  const channel = supabase
    .channel(`profile-updates-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      async (payload) => {
        console.log('🔄 Profile updated in real-time, refreshing sidebar permissions...');
        const newProfile = payload.new as any;
        const role = (newProfile.role as UserRole) || 'employee';
        
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (freshProfile) {
          setFn({
            user: {
              ...freshProfile,
              permissions: getEffectivePermissions(role, freshProfile.permissions),
            },
          });
          console.log('✅ Sidebar permissions updated from real-time subscription');
        }
      }
    )
    .subscribe();
  
  _profileChannel = channel;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  loginLocal: (username: string, role: string, fullName: string) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  initialize: async () => {
    set({ loading: true });
    try {
      const localUser = localStorage.getItem('user');
      const localRole = localStorage.getItem('userRole');
      
      if (localUser && localRole) {
        try {
          const parsedUser = JSON.parse(localUser);
          set({
            user: {
              ...mockUser,
              id: parsedUser.id,
              username: parsedUser.username,
              role: parsedUser.role as any,
              full_name: parsedUser.full_name,
              email: '',
            },
            isAuthenticated: true,
          });
          set({ loading: false });
          return;
        } catch (e) {
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
        }
      }
      
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const role = (profile?.role as UserRole) || 'employee';
        set({
          user: profile ? {
            ...profile,
            permissions: getEffectivePermissions(role, profile.permissions),
          } : {
            ...mockUser,
            id: session.user.id,
            email: session.user.email ?? '',
            role: role,
            permissions: getEffectivePermissions(role, []),
          },
          isAuthenticated: true,
        });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        if (event === 'SIGNED_IN' && session.user) {
          await get().refreshUser();
          setupRealtimeProfileSubscription(session.user.id, set);
        }
      });

      if (session?.user) {
        setupRealtimeProfileSubscription(session.user.id, set);
      }
    } catch (err) {
      console.error('Auth init error:', err);
    } finally {
      set({ loading: false });
    }
  },

  /** دالة لإعادة تحميل بيانات المستخدم من Supabase فوراً */
  refreshUser: async () => {
    const state = get();
    if (!state.isAuthenticated || !state.user?.id) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', state.user.id)
        .maybeSingle();

      if (profile) {
        const role = (profile.role as UserRole) || 'employee';
        set({
          user: {
            ...profile,
            permissions: getEffectivePermissions(role, profile.permissions),
          },
        });
        console.log('✅ User profile manually refreshed');
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const finalEmail = email.includes('@') ? email : `${email}@kayan.hr`;
      const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        const role = (profile?.role as UserRole) || 'employee';
        set({
          user: profile ? {
            ...profile,
            permissions: getEffectivePermissions(role, profile.permissions),
          } : {
            ...mockUser,
            id: data.user.id,
            email: data.user.email ?? '',
            role: role,
            permissions: getEffectivePermissions(role, []),
          },
          isAuthenticated: true,
        });
        setupRealtimeProfileSubscription(data.user.id, set);
      }
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  loginLocal: (username, role, fullName) => {
    const userRole = (role as UserRole) || 'employee';
    const localUser = {
      id: 'emp-' + Date.now(),
      username,
      role: userRole,
      full_name: fullName,
    };
    
    localStorage.setItem('user', JSON.stringify(localUser));
    localStorage.setItem('userRole', userRole);
    
    set({
      user: {
        ...mockUser,
        id: localUser.id,
        username: localUser.username,
        role: userRole,
        full_name: localUser.full_name,
        email: '',
        permissions: getEffectivePermissions(userRole, []),
      },
      isAuthenticated: true,
    });
  },

  logout: async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    if (_profileChannel) {
      supabase.removeChannel(_profileChannel);
      _profileChannel = null;
    }
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),
}));

// ══════════════════════════════════════════
//  PROBLEM STORE
// ══════════════════════════════════════════
interface ProblemState {
  problems: Problem[];
  addProblem: (problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProblem: (id: string, data: Partial<Problem>) => void;
  deleteProblem: (id: string) => void;
  addComment: (problemId: string, text: string, authorId: string, authorName: string, authorRole: string) => void;
}

export const useProblemStore = create<ProblemState>((set) => ({
  problems: mockProblems,
  addProblem: (problem) =>
    set((state) => ({
      problems: [{
        ...problem,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: [],
        timeline: [{
          id: '1',
          event: 'تم الإنشاء',
          description: 'تم رفع المشكلة',
          timestamp: new Date().toISOString(),
          actor: 'النظام',
          type: 'created',
        }],
      }, ...state.problems],
    })),
  updateProblem: (id, data) =>
    set((state) => ({
      problems: state.problems.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      ),
    })),
  deleteProblem: (id) =>
    set((state) => ({
      problems: state.problems.filter((p) => p.id !== id),
    })),
  addComment: (problemId, text, authorId, authorName, authorRole) =>
    set((state) => ({
      problems: state.problems.map((p) =>
        p.id === problemId
          ? {
              ...p,
              comments: [...(p.comments ?? []), {
                id: Date.now().toString(),
                text,
                authorId,
                authorName,
                authorRole: authorRole as any,
                createdAt: new Date().toISOString(),
              }],
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    })),
}));

// ══════════════════════════════════════════
//  UI STORE
// ══════════════════════════════════════════
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export type { LandingConfig, LandingVideo, LandingProduct, LandingNavLink, LandingStat } from '../types/landing';

const defaultLandingConfig: LandingConfig = {
  themeColor: '#4f46e5',
  logoSymbol: 'R',
  logoUrl: '',
  logoTextAr: 'الرافدين',
  logoTextEn: 'Al-Rafidain',
  heroTitleAr: 'الابتكار في الرعاية الصحية',
  heroTitleEn: 'Innovation in Healthcare',
  heroDescAr: 'نحن في شركة الرافدين نسعى لتقديم أفضل المنتجات الطبية والدوائية بأعلى معايير الجودة العالمية، لضمان صحة وسلامة مجتمعنا.',
  heroDescEn: 'At Al-Rafidain, we strive to provide the best medical and pharmaceutical products with the highest global quality standards to ensure the health and safety of our community.',
  aboutP1Ar: 'شركة الرافدين لإنتاج الأدوية هي إحدى أبرز وأعرق شركات القطاع الخاص المتخصصة في إنتاج الأدوية البشرية. تأسست الشركة عام ١٩٩٨ في العاصمة بغداد، وسرعان ما تبوأت مكانةً رائدةً في مجال تصنيع الأدوية والرعاية الصحية.',
  aboutP1En: 'Al-Rafidain Pharmaceutical Production Company is one of the most prominent and prestigious private sector companies specializing in human medicine production. Founded in 1998 in the capital, Baghdad, the company quickly established a leading position in pharmaceutical manufacturing and healthcare.',
  aboutP2Ar: 'تلتزم الشركة بالامتثال التام لمعايير ممارسات التصنيع الجيدة (GMP) التي وضعتها منظمة الصحة العالمية (WHO)، من خلال رقابة صارمة من مختبرات مراقبة الجودة التابعة لها. ويقود جهود الشركة المتواصلة والمتزايدة لكسب ثقة العملاء كوادرها الفنية والمهنية، والتي تضم عددًا من الخبراء ذوي الخبرة. ويعمل لدى الشركة أكثر من مائة موظف من مختلف المجالات والتخصصات العلمية، والذين يخضعون بانتظام لدورات تدريبية تنظمها الإدارة بالتعاون مع مختلف المعاهد الدولية، إيمانًا منها بضرورة ضمان تقدم الشركة وتعزيز مهارات الموظفين.',
  aboutP2En: 'The company is committed to full compliance with Good Manufacturing Practices (GMP) standards set by the World Health Organization (WHO), through strict control by its quality control laboratories. The company\'s continuous efforts to earn customer trust are led by its technical and professional staff, including seasoned experts. The company employs over a hundred staff members from various scientific fields, who regularly undergo training courses in cooperation with international institutes to ensure progress and enhance skills.',
  aboutP3Ar: 'يُعد رضا العملاء أحد الأهداف الرئيسية التي تجذب اهتمام الشركة باستمرار، ويُعتبر ركنًا أساسيًا من استراتيجيتها. منذ تأسيسها، سعت الشركة جاهدةً لتزويد عملائها بمنتجات تجمع بين الجودة والفعالية والسلامة والأسعار التنافسية. وقد منح هذا، إلى جانب العديد من العوامل الأخرى، الشركة الأفضلية على منافسيها على مر السنين.',
  aboutP3En: 'Customer satisfaction is a main goal and a fundamental pillar of our strategy. Since its inception, the company has strived to provide products that combine quality, efficacy, safety, and competitive prices. This commitment has given the company an edge over its competitors over the years.',
  addressAr: 'العراق، بغداد - المنطقة الصناعية',
  addressEn: 'Iraq, Baghdad - Industrial Zone',
  mapUrl: '',
  showCareSection: true,
  showAgentsSection: true,
  showMarketingSection: true,
  showLocationSection: true,
  marketingTitleAr: 'التسويق والمبيعات',
  marketingTitleEn: 'Marketing & Sales',
  marketingIntroAr: 'منذ تأسيسها، تهدف سياسة شركة وادي الرافيدين لإنتاج الأدوية إلى إنشاء فريق متطور وفعال يتكون من أطباء وصيادلة يعملون في مجال الترويج، بالإضافة إلى مراكز مبيعات موزعة في جميع المحافظات لربط المنتج بالمستهلك. تمتلك الشركة أيضا ثلاثة مستودعات رئيسية تقع في العاصمة بغداد، وهي مسؤولة عن إدارة والإشراف على الترويج الدوائي والتجاري في جميع المحافظات.',
  marketingIntroEn: 'Since its establishment, Al-Rafidain Pharmaceutical Production Company\'s policy has aimed to build a developed and effective team of doctors and pharmacists working in promotion, along with sales centers distributed across all governorates to connect the product with the consumer. The company also owns three main warehouses in Baghdad, responsible for managing and supervising pharmaceutical and commercial promotion across all governorates.',
  marketingVisionTitleAr: 'رؤيتنا',
  marketingVisionTitleEn: 'Our Vision',
  marketingVisionTextAr: 'يسعى سعينا لضمان توفر أدوية عالية الجودة وبأسعار معقولة في جميع محافظات العراق.',
  marketingVisionTextEn: 'We strive to ensure the availability of high-quality medicines at reasonable prices in all governorates of Iraq.',
  marketingCommitmentAr: 'نحن ملتزمون بالعمل من أجل عالم أكثر سعادة لأننا من أبرز شركات الأدوية في العراق.',
  marketingCommitmentEn: 'We are committed to working for a happier world as we are one of the leading pharmaceutical companies in Iraq.',
  showVideoSection: false,
  youtubeUrl: '',
  videos: [],
  products: [
    { id: '1', titleAr: 'قسم الحبوب', titleEn: 'Tablets Dept', descAr: 'وصف مختصر لقسم الحبوب', descEn: 'Short description for Tablets Dept', detailsAr: 'تفاصيل التصنيع والمواد الفعالة...', detailsEn: 'Production details and active ingredients...', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5e4a83350?auto=format&fit=crop&w=400&q=80' },
    { id: '2', titleAr: 'قسم المساحيق', titleEn: 'Powders Dept', descAr: 'وصف مختصر لقسم المساحيق', descEn: 'Short description for Powders Dept', detailsAr: '', detailsEn: '', imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=400&q=80' },
    { id: '3', titleAr: 'قسم الشرابات والمعلقات', titleEn: 'Syrups & Suspensions', descAr: 'وصف مختصر لقسم الشرابات', descEn: 'Short description for Syrups', detailsAr: '', detailsEn: '', imageUrl: 'https://images.unsplash.com/photo-1550572017-e95e840d5b40?auto=format&fit=crop&w=400&q=80' },
    { id: '4', titleAr: 'قسم المراهم والكريمات', titleEn: 'Ointments & Creams', descAr: 'وصف مختصر لقسم المراهم', descEn: 'Short description for Ointments', detailsAr: '', detailsEn: '', imageUrl: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=400&q=80' },
  ],
  stats: [
    { id: 's1', value: 20, suffix: '+', labelAr: 'سنة خبرة', labelEn: 'Years Experience' },
    { id: 's2', value: 500, suffix: '+', labelAr: 'منتج دوائي', labelEn: 'Products' },
    { id: 's3', value: 1000, suffix: '+', labelAr: 'عميل موثوق', labelEn: 'Trusted Clients' },
    { id: 's4', value: 50, suffix: '+', labelAr: 'وكيل معتمد', labelEn: 'Certified Agents' },
  ],
  customNavLinks: [],
  socialLinks: {},
  phone: '',
  email: ''
};

interface UIState {
  sidebarOpen: boolean;
  activeView: string;
  landingConfig: LandingConfig;
  userPermissions: string[];
  isLoadingConfig?: boolean;
  isSavingConfig?: boolean;
  notifications: Notification[];
  wellnessData: WellnessData[];
  chatMessages: ChatMessage[];
  auditLogs: AuditLog[];
  employees: Employee[];
  analytics: Analytics;
  toasts: Toast[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: string) => void;
  updateLandingConfig: (config: Partial<LandingConfig>) => void;
  fetchLandingConfig: () => Promise<void>;
  saveLandingConfig: (config: LandingConfig) => Promise<{ success: boolean; error?: string }>;
  uploadImage: (file: File, path: string) => Promise<string | null>;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  addWellnessEntry: (entry: WellnessData) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const isLocalUser = () => {
  const user = localStorage.getItem('user');
  return !!user;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeView: 'dashboard',
      landingConfig: defaultLandingConfig,
      userPermissions: [],
      isLoadingConfig: false,
      isSavingConfig: false,
      notifications: mockNotifications,
      wellnessData: mockWellnessData,
      chatMessages: [],
      auditLogs: mockAuditLogs,
      employees: mockEmployees,
      analytics: mockAnalytics,
      toasts: [],

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveView: (view) => set((state) => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          return { activeView: view, sidebarOpen: false };
        }
        return { activeView: view };
      }),
      updateLandingConfig: (config) => set((state) => ({ landingConfig: { ...state.landingConfig, ...config } })),

      fetchLandingConfig: async () => {
        if (isLocalUser()) {
          set({ isLoadingConfig: false });
          return;
        }
        set({ isLoadingConfig: true });
        try {
          const { data, error } = await supabase.from('system_settings').select('landing_config').eq('id', 'singleton').single();
          if (!error && data?.landing_config) {
            set({ landingConfig: { ...defaultLandingConfig, ...data.landing_config } });
          } else if (error) {
            console.warn('⚠️ system_settings:', error.message);
          }
        } catch (err) {
          console.warn('⚠️ Failed to fetch config:');
        } finally {
          set({ isLoadingConfig: false });
        }
      },

      saveLandingConfig: async (config: LandingConfig) => {
        if (isLocalUser()) {
          set({ landingConfig: config });
          return { success: true };
        }
        set({ isSavingConfig: true });
        try {
          const { error } = await supabase.from('system_settings')
            .upsert({ id: 'singleton', landing_config: config, updated_at: new Date().toISOString() }, { onConflict: 'id' });
          if (error) {
            console.warn('⚠️ system_settings RLS:', error.message);
            return { success: false, error: `خطأ RLS: ${error.message}` };
          }
          set({ landingConfig: config });
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message };
        } finally {
          set({ isSavingConfig: false });
        }
      },

      uploadImage: async (file: File, path: string) => {
        if (isLocalUser()) {
          return URL.createObjectURL(file);
        }
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${path}/${Date.now()}.${fileExt}`;
          const { error } = await supabase.storage.from('public-assets').upload(fileName, file, { upsert: true });
          if (error) throw error;
          const { data } = supabase.storage.from('public-assets').getPublicUrl(fileName);
          return data.publicUrl;
        } catch (err) {
          console.error('Upload failed:', err);
          return null;
        }
      },

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      addWellnessEntry: (entry) =>
        set((state) => ({ wellnessData: [entry, ...state.wellnessData] })),

      addChatMessage: (message) =>
        set((state) => ({ chatMessages: [...state.chatMessages, message] })),

      clearChat: () => set({ chatMessages: [] }),

      addToast: (message, type = 'info') => {
        const id = Date.now().toString();
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }],
        }));
        setTimeout(() =>
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          })), 4000
        );
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'kayan-hr-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        activeView: state.activeView,
        landingConfig: state.landingConfig,
      }),
    }
  )
);