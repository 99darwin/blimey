import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { COLORS, SPACING } from '@/utils/constants';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page not found</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go back</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: SPACING * 2,
  },
  link: {
    paddingVertical: SPACING,
  },
  linkText: {
    fontSize: 16,
    color: COLORS.navy,
    textDecorationLine: 'underline',
  },
});
