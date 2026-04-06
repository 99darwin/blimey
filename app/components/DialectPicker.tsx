import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, UK_DIALECTS, US_DIALECTS } from '@/utils/constants';
import type { Dialect } from '@/utils/constants';

interface DialectPickerProps {
  onLockedDialectPress: () => void;
}

export function DialectPicker({ onLockedDialectPress }: DialectPickerProps) {
  const direction = useSettingsStore((s) => s.direction);
  const dialect = useSettingsStore((s) => s.dialect);
  const isPremium = useSettingsStore((s) => s.isPremium);
  const setDialect = useSettingsStore((s) => s.setDialect);

  const dialects = direction === 'UK_TO_US' ? UK_DIALECTS : US_DIALECTS;

  const handlePress = (d: Dialect) => {
    if (d !== 'General' && !isPremium) {
      onLockedDialectPress();
      return;
    }
    setDialect(d);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {dialects.map((d) => {
        const isSelected = d === dialect;
        const isLocked = d !== 'General' && !isPremium;

        return (
          <Pressable
            key={d}
            onPress={() => handlePress(d)}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${d} dialect${isLocked ? ', premium only' : ''}${isSelected ? ', selected' : ''}`}
            accessibilityState={{ selected: isSelected, disabled: isLocked }}
          >
            <View style={styles.chipContent}>
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {d}
              </Text>
              {isLocked && <Text style={styles.lockIcon}>{'\uD83D\uDD12'}</Text>}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING * 2,
    gap: SPACING,
  },
  chip: {
    paddingHorizontal: SPACING * 1.5,
    paddingVertical: SPACING,
    borderRadius: BORDER_RADIUS.chip,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
  },
  chipSelected: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.navy,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.surface,
  },
  lockIcon: {
    fontSize: 11,
  },
});
