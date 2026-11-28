import { SymbolView } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/chat/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useChat } from '@/context/chat-context';
import { useTheme } from '@/hooks/use-theme';
import { formatMessageTime } from '@/utils/format-time';

function getStatusLabel(status) {
  switch (status) {
    case 'sending':
      return 'Sending...';
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'read':
      return 'Read';
    case 'failed':
      return 'Failed · Tap to retry';
    default:
      return '';
  }
}

export function ChatRoom({ conversationId, onBack }) {
  const theme = useTheme();
  const listRef = useRef(null);
  const {
    currentUser,
    conversations,
    messagesByConversation,
    draftsByConversation,
    isLoadingMessages,
    setDraft,
    sendMessage,
    retryMessage,
  } = useChat();

  const conversation = conversations.find((c) => c.id === conversationId) ?? null;
  const messages = messagesByConversation[conversationId] ?? [];
  const draft = draftsByConversation[conversationId] ?? '';

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length, conversationId]);

  if (!conversation) {
    return (
      <ThemedView style={styles.emptyState}>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          Select a conversation
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Choose a chat from the list or start a new one.
        </ThemedText>
      </ThemedView>
    );
  }

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(conversation.id, draft);
  };

  const renderMessage = ({ item }) => {
    const isMine = item.senderId === currentUser.id;
    const isFailed = item.status === 'failed';

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowTheirs,
        ]}>
        <Pressable
          disabled={!isFailed}
          onPress={() => retryMessage(conversation.id, item.id)}
          style={[
            styles.bubble,
            isMine
              ? { backgroundColor: theme.bubbleOutgoing, borderBottomRightRadius: 4 }
              : { backgroundColor: theme.bubbleIncoming, borderBottomLeftRadius: 4 },
            isFailed && { borderWidth: 1, borderColor: theme.danger },
          ]}>
          <ThemedText
            type="default"
            style={[
              styles.bubbleText,
              { color: isMine ? theme.primaryText : theme.text },
            ]}>
            {item.text}
          </ThemedText>

          <View style={styles.bubbleMeta}>
            <ThemedText
              style={[
                styles.timestamp,
                {
                  color: isMine
                    ? 'rgba(255,255,255,0.75)'
                    : theme.textSecondary,
                },
              ]}>
              {formatMessageTime(item.createdAt)}
            </ThemedText>
            {isMine && (
              <ThemedText
                style={[
                  styles.statusText,
                  {
                    color: isFailed
                      ? theme.danger
                      : 'rgba(255,255,255,0.8)',
                  },
                ]}>
                {getStatusLabel(item.status)}
              </ThemedText>
            )}
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.flex}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          {onBack && (
            <Pressable
              onPress={onBack}
              accessibilityLabel="Back to conversations"
              style={styles.backButton}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                size={20}
                tintColor={theme.text}
              />
            </Pressable>
          )}

          <Avatar
            initials={conversation.participant.initials}
            color={conversation.participant.avatarColor}
            status={conversation.participant.status}
            size={40}
          />

          <View style={styles.headerInfo}>
            <ThemedText type="default" numberOfLines={1} style={styles.headerName}>
              {conversation.participant.name}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor={conversation.isTyping ? 'primary' : 'textSecondary'}
              style={styles.headerStatus}>
              {conversation.isTyping
                ? 'typing...'
                : conversation.participant.lastSeen}
            </ThemedText>
          </View>
        </View>

        {isLoadingMessages ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={
              messages.length === 0 ? styles.emptyList : styles.messagesContent
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ThemedText type="small" themeColor="textSecondary">
                  Say hello to {conversation.participant.name}!
                </ThemedText>
              </View>
            }
          />
        )}

        <View
          style={[
            styles.composer,
            {
              borderTopColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: theme.backgroundElement },
            ]}>
            <TextInput
              value={draft}
              onChangeText={(text) => setDraft(conversation.id, text)}
              placeholder={`Message ${conversation.participant.name}...`}
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={2000}
              onKeyPress={(e) => {
                if (
                  Platform.OS === 'web' &&
                  e.nativeEvent.key === 'Enter' &&
                  !e.nativeEvent.shiftKey
                ) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={[styles.input, { color: theme.text }]}
            />
          </View>

          <Pressable
            onPress={handleSend}
            disabled={!draft.trim()}
            accessibilityLabel="Send message"
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: draft.trim()
                  ? theme.primary
                  : theme.backgroundElement,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <SymbolView
              name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
              size={18}
              tintColor={draft.trim() ? theme.primaryText : theme.textSecondary}
            />
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 6,
    marginLeft: -4,
  },
  headerInfo: {
    flex: 1,
    gap: 1,
  },
  headerName: {
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    lineHeight: 16,
  },
  messagesContent: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.one,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  timestamp: {
    fontSize: 11,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 120,
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
