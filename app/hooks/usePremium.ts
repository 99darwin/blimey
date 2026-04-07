import { useCallback } from 'react';
import { Alert } from 'react-native';
import Purchases from 'react-native-purchases';
import { useSettingsStore } from '@/stores/settingsStore';

interface UsePremiumReturn {
  isPremium: boolean;
  purchasePremium: (productId: 'monthly' | 'lifetime') => Promise<boolean>;
  restorePurchases: () => Promise<void>;
}

const OFFERING_IDS = {
  monthly: 'blimey_pro_monthly',
  lifetime: 'blimey_pro_lifetime',
} as const;

export function usePremium(): UsePremiumReturn {
  const isPremium = useSettingsStore((s) => s.isPremium);
  const setPremium = useSettingsStore((s) => s.setPremium);

  const purchasePremium = useCallback(
    async (productId: 'monthly' | 'lifetime'): Promise<boolean> => {
      try {
        const offerings = await Purchases.getOfferings();
        const offering = offerings.all[OFFERING_IDS[productId]];
        const pkg = offering?.availablePackages[0];

        if (!pkg) {
          Alert.alert('Unavailable', 'This product is not available right now.');
          return false;
        }

        // If purchasePackage resolves without throwing, the transaction succeeded.
        // Trust it and unlock immediately — RC's entitlements payload can lag,
        // and the customer info listener will reconcile any drift on the next update.
        await Purchases.purchasePackage(pkg);
        setPremium(true);
        return true;
      } catch (err: unknown) {
        const error = err as { userCancelled?: boolean; message?: string };
        if (error.userCancelled) return false;
        Alert.alert('Purchase Failed', error.message ?? 'Please try again.');
        return false;
      }
    },
    [setPremium],
  );

  const restorePurchases = useCallback(async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active['pro']) {
        setPremium(true);
        Alert.alert('Restored', 'Your Blimey Pro access has been restored.');
      } else {
        setPremium(false);
        Alert.alert('No Purchases Found', 'No active subscriptions were found.');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      Alert.alert('Restore Failed', error.message ?? 'Please try again.');
    }
  }, [setPremium]);

  return {
    isPremium,
    purchasePremium,
    restorePurchases,
  };
}
