/**
 * ════════════════════════════════════════════════════════════════
 *  إدارة الحالة الموحدة - نظام الرافدين HR
 *  تم التحديث لاستخدام الأنواع الموحدة والدوال المساعدة
 *  ✅ محسَّن مع نظام الإشعارات الجديد المتكامل مع Supabase
 * ════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../sdk/supabase';
import { login as sdkLogin, logout as sdkLogout, getUserProfile } from '../sdk/auth';
import { addNotification, createWelcomeNotification, getUserNotifications, markAsRead, markAllAsRead, deleteNotification } from '../lib/notificationManager';
import { 
  fetchNotificationsFromServer, 
  markAsReadOnServer, 
  markAllAsReadOnServer, 
  deleteNotificationOnServer,
  subscribeToRealtimeNotifications
} from '../lib/notificationService';
import { getEffectivePermissions } from '../constants/permissions';
import { normalizeUser, getUserDisplayName } from '../utils/userUtils';
import type {
  User, Problem, Notification, UserRole,
  WellnessData, ChatMessage, AuditLog, Employee, Analytics
} from '../types';
import type { LandingConfig, LandingVideo, LandingProduct, LandingNavLink, LandingStat } from '../types/landing';
import {
  mockUser, mockProblems, mockNotifications,
  mockWellnessData, mockEmployees, mockAnalytics, mockAuditLogs
} from '../data/dev/mockData';

// ════════════════════════════════════════════════════════════════
//  دالة مساعدة لجلب المستخدم من جدول employees
// ════════════════════════════════════════════════════════════════

/**
 * محاولة جلب بيانات المستخدم من جدول employees إذا لم يوجد في profiles
 */
async function tryFetchFromEmployees(userId: string): Promise<User | null> {
  try {
    const { data: emp } = await supabase
      .from('employees')
      .select('*, departments(name)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!emp || !emp.user_id) {
      console.warn(`⚠️ Employee with user_id ${userId} not found or has no user_id`);
      return null;
    }

    // تحويل بيانات employees إلى User موحد
    const employeeData = {
      id: userId,                    // Frontend ID
      user_id: emp.user_id,         // Auth ID
      employee_id: emp.id,          // Backend ID
      full_name: emp.full_name_ar || 
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
    };

    return normalizeUser(employeeData);
  } catch (error) {
    console.error('Error fetching from employees:', error);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
//  إدارة Real-time Subscriptions
// ════════════════════════════════════════════════════════════════

let _profileChannel: any = null;
let _notificationUnsubscribe: (() => void) | null = null; // ✅ جديد للإشعارات

const setupRealtimeProfileSubscription = (userId: string | undefined, setFn: any) => {
  // تنظيف الاشتراك السابق
  if (_profileChannel) {
    supabase.removeChannel(_profileChannel);
    _profileChannel = null;
  }

  if (!userId) return;
  
  // إنشاء اشتراك جديد
  _profileChannel = supabase
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
        console.log('🔄 Profile updated in real-time, refreshing permissions...');
        const newProfile = payload.new as any;
        
        try {
          // جلب البيانات المحدثة
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
            console.log('✅ User data updated from real-time subscription');
          }
        } catch (error) {
          console.error('Error handling real-time profile update:', error);
        }
      }
    )
    .subscribe();
};

// ════════════════════════════════════════════════════════════════
//  Auth Store - إدارة المصادقة
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

  // ═══════════════ تهيئة النظام ═══════════════
  initialize: async () => {
    set({ loading: true });
    try {
      // 1. التحقق من المستخدم المحلي
      const localUser = localStorage.getItem('user');
      const localRole = localStorage.getItem('userRole');
      
      if (localUser && localRole) {
        try {
          const parsedUser = JSON.parse(localUser);
          const normalizedUser = normalizeUser({
            ...mockUser,
            ...parsedUser,
            role: parsedUser.role as UserRole,
            permissions: getEffectivePermissions(parsedUser.role as UserRole, []),
          });
          
          set({
            user: normalizedUser,
            isAuthenticated: true,
            loading: false,
          });
          return;
        } catch (e) {
          // تنظيف البيانات التالفة
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
        }
      }
      
      // 2. التحقق من جلسة Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // محاولة من profiles أولاً
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        // إذا لم يوجد، حاول من employees
        if (!profile) {
          console.log('🔄 User not found in profiles, trying employees table...');
          profile = await tryFetchFromEmployees(session.user.id);
        }

        if (profile) {
          const normalizedUser = normalizeUser({
            ...profile,
            permissions: getEffectivePermissions(
              profile.role as UserRole, 
              profile.permissions
            ),
          });
          
          set({
            user: normalizedUser,
            isAuthenticated: true,
          });
          
          // إعداد Real-time subscription
          setupRealtimeProfileSubscription(session.user.id, set);
        } else {
          // إنشاء مستخدم افتراضي
          const defaultUser = normalizeUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || 'مستخدم جديد',
            role: 'employee',
            permissions: getEffectivePermissions('employee', []),
          });
          
          set({
            user: defaultUser,
            isAuthenticated: true,
          });
        }
      }

      // مراقبة تغييرات المصادقة
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          get().cleanup();
          set({ user: null, isAuthenticated: false });
          return;
        }
        
        if (event === 'SIGNED_IN' && session.user) {
          await get().refreshUser();
          setupRealtimeProfileSubscription(session.user.id, set);
        }
      });

      // إنشاء إشعار الترحيب
      if (session?.user) {
        createWelcomeNotification(session.user.id);
      }
      
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ loading: false });
    }
  },

  // ═══════════════ تسجيل الدخول ═══════════════
  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await sdkLogin(email, password);

      if (data.user) {
        const profile = await getUserProfile(data.user.id);
        
        if (profile) {
          const normalizedUser = normalizeUser({
            ...profile,
            permissions: getEffectivePermissions(
              profile.role as UserRole, 
              profile.permissions
            ),
          });
          
          set({
            user: normalizedUser,
            isAuthenticated: true,
          });
          
          // إشعار الترحيب
          createWelcomeNotification(data.user.id);
          
          // إشعار تسجيل الدخول
          const userName = getUserDisplayName(normalizedUser);
          const today = new Date().toISOString().slice(0, 10);
          
          addNotification(data.user.id, {
            type: 'login',
            priority: 'low',
            title: '👋 مرحباً بعودتك',
            message: `أهلاً ${userName}، تم تسجيل دخولك إلى نظام الرافدين`,
            groupKey: `login-${data.user.id}-${today}`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
          
          setupRealtimeProfileSubscription(data.user.id, set);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ═══════════════ الدخول المحلي ═══════════════
  loginLocal: (username, role, fullName) => {
    const userRole = (role as UserRole) || 'employee';
    const localUser = {
      id: 'local-' + Date.now(),
      username,
      role: userRole,
      full_name: fullName,
      email: '',
    };
    
    localStorage.setItem('user', JSON.stringify(localUser));
    localStorage.setItem('userRole', userRole);
    
    const normalizedUser = normalizeUser({
      ...localUser,
      permissions: getEffectivePermissions(userRole, []),
    });
    
    set({
      user: normalizedUser,
      isAuthenticated: true,
    });
  },

  // ═══════════════ تسجيل الخروج ═══════════════
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

  // ═══════════════ تحديث بيانات المستخدم ═══════════════
  updateUser: (data) => {
    set((state) => ({
      user: state.user ? normalizeUser({ ...state.user, ...data }) : null,
    }));
  },

  // ═══════════════ إعادة تحميل بيانات المستخدم ═══════════════
  refreshUser: async () => {
    const state = get();
    if (!state.isAuthenticated || !state.user?.id) return;
    
    try {
      // محاولة من profiles
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', state.user.id)
        .maybeSingle();

      // إذا لم يوجد، حاول من employees
      if (!profile) {
        console.log('🔄 Refreshing user from employees table...');
        profile = await tryFetchFromEmployees(state.user.id);
      }

      if (profile) {
        const normalizedUser = normalizeUser({
          ...profile,
          permissions: getEffectivePermissions(
            profile.role as UserRole, 
            profile.permissions
          ),
        });
        
        set({ user: normalizedUser });
        console.log('✅ User profile refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  },

  // ═══════════════ تنظيف الموارد ═══════════════
  cleanup: () => {
    if (_profileChannel) {
      supabase.removeChannel(_profileChannel);
      _profileChannel = null;
    }
    // ✅ جديد: تنظيف اشتراك الإشعارات
    if (_notificationUnsubscribe) {
      _notificationUnsubscribe();
      _notificationUnsubscribe = null;
    }
  },
}));

// ════════════════════════════════════════════════════════════════
//  Problem Store - إدارة المشاكل
// ════════════════════════════════════════════════════════════════

interface ProblemState {
  problems: Problem[];
  addProblem: (problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProblem: (id: string, data: Partial<Problem>) => void;
  deleteProblem: (id: string) => void;
  addComment: (problemId: string, text: string, authorId: string, authorName: string, authorRole: string) =>  void;
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
                authorRole: authorRole as UserRole,
                createdAt: new Date().toISOString(),
              }],
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    })),
}));

// ════════════════════════════════════════════════════════════════
//  UI Store - إدارة واجهة المستخدم المحسَّنة
// ════════════════════════════════════════════════════════════════

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export type { LandingConfig, LandingVideo, LandingProduct, LandingNavLink, LandingStat } from '../types/landing';

const defaultLandingConfig: LandingConfig = {
  themeColor: '#4f46e5',
  logoSymbol: 'ر',
  logoUrl: '',
  logoTextAr: 'الرافدين',
  logoTextEn: 'Al-Rafidain',
  heroTitleAr: 'الابتكار في الرعاية الصحية',
  heroTitleEn: 'Innovation in Healthcare',
  heroDescAr: 'نحن في شركة الرافدين نسعى لتقديم أفضل المنتجات الطبية والدوائية بأعلى معايير الجودة العالمية، لضمان صحة وسلامة مجتمعنا.',
  heroDescEn: 'At Al-Rafidain, we strive to provide the best medical and pharmaceutical products with the highest global quality standards to ensure the health and safety of our community.',
  aboutP1Ar: 'شركة الرافدين لإنتاج الأدوية هي إحدى أبرز وأعرق شركات القطاع الخاص المتخصصة في إنتاج الأدوية البشرية.',
  aboutP1En: 'Al-Rafidain Pharmaceutical Production Company is one of the most prominent private sector companies specializing in human medicine production.',
  aboutP2Ar: 'تلتزم الشركة بالامتثال التام لمعايير ممارسات التصنيع الجيدة (GMP) التي وضعتها منظمة الصحة العالمية.',
  aboutP2En: 'The company is committed to full compliance with Good Manufacturing Practices (GMP) standards set by WHO.',
  aboutP3Ar: 'يُعد رضا العملاء أحد الأهداف الرئيسية التي تجذب اهتمام الشركة باستمرار.',
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
  marketingIntroAr: 'منذ تأسيسها، تهدف سياسة شركة وادي الرافيدين لإنتاج الأدوية إلى إنشاء فريق متطور وفعال.',
  marketingIntroEn: 'Since its establishment, Al-Rafidain policy has aimed to build a developed and effective team.',
  marketingVisionTitleAr: 'رؤيتنا',
  marketingVisionTitleEn: 'Our Vision',
  marketingVisionTextAr: 'نسعى لضمان توفر أدوية عالية الجودة وبأسعار معقولة في جميع محافظات العراق.',
  marketingVisionTextEn: 'We strive to ensure high-quality medicines at reasonable prices in all Iraqi governorates.',
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
  
  // ✅ دوال إشعارات محسَّنة جديدة
  loadNotificationsFromServer: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
  markNotificationReadEnhanced: (userId: string, id: string) => Promise<void>;
  markAllReadEnhanced: (userId: string) => Promise<void>;
  deleteNotificationEnhanced: (userId: string, id: string) => Promise<void>;
  syncNotifications: (userId: string) => Promise<void>;
}

const isLocalUser = () => {
  const user = localStorage.getItem('user');
  return !!user;
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
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
      
      setActiveView: (view) => set((state) => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          return { activeView: view, sidebarOpen: false };
        }
        return { activeView: view };
      }),
      
      updateLandingConfig: (config) => 
        set((state) => ({ landingConfig: { ...state.landingConfig, ...config } })),

      fetchLandingConfig: async () => {
        if (isLocalUser()) {
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

      saveLandingConfig: async (config: LandingConfig) => {
        if (isLocalUser()) {
          set({ landingConfig: config });
          return { success: true };
        }
        
        set({ isSavingConfig: true });
        try {
          const { error } = await supabase
            .from('system_settings')
            .upsert(
              { 
                id: 'singleton', 
                landing_config: config, 
                updated_at: new Date().toISOString() 
              }, 
              { onConflict: 'id' }
            );
            
          if (error) {
            console.warn('System settings RLS error:', error.message);
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

      uploadImage: async (file: File, path: string) => {
        if (isLocalUser()) {
          return URL.createObjectURL(file);
        }
        
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

      // ════════════════════════════════════════════════════════════════
      // 🔔 دوال الإشعارات المحسَّنة الجديدة
      // ════════════════════════════════════════════════════════════════

      /**
       * تحميل إشعارات من السيرفر ودمجها مع المحلية
       */
      loadNotificationsFromServer: async (userId: string) => {
        try {
          console.log('📥 Loading notifications from server...');
          
          // جلب من Supabase
          const serverNotifications = await fetchNotificationsFromServer(userId, 50);
          
          // تحويل لصيغة AppNotification
          const convertedNotifs = serverNotifications.map((dbNotif: any) => ({
            id: dbNotif.id,
            type: dbNotif.type,
            priority: dbNotif.priority,
            title: dbNotif.title,
            message: dbNotif.message,
            read: dbNotif.is_read,
            createdAt: dbNotif.created_at,
            readAt: dbNotif.read_at,
            userId: dbNotif.user_id,
            actionUrl: dbNotif.action_url,
            groupKey: dbNotif.group_key,
            metadata: dbNotif.metadata || {},
            expiresAt: dbNotif.expires_at,
          }));

          // جلب المحلية
          const localNotifs = getUserNotifications(userId);
          
          // دمج وإزالة التكرار (السيرفر له الأولوية)
          const serverIds = new Set(convertedNotifs.map(n => n.id));
          const uniqueLocalNotifs = localNotifs.filter(n => 
            !serverIds.has(n.id) && n.id.startsWith('notif_')
          );
          
          const mergedNotifs = [...convertedNotifs, ...uniqueLocalNotifs]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          set({ notifications: mergedNotifs });
          console.log(`✅ Loaded ${mergedNotifs.length} notifications (${convertedNotifs.length} server + ${uniqueLocalNotifs.length} local)`);
          
        } catch (error) {
          console.error('❌ Failed to load server notifications:', error);
          // fallback للمحلية فقط
          const localNotifs = getUserNotifications(userId);
          set({ notifications: localNotifs });
        }
      },

      /**
       * الاشتراك في إشعارات Realtime
       */
      subscribeToNotifications: (userId: string) => {
        console.log('🔴 Subscribing to realtime notifications...');
        
        // إلغاء الاشتراك السابق
        if (_notificationUnsubscribe) {
          _notificationUnsubscribe();
        }

        // اشتراك جديد
        _notificationUnsubscribe = subscribeToRealtimeNotifications(userId, (newNotif) => {
          console.log('🔔 New realtime notification received');
          
          // إضافة للحالة
          set((state) => {
            // تجنب التكرار
            const exists = state.notifications.some(n => n.id === newNotif.id);
            if (exists) return state;

            const convertedNotif = {
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

            return {
              notifications: [convertedNotif, ...state.notifications]
            };
          });
        });
      },

      /**
       * إلغاء الاشتراك في Realtime
       */
      unsubscribeFromNotifications: () => {
        if (_notificationUnsubscribe) {
          _notificationUnsubscribe();
          _notificationUnsubscribe = null;
          console.log('🔴 Unsubscribed from realtime notifications');
        }
      },

      /**
       * تحديد إشعار كمقروء (محسَّن مع السيرفر)
       */
      markNotificationReadEnhanced: async (userId: string, id: string) => {
        // تحديث فوري في الواجهة
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
          ),
        }));

        // تحديث السيرفر
        await markAsReadOnServer(userId, id);
        
        // تحديث المحلي أيضاً
        markAsRead(userId, id);
      },

      /**
       * تحديد جميع الإشعارات كمقروءة (محسَّن)
       */
      markAllReadEnhanced: async (userId: string) => {
        const now = new Date().toISOString();
        
        // تحديث فوري في الواجهة
        set((state) => ({
          notifications: state.notifications.map((n) => ({ 
            ...n, 
            read: true, 
            readAt: n.readAt || now 
          })),
        }));

        // تحديث السيرفر
        await markAllAsReadOnServer(userId);
        
        // تحديث المحلي
        markAllAsRead(userId);
      },

      /**
       * حذف إشعار (محسَّن مع السيرفر)
       */
      deleteNotificationEnhanced: async (userId: string, id: string) => {
        // حذف فوري من الواجهة
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));

        // حذف من السيرفر
        await deleteNotificationOnServer(userId, id);
        
        // حذف المحلي
        deleteNotification(userId, id);
      },

      /**
       * مزامنة شاملة للإشعارات
       */
      syncNotifications: async (userId: string) => {
        console.log('🔄 Syncing notifications...');
        await get().loadNotificationsFromServer(userId);
      },

      // ════════════════════════════════════════════════════════════════
      // تحديث الدوال القديمة للتوافق مع النظام الجديد
      // ════════════════════════════════════════════════════════════════

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },
    }),
    {
      name: 'rafidain-hr-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        activeView: state.activeView,
        landingConfig: state.landingConfig,
        // لا نحفظ الإشعارات في persist لأنها تتحمل من السيرفر
      }),
    }
  )
);