import { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '@/utils/constants';

interface TypeInputProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function TypeInput({
  visible,
  onDismiss,
  onSubmit,
  isLoading,
}: TypeInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setText('');
    onDismiss();
  };

  const handleDismiss = () => {
    setText('');
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.title} accessibilityRole="header">Type your phrase</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="e.g. Where's the boot of the car?"
                placeholderTextColor={COLORS.mutedGray}
                autoFocus
                multiline
                maxLength={200}
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
                accessibilityLabel="Enter a phrase to translate"
                accessibilityHint="Type a British or American English phrase"
              />
              <Pressable
                onPress={handleSubmit}
                style={[
                  styles.sendButton,
                  (!text.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                disabled={!text.trim() || isLoading}
                accessibilityRole="button"
                accessibilityLabel="Send phrase for translation"
                accessibilityState={{ disabled: !text.trim() || isLoading }}
              >
                <Text style={styles.sendIcon}>{'\u2191'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.card,
    borderTopRightRadius: BORDER_RADIUS.card,
    padding: SPACING * 2.5,
    paddingBottom: SPACING * 4,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.lightBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING * 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: SPACING * 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    borderRadius: BORDER_RADIUS.chip,
    padding: SPACING * 1.5,
    fontSize: 16,
    color: COLORS.navy,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.lightBorder,
  },
  sendIcon: {
    fontSize: 18,
    color: COLORS.surface,
    fontWeight: '700',
  },
});
