import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import chatData from '@/services/chat-data.json';

const ChatContext = createContext(null);

/**
 * Provides backend-ready chat state and actions.
 * Replace the local state updates in these handlers with API / WebSocket calls
 * when connecting to the backend.
 */
export function ChatProvider({ children }) {
  const [currentUser] = useState(chatData.currentUser);
  const [conversations, setConversations] = useState(chatData.conversations);
  const [messagesByConversation, setMessagesByConversation] = useState(
    chatData.messagesByConversation
  );
  const [activeConversationId, setActiveConversationId] = useState(
    chatData.conversations[0]?.id ?? null
  );
  const [draftsByConversation, setDraftsByConversation] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unread'

  // Backend-ready async / connection states
  const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected' | 'connecting' | 'disconnected'
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  const markAsRead = useCallback((conversationId) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv))
    );
  }, []);

  const selectConversation = useCallback(
    (conversationId) => {
      setActiveConversationId(conversationId);
      if (conversationId) {
        markAsRead(conversationId);
      }
    },
    [markAsRead]
  );

  const setDraft = useCallback((conversationId, text) => {
    setDraftsByConversation((prev) => ({
      ...prev,
      [conversationId]: text,
    }));
  }, []);

  const sendMessage = useCallback(
    async (conversationId, rawText) => {
      const text = rawText.trim();
      if (!text || !conversationId) return null;

      const tempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const timestamp = new Date().toISOString();

      const optimisticMessage = {
        id: tempId,
        conversationId,
        senderId: currentUser.id,
        text,
        createdAt: timestamp,
        status: 'sending',
      };

      // Optimistically append message and clear draft
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), optimisticMessage],
      }));
      setDraftsByConversation((prev) => ({ ...prev, [conversationId]: '' }));
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, updatedAt: timestamp } : conv
        )
      );

      // Simulate backend ack (replace with real POST / WebSocket emit)
      setTimeout(() => {
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] ?? []).map((msg) =>
            msg.id === tempId ? { ...msg, status: 'sent' } : msg
          ),
        }));
      }, 350);

      return optimisticMessage;
    },
    [currentUser.id]
  );

  const retryMessage = useCallback(
    async (conversationId, messageId) => {
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).map((msg) =>
          msg.id === messageId ? { ...msg, status: 'sending' } : msg
        ),
      }));

      setTimeout(() => {
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] ?? []).map((msg) =>
            msg.id === messageId ? { ...msg, status: 'sent' } : msg
          ),
        }));
      }, 350);
    },
    []
  );

  const createConversation = useCallback((participantInput) => {
    const existing = conversations.find(
      (c) =>
        c.participant.id === participantInput.id ||
        c.participant.name.toLowerCase() === participantInput.name.trim().toLowerCase()
    );
    if (existing) {
      setActiveConversationId(existing.id);
      return existing;
    }

    const name = participantInput.name.trim();
    const parts = name.split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();

    const palette = ['#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];
    const avatarColor =
      participantInput.avatarColor ?? palette[name.length % palette.length];

    const newConv = {
      id: `conv-${Date.now()}`,
      participant: {
        id: participantInput.id ?? `user-${Date.now()}`,
        name,
        handle: participantInput.handle ?? `@${name.toLowerCase().replace(/\s+/g, '')}`,
        initials,
        avatarColor,
        status: participantInput.status ?? 'online',
        lastSeen: participantInput.lastSeen ?? 'Active now',
      },
      unreadCount: 0,
      isPinned: false,
      isTyping: false,
      updatedAt: new Date().toISOString(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setMessagesByConversation((prev) => ({ ...prev, [newConv.id]: [] }));
    setActiveConversationId(newConv.id);
    return newConv;
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...conversations]
      .filter((conv) => {
        if (filterMode === 'unread' && conv.unreadCount === 0) return false;
        if (!query) return true;
        const messages = messagesByConversation[conv.id] ?? [];
        const lastMessage = messages[messages.length - 1];
        return (
          conv.participant.name.toLowerCase().includes(query) ||
          conv.participant.handle.toLowerCase().includes(query) ||
          (lastMessage?.text.toLowerCase().includes(query) ?? false)
        );
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [conversations, filterMode, messagesByConversation, searchQuery]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const value = useMemo(
    () => ({
      currentUser,
      contacts: chatData.contacts,
      conversations,
      filteredConversations,
      messagesByConversation,
      activeConversationId,
      activeConversation,
      draftsByConversation,
      searchQuery,
      filterMode,
      connectionStatus,
      isLoadingConversations,
      isLoadingMessages,
      error,
      setSearchQuery,
      setFilterMode,
      setConnectionStatus,
      setIsLoadingConversations,
      setIsLoadingMessages,
      setError,
      selectConversation,
      markAsRead,
      setDraft,
      sendMessage,
      retryMessage,
      createConversation,
    }),
    [
      currentUser,
      conversations,
      filteredConversations,
      messagesByConversation,
      activeConversationId,
      activeConversation,
      draftsByConversation,
      searchQuery,
      filterMode,
      connectionStatus,
      isLoadingConversations,
      isLoadingMessages,
      error,
      selectConversation,
      markAsRead,
      setDraft,
      sendMessage,
      retryMessage,
      createConversation,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return ctx;
}
