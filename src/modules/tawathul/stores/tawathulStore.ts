/**
 * tawathulStore — حالة واجهة بوابة التواصل
 */

import { create } from 'zustand';
import type { TawathulConversation } from '../types';
import { tawathulConversationService } from '../services';
import { ensureDefaultTenantCached } from '../utils/tenant';

interface TawathulState {
  conversations: TawathulConversation[];
  activeConversationId: string | null;
  loadingList: boolean;
  error: string | null;
  mobileShowChat: boolean;

  setActiveConversationId: (id: string | null) => void;
  setMobileShowChat: (v: boolean) => void;
  loadConversations: () => Promise<void>;
  upsertConversation: (c: TawathulConversation) => void;
  clear: () => void;
}

export const useTawathulStore = create<TawathulState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  loadingList: false,
  error: null,
  mobileShowChat: false,

  setActiveConversationId: (id) =>
    set({ activeConversationId: id, mobileShowChat: !!id }),

  setMobileShowChat: (v) => set({ mobileShowChat: v }),

  loadConversations: async () => {
    set({ loadingList: true, error: null });
    try {
      ensureDefaultTenantCached();
      const list = await tawathulConversationService.listMyConversations();
      set({ conversations: list, loadingList: false, error: null });
    } catch (e: any) {
      set({
        error: e?.message || 'تعذّر تحميل المحادثات',
        loadingList: false,
      });
    }
  },

  upsertConversation: (c) => {
    const rest = get().conversations.filter((x) => x.id !== c.id);
    set({ conversations: [c, ...rest] });
  },

  clear: () =>
    set({
      conversations: [],
      activeConversationId: null,
      error: null,
      mobileShowChat: false,
    }),
}));
