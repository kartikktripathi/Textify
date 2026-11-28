import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatRoom } from '@/components/chat/chat-room';
import { ThemedView } from '@/components/themed-view';
import { useChat } from '@/context/chat-context';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { selectConversation } = useChat();

  const conversationId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, selectConversation]);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ChatRoom
          conversationId={conversationId}
          onBack={() => router.back()}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
