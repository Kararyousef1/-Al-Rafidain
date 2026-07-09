/**
 * ════════════════════════════════════════════════════════════════
 *  إدارة الحالة الموحدة - نظام الرافدين HR (نسخة SDK)
 *  تمت إزالة جميع استدعاءات Supabase المباشرة
 *  والاعتماد على طبقة SDK فقط
 * ════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../../services/supabase/supabase';
import { authService } from '../../services/sdk/AuthService';
import { userService } from '../../services/sdk/UserService';
import { settingsService } from '../../services/sdk/SettingsService';
import {
  addNotification,
  createWelcomeNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../services/notifications/notificationManager';
import {
  fetchNotificationsFromServer,
  markAsReadOnServer,
  markAllAsReadOnServer,
  deleteNotificationOnServer,
  subscribeToRealtimeNotifications,
} from '../../services/notifications/notificationService';
import type { RealtimeNotificationEvent } from '../../services/notifications/notificationService';
import { getEffectivePermissions } from '../constants/permissions';
import { normalizeUser, getUserDisplayName } from '../../utils/userUtils';
import { getErrorMessage } from '../../services/errors';
import type {
  User, Problem, Notification, UserRole,
  WellnessData, ChatMessage, AuditLog, Employee, Analytics,
} from '../../shared/types';
import type {
  LandingConfig, LandingVideo, LandingProduct, LandingNavLink, LandingStat,
} from '../../shared/types/landing';
import {
  mockUser, mockProblems, mockNotifications,
  mockWellnessData, mockEmployees, mockAnalytics, mockAuditLogs,
} from '../../data/dev/mockData';

// ════════════════════════════════════════════════════
// أنواع محلية
// ════════════════════════════════════════════════════

/** إشعار من Supabase (الشكل الخام) */
interface ServerNotification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  user_id: string;
  action_url?: string;
  group_key?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
}

/** تحويل ServerNotification → Notification */
function convertServerNotification(n: ServerNotification): Notification {
  return {
    id: n.id,
    type: (n.type as Notification['type']) || 'info',
    title: n.title,
    message: n.message,
    read: n.is_read || false,
    createdAt: n.created_at,
    readAt: n.read_at,
    recipient_id: n.user_id,
    link: n.action_url,
  };
}

// ════════════════════════════════════════════════════════════════
//  Real-time Subscriptions
// ════════════════════════════════════════════════════════════════

let _profileChannel: ReturnType<typeof supabase.channel> | null = null;
let _notificationUnsubscribe: (() => void) | null = null;

const setupRealtimeProfileSubscription = (
  userId: string | undefined,
  updateUser: (user: User) => void,
): void => {
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
          const freshProfile = await userService.findUserById(userId);
          if (freshProfile) {
            const role = (freshProfile.role as UserRole) || 'employee';
            const normalizedUser = normalizeUser({
              ...freshProfile,
              permissions: getEffectivePermissions(role, freshProfile.permissions),
            });
            updateUser(normalizedUser);
            console.log('✅ User updated via Realtime');
          }
        } catch (err) {
          console.error('Real-time profile update error:', getErrorMessage(err));
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

  // ─────────────────────────────────────────────────
  //  initialize
  // ─────────────────────────────────────────────────
  initialize: async () => {
    set({ loading: true });

    try {
      // ✅ استخدام AuthService بدلاً من supabase.auth.getSession()
      const session = await authService.getSession();

      if (!session?.session?.user) {
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        set({ user: null, isAuthenticated: false, loading: false });
        return;
      }

      const userId = session.session.user.id;
      let profile: User | null = null;

      // ✅ استخدام UserService بدلاً من supabase.from('profiles')
      const userProfile = await userService.findUserById(userId);

      if (userProfile) {
        profile = normalizeUser({
          ...userProfile,
          permissions: getEffectivePermissions(
            userProfile.role as UserRole,
            userProfile.permissions,
          ),
        });
      }

      if (!profile) {
        profile = normalizeUser({
          id: userId,
          email: session.session.user.email || '',
          full_name: 'مستخدم جديد',
          role: 'employee',
          permissions: getEffectivePermissions('employee', []),
        });
        console.warn('⚠️ No profile found, using minimal user object');
      }

      set({ user: profile, isAuthenticated: true, loading: false });
      setupRealtimeProfileSubscription(userId, (user) => set({ user }));

    } catch (error) {
      console.error('Auth initialization error:', getErrorMessage(error));
      set({ user: null, isAuthenticated: false, loading: false });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────
  //  login
  // ─────────────────────────────────────────────────
  login: async (email, password) => {
    try {
      const data = await authService.login(email, password);
      if (!data.user) return false;
      const profile = await userService.findUserById(data.user.id);
      if (profile) {
        const tenantId = localStorage.getItem('tenant_id') || undefined;

        const normalizedUser = normalizeUser({
          ...profile,
          tenant_id: tenantId,
          permissions: getEffectivePermissions(
            profile.role as UserRole,
            profile.permissions,
          ),
        });
        set({ user: normalizedUser, isAuthenticated: true });

        const ROLE_DEFAULT_VIEW: Record<string, string> = {
          developer:  'developer-dashboard',
          hr:         'hr-dashboard',
          admin:      'admin-dashboard',
          employee:   'employee-dashboard',
          gatekeeper: 'gatekeeper-portal',
          supervisor: 'employee-dashboard',
          manager:    'manager-dashboard',
        };
        const defaultView = ROLE_DEFAULT_VIEW[normalizedUser.role] ?? 'employee-dashboard';
        useUIStore.getState().setActiveView(defaultView);
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
        setupRealtimeProfileSubscription(data.user.id, (user) => set({ user }));
      }
      return true;
    } catch (error) {
      console.error('Login error:', getErrorMessage(error));
      throw error;
    }
  },

  // ─────────────────────────────────────────────────
  //  loginLocal (dev only)
  // ─────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────
  //  logout
  // ─────────────────────────────────────────────────
  logout: async () => {
    try {
      get().cleanup();
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      await authService.logout();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', getErrorMessage(error));
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
      // ✅ استخدام AuthService بدلاً من supabase.auth.getSession()
      const session = await authService.getSession();
      if (!session?.session?.user) {
        console.warn('⚠️ refreshUser: لا توجد جلسة صالحة');
        set({ user: null, isAuthenticated: false });
        return;
      }

      // ✅ استخدام UserService بدلاً من supabase.from('profiles')
      const profile = await userService.findUserById(user.id);

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
      console.error('refreshUser error:', getErrorMessage(error));
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
} from '../../shared/types/landing';

const defaultLandingConfig: LandingConfig = {
  themeColor: '#4f46e5',
  logoSymbol: 'ر',
  logoUrl: '',
  logoTextAr: 'الرافدين',
  logoTextEn: 'Al-Rafidain',
  heroTitleAr: 'الابتكار في الرعاية الصحية',
  heroTitleEn: 'Innovation in Healthcare',
  heroDescAr: 'نحن في شركة الرافدين نسعى لتقديم أفضل المنتجات الطبية والدوائية بأعلى معايير الجودة العالمية.',
  heroDescEn: 'At Al-Rafidain, we strive to provide the best medical and pharmaceutical products.',
  aboutP1Ar: 'شركة الرافدين لإنتاج الأدوية هي إحدى أبرز شركات القطاع الخاص المتخصصة في إنتاج الأدوية البشرية.',
  aboutP1En: 'Al-Rafidain Pharmaceutical Production Company is one of the most prominent private sector companies.',
  aboutP2Ar: 'تلتزم الشركة بالامتثال التام لمعايير ممارسات التصنيع الجيدة (GMP) التي وضعتها منظمة الصحة العالمية.',
  aboutP2En: 'The company is committed to full compliance with Good Manufacturing Practices (GMP) standards set by WHO.',
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
    { id: '1', titleAr: 'قسم الحبوب', titleEn: 'Tablets', descAr: 'منتجات دوائية عالية الجودة', descEn: 'High-quality pharmaceutical products', detailsAr: '', detailsEn: '', imageUrl: '' },
    { id: '2', titleAr: 'قسم المساحيق', titleEn: 'Powders', descAr: 'مساحيق طبية متطورة', descEn: 'Advanced medical powders', detailsAr: '', detailsEn: '', imageUrl: '' },
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

  loadNotificationsFromServer: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
  markNotificationReadEnhanced: (userId: string, id: string) => Promise<void>;
  markAllReadEnhanced: (userId: string) => Promise<void>;
  deleteNotificationEnhanced: (userId: string, id: string) => Promise<void>;
  syncNotifications: (userId: string) => Promise<void>;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
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

      setActiveView: (view) =>
        set(() => {
          const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1024;
          return { activeView: view, ...(isSmallScreen ? { sidebarOpen: false } : {}) };
        }),

      updateLandingConfig: (config) =>
        set((state) => ({ landingConfig: { ...state.landingConfig, ...config } })),

      fetchLandingConfig: async () => {
        set({ isLoadingConfig: true });
        try {
          // ✅ استخدام SettingsService بدلاً من supabase.from('system_settings')
          const settings = await settingsService.findSystemSettings();
          if (settings?.landing_config) {
            set({ landingConfig: { ...defaultLandingConfig, ...settings.landing_config } });
          }
        } catch (err) {
          console.warn('Failed to fetch landing config:', getErrorMessage(err));
        } finally {
          set({ isLoadingConfig: false });
        }
      },

      saveLandingConfig: async (config) => {
        set({ isSavingConfig: true });
        try {
          const current = await settingsService.findSystemSettings();
          if (current) {
            await settingsService.updateSystemSettings(current.id, {
              landing_config: config,
              updated_at: new Date().toISOString(),
            } as unknown as Record<string, unknown>);
          } else {
            await settingsService.create({
              id: 'singleton',
              landing_config: config,
              updated_at: new Date().toISOString(),
            } as unknown as Record<string, unknown>);
          }
          set({ landingConfig: config });
          return { success: true };
        } catch (err) {
          return { success: false, error: getErrorMessage(err) };
        } finally {
          set({ isSavingConfig: false });
        }
      },

      uploadImage: async (file, path) => {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${path}/${Date.now()}.${fileExt}`;
          const { error } = await supabase.storage.from('public-assets').upload(fileName, file, { upsert: true });
          if (error) throw error;
          const { data } = supabase.storage.from('public-assets').getPublicUrl(fileName);
          return data.publicUrl;
        } catch (err) {
          console.error('Upload failed:', getErrorMessage(err));
          return null;
        }
      },

      addWellnessEntry: (entry) => set((state) => ({ wellnessData: [entry, ...state.wellnessData] })),
      addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      clearChat: () => set({ chatMessages: [] }),

      addToast: (message, type = 'info') => {
        const id = Date.now().toString();
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 4000);
      },

      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      loadNotificationsFromServer: async (userId) => {
        try {
          const serverNotifications = await fetchNotificationsFromServer(userId, 50);
          const converted = serverNotifications.map((n) => convertServerNotification(n as unknown as ServerNotification));
          const localNotifs = getUserNotifications(userId);
          const serverIds = new Set(converted.map((n) => n.id));
          const uniqueLocal = localNotifs.filter((n) => !serverIds.has(n.id) && n.id.startsWith('notif_'));
          const merged = [...converted, ...uniqueLocal].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          set({ notifications: merged });
        } catch (error) {
          console.error('loadNotificationsFromServer error:', getErrorMessage(error));
          set({ notifications: getUserNotifications(userId) });
        }
      },

      subscribeToNotifications: (userId) => {
        if (_notificationUnsubscribe) _notificationUnsubscribe();
        _notificationUnsubscribe = subscribeToRealtimeNotifications(userId, (event: RealtimeNotificationEvent) => {
          const newNotif = event.notification;
          set((state) => {
            if (state.notifications.some((n) => n.id === newNotif.id)) return state;
            const converted = convertServerNotification(newNotif as unknown as ServerNotification);
            return { notifications: [converted, ...state.notifications] };
          });
        });
      },

      unsubscribeFromNotifications: () => {
        if (_notificationUnsubscribe) { _notificationUnsubscribe(); _notificationUnsubscribe = null; }
      },

      markNotificationReadEnhanced: async (userId, id) => {
        set((state) => ({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)) }));
        await markAsReadOnServer(userId, id);
        markAsRead(userId, id);
      },

      markAllReadEnhanced: async (userId) => {
        const now = new Date().toISOString();
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true, readAt: n.readAt || now })) }));
        await markAllAsReadOnServer(userId);
        markAllAsRead(userId);
      },

      deleteNotificationEnhanced: async (userId, id) => {
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
        await deleteNotificationOnServer(userId, id);
        deleteNotification(userId, id);
      },

      syncNotifications: async (userId) => { await get().loadNotificationsFromServer(userId); },

      markNotificationRead: (id) => set((state) => ({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    {
      name: 'rafidain-hr-ui',
      partialize: (state) => ({ activeView: state.activeView, landingConfig: state.landingConfig }),
    },
  ),
);