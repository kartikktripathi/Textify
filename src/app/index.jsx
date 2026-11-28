import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatRoom } from '@/components/chat/chat-room';
import { ConversationList } from '@/components/chat/conversation-list';
import { NewChatModal } from '@/components/chat/new-chat-modal';
import { ThemedView } from '@/components/themed-view';
import { useChat } from '@/context/chat-context';
import { useTheme } from '@/hooks/use-theme';

const SPLIT_BREAKPOINT = 768;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { activeConversationId, selectConversation } = useChat();
  const [newChatVisible, setNewChatVisible] = useState(false);

  const isWide = width >= SPLIT_BREAKPOINT;

  const handleSelectConversation = (conversationId) => {
    selectConversation(conversationId);
    if (!isWide) {
      router.push(`/chat/${conversationId}`);
    }
  };

  const handleCreatedConversation = (conversationId) => {
    selectConversation(conversationId);
    if (!isWide) {
      router.push(`/chat/${conversationId}`);
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {isWide ? (
          <View style={styles.splitContainer}>
            <View
              style={[
                styles.sidebar,
                { borderRightColor: theme.border },
              ]}>
              <ConversationList
                onSelectConversation={handleSelectConversation}
                onOpenNewChat={() => setNewChatVisible(true)}
              />
            </View>
            <View style={styles.mainPane}>
              <ChatRoom conversationId={activeConversationId} />
            </View>
          </View>
        ) : (
          <ConversationList
            onSelectConversation={handleSelectConversation}
            onOpenNewChat={() => setNewChatVisible(true)}
          />
        )}

        <NewChatModal
          visible={newChatVisible}
          onClose={() => setNewChatVisible(false)}
          onCreated={handleCreatedConversation}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 340,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  mainPane: {
    flex: 1,
  },
});
