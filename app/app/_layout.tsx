import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as Updates from 'expo-updates';
import { COLORS, REVENUECAT_API_KEY } from '@/utils/constants';
import { useSettingsStore } from '@/stores/settingsStore';

export default function RootLayout() {
  const setPremium = useSettingsStore((s) => s.setPremium);

  useEffect(() => {
    // Check for OTA updates on launch and apply immediately if one is available.
    if (!__DEV__) {
      (async () => {
        try {
          const result = await Updates.checkForUpdateAsync();
          if (result.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch {
          // Silent failure — app will use the embedded bundle.
        }
      })();
    }
  }, []);

  useEffect(() => {
    // Configure audio session: allow playback in silent mode and enable recording.
    setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    }).catch(() => {});

    // Request mic permission upfront so the first hold-to-speak isn't racing the prompt.
    requestRecordingPermissionsAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!REVENUECAT_API_KEY) return;

    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
    });

    const syncPremium = (info: { entitlements: { active: Record<string, unknown> } }) => {
      // Accept any active entitlement — covers 'pro', 'Pro', or any other naming.
      const hasActive = Object.keys(info.entitlements.active).length > 0;
      setPremium(hasActive);
    };

    Purchases.getCustomerInfo().then(syncPremium).catch(() => {});
    Purchases.addCustomerInfoUpdateListener(syncPremium);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(syncPremium);
    };
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
