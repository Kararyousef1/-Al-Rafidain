/**
 * ════════════════════════════════════════════════════════════════
 *  إدارة الحالة الموحدة - نظام الرافدين HR
 *
 *  🔒 إصلاحات الأمان (v2):
 *  1. حُذف localStorage bypass في initialize() — المصادقة عبر Supabase Session فقط
 *  2. loginLocal() أصبح محمياً بعلامة __dev_only ولا يُستدعى في الإنتاج
 *  3. sidebarOpen: false افتراضياً (إصلاح Mobile P0)
 *  4. setActiveView تغلق الـ Sidebar تلقائياً على الشاشات الصغيرة
 * ════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../sdk/supabase';
import { login as sdkLogin, logout as sdkLogout, getUserProfile } from '../sdk/auth';
import {
  addNotification,
  createWelcomeNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../lib/notificationManager';
import {
  fetchNotificationsFromServer,
  markAsReadOnServer,
  markAllAsReadOnServer,
  deleteNotificationOnServer,
  subscribeToRealtimeNotifications,
} from '../lib/notificationService';
import { getEffectivePermissions } from '../constants/permissions';
import { normalizeUser, getUserDisplayName } from '../utils/userUtils';
import type {
  User, Problem, Notification, UserRole,
  WellnessData, ChatMessage, AuditLog, Employee, Analytics,
} from '../types';
import type {
  LandingConfig, LandingVideo, LandingProduct, LandingNavLink, LandingStat,
} from '../types/landing';
import {
  mockUser, mockProblems, mockNotifications,
  mockWellnessData, mockEmployees, mockAnalytics, mockAuditLogs,
} from '../data/dev/mockData';

// ════════════════════════════════════════════════════════════════
//  دالة مساعدة: جلب المستخدم من جدول employees
// ════════════════════════════════════════════════════════════════

async function tryFetchFromEmployees(userId: string): Promise<User | null> {
  try {
    const { data: emp } = await supabase
      .from('employees')
      .select('*, departments(name)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!emp?.user_id) {
      console.warn(`⚠️ Employee with user_id ${userId} not found`);
      return null;
    }

    return normalizeUser({
      id: userId,
      user_id: emp.user_id,
      employee_id: emp.id,
      full_name:
        emp.full_name_ar ||
        `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      email: emp.email || '',
      role: emp.role,
      department: emp.departments?.name || null,
      position: emp.position || null,
      phone: emp.phone || null,
      profile_image: emp.avatar_url || null,
      status: emp.is_active ? 'active' : 'inactive',
      can_manage_breaks: emp.can_manage_breaks || false,
      created_at: emp.created_at,
      updated_at: emp.updated_at,
      permissions: [],
    });
  } catch (error) {
    console.error('Error fetching from employees:', error);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
//  Real-time Subscriptions
// ════════════════════════════════════════════════════════════════

let _profileChannel: ReturnType<typeof supabase.channel> | null = null;
let _notificationUnsubscribe: (() => void) | null = null;

const setupRealtimeProfileSubscription = (
  userId: string | undefined,
  setFn: (partial: Partial<AuthState>) => void,
) => {
  if (_profileChannel) {
    supabase.removeChannel(_profileChannel);
    _profileChannel = null;
  }
  if (!userId) return;

  _profileChannel = supabase
    .channel(`profile-updates-${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
      async () => {
        try {
          const { data: freshProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (freshProfile) {
            const role = (freshProfile.role as UserRole) || 'employee';
            const normalizedUser = normalizeUser({
              ...freshProfile,
              permissions: getEffectivePermissions(role, freshProfile.permissions),
            });
            setFn({ user: normalizedUser });
            console.log('✅ User updated via Realtime');
          }
        } catch (err) {
          console.error('Real-time profile update error:', err);
        }
      },
    )
    .subscribe();
};

// ════════════════════════════════════════════════════════════════
//  Auth Store
// ════════════════════════════════════════════════════════════════

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  /** @deprecated استخدم للتطوير فقط — مقيَّد في بيئة الإنتاج */
  loginLocal: (username: string, role: string, fullName: string) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  cleanup: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  // ─────────────────────────────────────────────────────────────
  //  initialize: يعتمد على Supabase Session فقط
  //  🔒 تم حذف localStorage bypass — لا مصادقة بدون جلسة Supabase
  // ─────────────────────────────────────────────────────────────
  initialize: async () => {
    set({ loading: true });

    try {
      // ══ الخطوة 1: الحصول على الجلسة من Supabase Auth ══
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError.message);
        set({ user: null, isAuthenticated: false, loading: false });
        return;
      }

      if (!session?.user) {
        // لا جلسة صالحة → تنظيف أي بيانات قديمة وإعادة للصفر
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        set({ user: null, isAuthenticated: false, loading: false });
        return;
      }

      // ══ الخطوة 2: جلب بيانات الملف الشخصي ══
      const userId = session.user.id;
      let profile: User | null = null;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        profile = normalizeUser({
          ...profileData,
          permissions: getEffectivePermissions(
            profileData.role as UserRole,
            profileData.permissions,
          ),
        });
      } else {
        // fallback: جدول employees
        console.log('🔄 Profile not found, trying employees table...');
        profile = await tryFetchFromEmployees(userId);
      }

      if (!profile) {
        // مستخدم جديد لا يوجد له ملف — أنشئ مؤقتاً
        profile = normalizeUser({
          id: userId,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'مستخدم جديد',
          role: 'employee',
          permissions: getEffectivePermissions('employee', []),
        });
        console.warn('⚠️ No profile found, using minimal user object');
      }

      set({ user: profile, isAuthenticated: true });
      setupRealtimeProfileSubscription(userId, set as any);

    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }

    // ══ الخطوة 3: مراقبة تغييرات المصادقة ══
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        get().cleanup();
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        set({ user: null, isAuthenticated: false });
        return;
      }

      if (event === 'SIGNED_IN' && session.user) {
        await get().refreshUser();
        setupRealtimeProfileSubscription(session.user.id, set as any);
      }

      if (event === 'TOKEN_REFRESHED' && session.user) {
        console.log('🔄 Token refreshed for:', session.user.id);
      }
    });
  },

  // ─────────────────────────────────────────────────────────────
  //  login: عبر SDK مع Supabase Auth فقط
  // ─────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await sdkLogin(email, password);

      if (!data.user) return false;

      const profile = await getUserProfile(data.user.id);

      if (profile) {
        const normalizedUser = normalizeUser({
          ...profile,
          permissions: getEffectivePermissions(
            profile.role as UserRole,
            profile.permissions,
          ),
        });

        set({ user: normalizedUser, isAuthenticated: true });

        // إشعار الترحيب (مرة واحدة في اليوم)
        createWelcomeNotification(data.user.id);

        const userName = getUserDisplayName(normalizedUser);
        const today = new Date().toISOString().slice(0, 10);

        addNotification(data.user.id, {
          type: 'login',
          priority: 'low',
          title: '👋 مرحباً بعودتك',
          message: `أهلاً ${userName}، تم تسجيل دخولك بنجاح`,
          groupKey: `login-${data.user.id}-${today}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

        setupRealtimeProfileSubscription(data.user.id, set as any);
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────
  //  loginLocal: للتطوير فقط — مقيَّد في production
  //  🔒 لا يُستدعى تلقائياً — يجب استدعاؤه يدوياً من devtools
  // ─────────────────────────────────────────────────────────────
  loginLocal: (username, role, fullName) => {
    if (import.meta.env.PROD) {
      console.error('🚫 loginLocal() ممنوع في بيئة الإنتاج');
      return;
    }

    console.warn('⚠️ loginLocal() للتطوير فقط');
    const userRole = (role as UserRole) || 'employee';

    const normalizedUser = normalizeUser({
      id: `dev-${Date.now()}`,
      username,
      role: userRole,
      full_name: fullName,
      email: `${username}@dev.local`,
      permissions: getEffectivePermissions(userRole, []),
    });

    set({ user: normalizedUser, isAuthenticated: true });
  },

  // ─────────────────────────────────────────────────────────────
  //  logout
  // ─────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      get().cleanup();
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      await sdkLogout();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? normalizeUser({ ...state.user, ...data }) : null,
    })),

  refreshUser: async () => {
    const { isAuthenticated, user } = get();
    if (!isAuthenticated || !user?.id) return;

    try {
      // تحقق من صحة الجلسة أولاً
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ refreshUser: لا توجد جلسة صالحة');
        set({ user: null, isAuthenticated: false });
        return;
      }

      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        profile = await tryFetchFromEmployees(user.id);
      }

      if (profile) {
        set({
          user: normalizeUser({
            ...profile,
            permissions: getEffectivePermissions(
              profile.role as UserRole,
              profile.permissions,
            ),
          }),
        });
        console.log('✅ User refreshed');
      }
    } catch (error) {
      console.error('refreshUser error:', error);
    }
  },

  cleanup: () => {
    if (_profileChannel) {
      supabase.removeChannel(_profileChannel);
      _profileChannel = null;
    }
    if (_notificationUnsubscribe) {
      _notificationUnsubscribe();
      _notificationUnsubscribe = null;
    }
  },
}));

// ════════════════════════════════════════════════════════════════
//  Problem Store
// ════════════════════════════════════════════════════════════════

interface ProblemState {
  problems: Problem[];
  addProblem: (problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProblem: (id: string, data: Partial<Problem>) => void;
  deleteProblem: (id: string) => void;
  addComment: (
    problemId: string,
    text: string,
    authorId: string,
    authorName: string,
    authorRole: string,
  ) => void;
}

export const useProblemStore = create<ProblemState>((set) => ({
  problems: mockProblems,

  addProblem: (problem) =>
    set((state) => ({
      problems: [
        {
          ...problem,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          comments: [],
          timeline: [
            {
              id: '1',
              event: 'تم الإنشاء',
              description: 'تم رفع المشكلة',
              timestamp: new Date().toISOString(),
              actor: 'النظام',
              type: 'created',
            },
          ],
        },
        ...state.problems,
      ],
    })),

  updateProblem: (id, data) =>
    set((state) => ({
      problems: state.problems.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p,
      ),
    })),

  deleteProblem: (id) =>
    set((state) => ({ problems: state.problems.filter((p) => p.id !== id) })),

  addComment: (problemId, text, authorId, authorName, authorRole) =>
    set((state) => ({
      problems: state.problems.map((p) =>
        p.id === problemId
          ? {
              ...p,
              comments: [
                ...(p.comments ?? []),
                {
                  id: Date.now().toString(),
                  text,
                  authorId,
                  authorName,
                  authorRole: authorRole as UserRole,
                  createdAt: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    })),
}));

// ════════════════════════════════════════════════════════════════
//  UI Store
// ════════════════════════════════════════════════════════════════

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export type {
  LandingConfig, LandingVideo, LandingProduct, LandingNavLink, LandingStat,
} from '../types/landing';

const defaultLandingConfig: LandingConfig = {
  themeColor: '#4f46e5',
  logoSymbol: 'ر',
  logoUrl: '',
  logoTextAr: 'الرافدين',
  logoTextEn: 'Al-Rafidain',
  heroTitleAr: 'الابتكار في الرعاية الصحية',
  heroTitleEn: 'Innovation in Healthcare',
  heroDescAr:
    'نحن في شركة الرافدين نسعى لتقديم أفضل المنتجات الطبية والدوائية بأعلى معايير الجودة العالمية.',
  heroDescEn:
    'At Al-Rafidain, we strive to provide the best medical and pharmaceutical products.',
  aboutP1Ar:
    'شركة الرافدين لإنتاج الأدوية هي إحدى أبرز شركات القطاع الخاص المتخصصة في إنتاج الأدوية البشرية.',
  aboutP1En:
    'Al-Rafidain Pharmaceutical Production Company is one of the most prominent private sector companies.',
  aboutP2Ar:
    'تلتزم الشركة بالامتثال التام لمعايير ممارسات التصنيع الجيدة (GMP) التي وضعتها منظمة الصحة العالمية.',
  aboutP2En:
    'The company is committed to full compliance with Good Manufacturing Practices (GMP) standards set by WHO.',
  aboutP3Ar: 'يُعد رضا العملاء أحد الأهداف الرئيسية للشركة.',
  aboutP3En: 'Customer satisfaction is a main goal and fundamental pillar of our strategy.',
  addressAr: 'العراق، بغداد - المنطقة الصناعية',
  addressEn: 'Iraq, Baghdad - Industrial Zone',
  mapUrl: '',
  showCareSection: true,
  showAgentsSection: true,
  showMarketingSection: true,
  showLocationSection: true,
  marketingTitleAr: 'التسويق والمبيعات',
  marketingTitleEn: 'Marketing & Sales',
  marketingIntroAr: 'منذ تأسيسها، تهدف سياسة الشركة إلى إنشاء فريق متطور وفعال.',
  marketingIntroEn: 'Since its establishment, Al-Rafidain policy has aimed to build an effective team.',
  marketingVisionTitleAr: 'رؤيتنا',
  marketingVisionTitleEn: 'Our Vision',
  marketingVisionTextAr: 'نسعى لضمان توفر أدوية عالية الجودة في جميع محافظات العراق.',
  marketingVisionTextEn: 'We strive to ensure high-quality medicines in all Iraqi governorates.',
  marketingCommitmentAr: 'نحن ملتزمون بالعمل من أجل عالم أكثر سعادة.',
  marketingCommitmentEn: 'We are committed to working for a happier world.',
  showVideoSection: false,
  youtubeUrl: '',
  videos: [],
  products: [
    {
      id: '1', titleAr: 'قسم الحبوب', titleEn: 'Tablets',
      descAr: 'منتجات دوائية عالية الجودة', descEn: 'High-quality pharmaceutical products',
      detailsAr: '', detailsEn: '', imageUrl: '',
    },
    {
      id: '2', titleAr: 'قسم المساحيق', titleEn: 'Powders',
      descAr: 'مساحيق طبية متطورة', descEn: 'Advanced medical powders',
      detailsAr: '', detailsEn: '', imageUrl: '',
    },
  ],
  stats: [
    { id: 's1', value: 25, suffix: '+', labelAr: 'سنة خبرة', labelEn: 'Years Experience' },
    { id: 's2', value: 500, suffix: '+', labelAr: 'منتج دوائي', labelEn: 'Products' },
  ],
  customNavLinks: [],
  socialLinks: {},
  phone: '',
  email: '',
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

  // إشعارات محسَّنة
  loadNotificationsFromServer: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
  markNotificationReadEnhanced: (userId: string, id: string) => Promise<void>;
  markAllReadEnhanced: (userId: string) => Promise<void>;
  deleteNotificationEnhanced: (userId: string, id: string) => Promise<void>;
  syncNotifications: (userId: string) => Promise<void>;
}

/** تحقق من أن الاتصال بـ Supabase متاح (وليس مستخدماً محلياً) */
const hasSupabaseSession = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // ══ القيمة الافتراضية false بدلاً من true (إصلاح Mobile P0) ══
      sidebarOpen: false,
      activeView: 'employee-dashboard',
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

      // ══ تغلق الـ Sidebar تلقائياً على الشاشات الصغيرة ══
      setActiveView: (view) =>
        set(() => {
          const isSmallScreen =
            typeof window !== 'undefined' && window.innerWidth < 1024;
          return {
            activeView: view,
            ...(isSmallScreen ? { sidebarOpen: false } : {}),
          };
        }),

      updateLandingConfig: (config) =>
        set((state) => ({ landingConfig: { ...state.landingConfig, ...config } })),

      fetchLandingConfig: async () => {
        // تحقق من وجود جلسة قبل الاستعلام
        const hasSession = await hasSupabaseSession();
        if (!hasSession) {
          set({ isLoadingConfig: false });
          return;
        }

        set({ isLoadingConfig: true });
        try {
          const { data, error } = await supabase
            .from('system_settings')
            .select('landing_config')
            .eq('id', 'singleton')
            .single();

          if (!error && data?.landing_config) {
            set({ landingConfig: { ...defaultLandingConfig, ...data.landing_config } });
          }
        } catch (err) {
          console.warn('Failed to fetch landing config:', err);
        } finally {
          set({ isLoadingConfig: false });
        }
      },

      saveLandingConfig: async (config) => {
        const hasSession = await hasSupabaseSession();
        if (!hasSession) {
          set({ landingConfig: config });
          return { success: true };
        }

        set({ isSavingConfig: true });
        try {
          const { error } = await supabase
            .from('system_settings')
            .upsert(
              { id: 'singleton', landing_config: config, updated_at: new Date().toISOString() },
              { onConflict: 'id' },
            );

          if (error) {
            return { success: false, error: `خطأ في الصلاحيات: ${error.message}` };
          }

          set({ landingConfig: config });
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message };
        } finally {
          set({ isSavingConfig: false });
        }
      },

      uploadImage: async (file, path) => {
        const hasSession = await hasSupabaseSession();
        if (!hasSession) return URL.createObjectURL(file);

        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${path}/${Date.now()}.${fileExt}`;

          const { error } = await supabase.storage
            .from('public-assets')
            .upload(fileName, file, { upsert: true });

          if (error) throw error;

          const { data } = supabase.storage
            .from('public-assets')
            .getPublicUrl(fileName);

          return data.publicUrl;
        } catch (err) {
          console.error('Upload failed:', err);
          return null;
        }
      },

      addWellnessEntry: (entry) =>
        set((state) => ({ wellnessData: [entry, ...state.wellnessData] })),

      addChatMessage: (message) =>
        set((state) => ({ chatMessages: [...state.chatMessages, message] })),

      clearChat: () => set({ chatMessages: [] }),

      addToast: (message, type = 'info') => {
        const id = Date.now().toString();
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(
          () => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
          4000,
        );
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      // ════════════════════════════════════════════════════════
      //  🔔 دوال الإشعارات المحسَّنة
      // ════════════════════════════════════════════════════════

      loadNotificationsFromServer: async (userId) => {
        try {
          const serverNotifications = await fetchNotificationsFromServer(userId, 50);

          const converted = serverNotifications.map((n: any) => ({
            id: n.id,
            type: n.type,
            priority: n.priority,
            title: n.title,
            message: n.message,
            read: n.is_read,
            createdAt: n.created_at,
            readAt: n.read_at,
            userId: n.user_id,
            actionUrl: n.action_url,
            groupKey: n.group_key,
            metadata: n.metadata || {},
            expiresAt: n.expires_at,
          }));

          const localNotifs = getUserNotifications(userId);
          const serverIds = new Set(converted.map((n: Notification) => n.id));
          const uniqueLocal = localNotifs.filter(
            (n) => !serverIds.has(n.id) && n.id.startsWith('notif_'),
          );

          const merged = [...converted, ...uniqueLocal].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

          set({ notifications: merged });
        } catch (error) {
          console.error('loadNotificationsFromServer error:', error);
          set({ notifications: getUserNotifications(userId) });
        }
      },

      subscribeToNotifications: (userId) => {
        if (_notificationUnsubscribe) _notificationUnsubscribe();

        _notificationUnsubscribe = subscribeToRealtimeNotifications(
          userId,
          (newNotif: any) => {
            set((state) => {
              if (state.notifications.some((n) => n.id === newNotif.id)) return state;

              const converted: Notification = {
                id: newNotif.id,
                type: newNotif.type,
                priority: newNotif.priority,
                title: newNotif.title,
                message: newNotif.message,
                read: newNotif.is_read,
                createdAt: newNotif.created_at,
                readAt: newNotif.read_at,
                userId: newNotif.user_id,
                actionUrl: newNotif.action_url,
                groupKey: newNotif.group_key,
                metadata: newNotif.metadata || {},
                expiresAt: newNotif.expires_at,
              };

              return { notifications: [converted, ...state.notifications] };
            });
          },
        );
      },

      unsubscribeFromNotifications: () => {
        if (_notificationUnsubscribe) {
          _notificationUnsubscribe();
          _notificationUnsubscribe = null;
        }
      },

      markNotificationReadEnhanced: async (userId, id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n,
          ),
        }));
        await markAsReadOnServer(userId, id);
        markAsRead(userId, id);
      },

      markAllReadEnhanced: async (userId) => {
        const now = new Date().toISOString();
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n, read: true, readAt: n.readAt || now,
          })),
        }));
        await markAllAsReadOnServer(userId);
        markAllAsRead(userId);
      },

      deleteNotificationEnhanced: async (userId, id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
        await deleteNotificationOnServer(userId, id);
        deleteNotification(userId, id);
      },

      syncNotifications: async (userId) => {
        await get().loadNotificationsFromServer(userId);
      },

      // دوال التوافق القديمة
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
    }),
    {
      name: 'rafidain-hr-ui',
      partialize: (state) => ({
        // 🔒 لا نحفظ sidebarOpen في persist لتجنب مشاكل الموبايل
        activeView: state.activeView,
        landingConfig: state.landingConfig,
        // لا نحفظ notifications — تُحمَّل من السيرفر دائماً
      }),
    },
  ),
);
