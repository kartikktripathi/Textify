import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  FlatList,
  Modal,
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

export function NewChatModal({ visible, onClose, onCreated }) {
  const theme = useTheme();
  const { contacts, createConversation } = useChat();
  const [nameInput, setNameInput] = useState('');

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(nameInput.trim().toLowerCase())
  );

  const handleStartWithContact = (contact) => {
    const conv = createConversation(contact);
    setNameInput('');
    onClose();
    onCreated?.(conv.id);
  };

  const handleCreateCustom = () => {
    if (!nameInput.trim()) return;
    const conv = createConversation({ name: nameInput });
    setNameInput('');
    onClose();
    onCreated?.(conv.id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ThemedView
          style={[styles.sheet, { borderColor: theme.border }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <ThemedText type="default" style={styles.title}>
              New Conversation
            </ThemedText>
            <Pressable onPress={onClose} accessibilityLabel="Close">
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={20}
                tintColor={theme.textSecondary}
              />
            </Pressable>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter a name or filter contacts..."
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                },
              ]}
            />
            {nameInput.trim().length > 0 && (
              <Pressable
                onPress={handleCreateCustom}
                style={[styles.startBtn, { backgroundColor: theme.primary }]}>
                <ThemedText
                  type="small"
                  style={{ color: theme.primaryText, fontWeight: '600' }}>
                  Start
                </ThemedText>
              </Pressable>
            )}
          </View>

          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.sectionLabel}>
            Contacts
          </ThemedText>

          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleStartWithContact(item)}
                style={({ pressed }) => [
                  styles.contactRow,
                  pressed && { backgroundColor: theme.backgroundElement },
                ]}>
                <Avatar
                  initials={item.initials}
                  color={item.avatarColor}
                  status={item.status}
                  size={40}
                />
                <View style={styles.contactInfo}>
                  <ThemedText type="default" style={styles.contactName}>
                    {item.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.handle}
                  </ThemedText>
                </View>
              </Pressable>
            )}
          />
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '75%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontWeight: '700',
    fontSize: 17,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  input: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  startBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sectionLabel: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '600',
  },
});
