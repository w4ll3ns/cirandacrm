import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';

const ORIGINAL_TITLE = 'Ciranda CRM';
let unreadCount = 0;

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1046, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Audio not available
  }
}

function updateTitleBadge() {
  if (unreadCount > 0) {
    document.title = `(${unreadCount}) ${ORIGINAL_TITLE}`;
  } else {
    document.title = ORIGINAL_TITLE;
  }
}

export function useInboundNotification(activeConversationId: string | null) {
  const { responsaveis } = useData();
  const activeIdRef = useRef(activeConversationId);
  activeIdRef.current = activeConversationId;

  const handleNewMessage = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail) return;

    const { conversationId, contentText, responsavelId } = detail;

    // Suppress if user is viewing this conversation
    if (activeIdRef.current === conversationId) return;

    // Sound
    playNotificationSound();

    // Toast
    const resp = responsaveis.find(r => r.id === responsavelId);
    const name = resp?.nome || 'Novo contato';
    const preview = contentText
      ? contentText.length > 60 ? contentText.slice(0, 60) + '…' : contentText
      : 'Nova mensagem';

    toast(name, { description: preview, duration: 5000 });

    // Title badge
    unreadCount++;
    updateTitleBadge();
  }, [responsaveis]);

  // Listen for custom event
  useEffect(() => {
    window.addEventListener('new-inbound-message', handleNewMessage);
    return () => window.removeEventListener('new-inbound-message', handleNewMessage);
  }, [handleNewMessage]);

  // Reset title badge on tab focus
  useEffect(() => {
    const onFocus = () => {
      unreadCount = 0;
      updateTitleBadge();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
}
