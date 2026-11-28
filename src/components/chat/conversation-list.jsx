import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  FlatList,
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
import { formatConversationTime } from '@/utils/format-time';

export function ConversationList({ onSelectConversation, onOpenNewChat }) {
  const theme = useTheme();
  const {
    filteredConversations,
    messagesByConversation,
    activeConversationId,
    searchQuery,
    filterMode,
    connectionStatus,
    isLoadingConversations,
    setSearchQuery,
    setFilterMode,
  } = useChat();

  const renderItem = ({ item }) => {
    const messages = messagesByConversation[item.id] ?? [];
    const lastMessage = messages[messages.length - 1];
    const isSelected = item.id === activeConversationId;

    return (
      <Pressable
        onPress={() => onSelectConversation(item.id)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: isSelected
              ? theme.backgroundSelected
              : pressed
                ? theme.backgroundElement
                : 'transparent',
          },
        ]}>
        <Avatar
          initials={item.participant.initials}
          color={item.participant.avatarColor}
          status={item.participant.status}
          size={48}
        />

        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <ThemedText type="default" numberOfLines={1} style={styles.name}>
              {item.participant.name}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.time}>
              {formatConversationTime(lastMessage?.createdAt ?? item.updatedAt)}
            </ThemedText>
          </View>

          <View style={styles.rowBottom}>
            <ThemedText
              type="small"
              themeColor={item.isTyping ? 'primary' : 'textSecondary'}
              numberOfLines={1}
              style={styles.preview}>
              {item.isTyping
                ? 'typing...'
                : lastMessage?.text ?? 'No messages yet'}
            </ThemedText>

            {item.unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <ThemedText style={[styles.badgeText, { color: theme.primaryText }]}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { borderRightColor: theme.border }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.titleGroup}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Textify
          </ThemedText>
          <View
            style={[
              styles.connectionPill,
              { backgroundColor: theme.backgroundElement },
            ]}>
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor:
                    connectionStatus === 'connected'
                      ? theme.online
                      : connectionStatus === 'connecting'
                        ? '#F59E0B'
                        : theme.danger,
                },
              ]}
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.connectionLabel}>
              {connectionStatus}
            </ThemedText>
          </View>
        </View>

        <Pressable
          onPress={onOpenNewChat}
          accessibilityLabel="New chat"
          style={({ pressed }) => [
            styles.newChatButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <SymbolView
            name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
            size={16}
            tintColor={theme.primaryText}
          />
        </Pressable>
      </View>

      <View style={styles.controls}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.backgroundElement },
          ]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={16}
            tintColor={theme.textSecondary}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
                size={16}
                tintColor={theme.textSecondary}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.filters}>
          {['all', 'unread'].map((mode) => {
            const active = filterMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => setFilterMode(mode)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active
                      ? theme.primary
                      : theme.backgroundElement,
                  },
                ]}>
                <ThemedText
                  type="small"
                  style={{
                    color: active ? theme.primaryText : theme.textSecondary,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}>
                  {mode}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoadingConversations ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            filteredConversations.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <ThemedText type="default" themeColor="textSecondary">
                No conversations found
              </ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 28,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
  },
  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  connectionLabel: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 2,
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 999,
  },
  listContent: {
    paddingBottom: Spacing.four,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  name: {
    fontWeight: '600',
    flex: 1,
  },
  time: {
    fontSize: 12,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  preview: {
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
