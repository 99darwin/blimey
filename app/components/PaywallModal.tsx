import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '@/utils/constants';

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
  onPurchase: (productId: 'monthly' | 'lifetime') => void;
}

const BENEFITS = [
  'Unlimited translations',
  'No ads',
  'All regional dialects',
  'Translation history (last 50)',
];

export function PaywallModal({
  visible,
  onDismiss,
  onPurchase,
}: PaywallModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Pressable
            onPress={onDismiss}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeIcon}>{'\u2715'}</Text>
          </Pressable>

          <Text style={styles.title}>Blimey Pro</Text>
          <Text style={styles.subtitle}>
            Unlock the full experience
          </Text>

          <View style={styles.benefitsList}>
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <Text style={styles.checkmark}>{'\u2713'}</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => onPurchase('lifetime')}
            style={styles.primaryCta}
            accessibilityRole="button"
            accessibilityLabel="Get Blimey Pro for 3 dollars 99 cents, one-time purchase"
          >
            <Text style={styles.primaryCtaText}>
              Get Blimey Pro — $3.99 lifetime
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onPurchase('monthly')}
            style={styles.secondaryCta}
            accessibilityRole="button"
            accessibilityLabel="Subscribe to Blimey Pro for 1 dollar 99 cents per month"
          >
            <Text style={styles.secondaryCtaText}>
              Or $1.99/month
            </Text>
          </Pressable>

          <Pressable
            onPress={onDismiss}
            style={styles.dismissLink}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          >
            <Text style={styles.dismissText}>Maybe later</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING * 3,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING * 3,
    width: '100%',
    maxWidth: 360,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING,
    right: SPACING,
    padding: SPACING * 1.5,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeIcon: {
    fontSize: 18,
    color: COLORS.mutedGray,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginTop: SPACING,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.mutedGray,
    textAlign: 'center',
    marginTop: SPACING / 2,
    marginBottom: SPACING * 3,
  },
  benefitsList: {
    marginBottom: SPACING * 3,
    gap: SPACING * 1.5,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING,
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.navy,
    fontWeight: '700',
  },
  benefitText: {
    fontSize: 15,
    color: COLORS.navy,
  },
  primaryCta: {
    backgroundColor: COLORS.navy,
    borderRadius: BORDER_RADIUS.chip,
    paddingVertical: SPACING * 2,
    alignItems: 'center',
    marginBottom: SPACING * 1.5,
  },
  primaryCtaText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryCta: {
    alignItems: 'center',
    paddingVertical: SPACING,
    marginBottom: SPACING,
  },
  secondaryCtaText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '500',
  },
  dismissLink: {
    alignItems: 'center',
    paddingVertical: SPACING / 2,
  },
  dismissText: {
    color: COLORS.mutedGray,
    fontSize: 13,
  },
});
