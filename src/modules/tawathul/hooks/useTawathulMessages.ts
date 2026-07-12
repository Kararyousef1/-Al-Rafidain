/**
 * useTawathulMessages — تحميل + إرسال + Realtime + تفاعلات
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { tawathulMessageService } from '../services';
import type { TawathulMessage } from '../types';

export function useTawathulMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<TawathulMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const conversationRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await tawathulMessageService.listMessages(conversationId);
      if (conversationRef.current === conversationId) setMessages(data);
    } catch (e: any) {
      if (conversationRef.current === conversationId) {
        setError(e?.message || 'تعذّر تحميل الرسائل');
        setMessages([]);
      }
    } finally {
      if (conversationRef.current === conversationId) setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    conversationRef.current = conversationId;
    void load();
  }, [load, conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    channelRef.current = tawathulMessageService.subscribeToConversation(conversationId, {
      onInsert: (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      },
      onUpdate: (msg) => {
        setMessages((prev) =>
          prev
            .map((m) => (m.id === msg.id ? { ...m, ...msg } : m))
            .filter((m) => !m.deleted_at),
        );
      },
      onReactionChange: () => {
        void load();
      },
    });

    return () => {
      tawathulMessageService.unsubscribe(channelRef.current);
      channelRef.current = null;
    };
  }, [conversationId, load]);

  const send = useCallback(
    async (body: string, replyToId?: string, files?: File[]) => {
      if (!conversationId) return null;
      setSending(true);
      setError(null);
      try {
        const msg = await tawathulMessageService.sendMessage({
          conversationId,
          body,
          replyToId,
          files,
        });
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        return msg;
      } catch (e: any) {
        setError(e?.message || 'تعذّر إرسال الرسالة');
        return null;
      } finally {
        setSending(false);
      }
    },
    [conversationId],
  );

  return { messages, loading, sending, error, send, reload: load };
}
