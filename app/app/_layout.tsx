import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { COLORS, REVENUECAT_API_KEY } from '@/utils/constants';
import { useSettingsStore } from '@/stores/settingsStore';

export default function RootLayout() {
  const setPremium = useSettingsStore((s) => s.setPremium);

  useEffect(() => {
    if (!REVENUECAT_API_KEY) return;

    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
    });

    Purchases.getCustomerInfo().then((info) => {
      if (info.entitlements.active['pro']) {
        setPremium(true);
      }
    });
  }, [setPremium]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      />
    </>
  );
}
