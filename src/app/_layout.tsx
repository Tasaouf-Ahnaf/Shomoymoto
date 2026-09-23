import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import type * as Notifications from "expo-notifications";
import {
  addPushNotificationResponseListener,
  clearLastPushNotificationResponse,
  getLastPushNotificationResponse,
  handlePushNotificationResponse,
  pushNotificationsSupported,
  reconcilePushNotifications,
  registerPushNotificationCategory,
  requestPushNotificationPermissions,
  setupPushNotificationHandler,
} from "../../service/pushnotification";
import { LanguageProvider } from "../../service/i18n";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();
  const seenResponses = useRef(new Set());

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!pushNotificationsSupported) return;

    setupPushNotificationHandler();

    const processResponse = async (
      response: Notifications.NotificationResponse,
    ) => {
      if (!response?.notification) return;
      const key = `${response.notification.date}_${response.actionIdentifier}`;
      if (seenResponses.current.has(key)) return;
      seenResponses.current.add(key);

      const result = await handlePushNotificationResponse(response);
      if (result?.type === "open") {
        router.push({
          pathname: "/action-modal",
          params: {
            medicine: JSON.stringify(result.medicine),
            selectedDate: result.selectedDate,
          },
        });
      }
    };

    let subscription: { remove: () => void } | null | undefined;
    (async () => {
      await registerPushNotificationCategory();
      await requestPushNotificationPermissions();
      await reconcilePushNotifications();

      const lastResponse = await getLastPushNotificationResponse();
      if (lastResponse) {
        await processResponse(lastResponse);
        await clearLastPushNotificationResponse();
      }

      subscription = addPushNotificationResponseListener(processResponse);
    })();

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") reconcilePushNotifications();
    });

    return () => {
      subscription?.remove();
      appStateSubscription?.remove();
    };
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen
        name="action-modal"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <RootLayoutNav />
    </LanguageProvider>
  );
}
