import { isRunningInExpoGo } from "expo";
import { collection, getDocs, query, where } from "firebase/firestore";
import moment from "moment";
import { Platform } from "react-native";
import { db } from "../config/FirebaseConfig";
import { updateMedicationAction } from "./medicationActions";
import { getLocalStorage } from "./storage";

export const PUSH_CATEGORY = "medicationPush";
export const ACTION_TAKEN = "TAKEN";
export const ACTION_MISSED = "MISSED";

export const pushNotificationsSupported =
  Platform.OS !== "web" && !isRunningInExpoGo();

const ANDROID_CHANNEL_ID = "medication-reminders";
const SCHEDULE_PREFIX = "med_";
const WINDOW_DAYS = 7;

let notificationsModule;
let notificationsModuleLoaded = false;

const getNotifications = () => {
  if (!pushNotificationsSupported) return null;

  if (!notificationsModuleLoaded) {
    notificationsModuleLoaded = true;
    try {
      notificationsModule = require("expo-notifications");
    } catch (e) {
      console.warn("expo-notifications unavailable:", e?.message);
      notificationsModule = null;
    }
  }

  return notificationsModule;
};

export const setupPushNotificationHandler = () => {
  const N = getNotifications();
  if (!N) return;

  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

export const registerPushNotificationCategory = async () => {
  const N = getNotifications();
  if (!N) return;

  await N.setNotificationCategoryAsync(PUSH_CATEGORY, [
    {
      identifier: ACTION_TAKEN,
      buttonTitle: "Taken",
      options: { opensAppToForeground: true },
    },
    {
      identifier: ACTION_MISSED,
      buttonTitle: "Missed",
      options: { opensAppToForeground: true },
    },
  ]);
};

export const ensurePushNotificationChannel = async () => {
  const N = getNotifications();
  if (!N || Platform.OS !== "android") return;

  await N.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Medication Reminders",
    importance: N.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2E8B57",
  });
};

export const requestPushNotificationPermissions = async () => {
  const N = getNotifications();
  if (!N) return false;

  await ensurePushNotificationChannel();

  const current = await N.getPermissionsAsync();
  if (current.granted) return true;

  const result = await N.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return !!result.granted;
};

const parsePushNotificationData = (data) => {
  if (!data) return null;

  let medicine = {};
  try {
    medicine = data.medicine ? JSON.parse(data.medicine) : {};
  } catch (e) {
    console.warn("parsePushNotificationData:", e);
  }

  return {
    docId: data.docId,
    selectedDate: data.selectedDate,
    medicine,
  };
};

const normalizeReminderTime = (reminder) => {
  if (!reminder) return null;
  if (typeof reminder.toDate === "function") return reminder.toDate();
  if (reminder instanceof Date) return reminder;
  const parsed = new Date(reminder);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildFireDate = (dateStr, reminder) => {
  const time = normalizeReminderTime(reminder);
  if (!time) return null;

  const day = moment(dateStr, "D/MMM/YYYY");
  if (!day.isValid()) return null;

  const fire = day
    .hour(time.getHours())
    .minute(time.getMinutes())
    .second(0)
    .millisecond(0);

  const result = fire.toDate();
  return result.getTime() > Date.now() ? result : null;
};

const buildIdentifier = (docId, date) => `${SCHEDULE_PREFIX}${docId}_${date}`;

const buildPayloadMedicine = (medicine) => ({
  ...medicine,
  reminder: normalizeReminderTime(medicine.reminder)?.toISOString() ?? null,
});

const scheduleOne = async (N, medicine, date, fireDate) => {
  await N.scheduleNotificationAsync({
    identifier: buildIdentifier(medicine.docId, date),
    content: {
      title: medicine.name,
      body: "Its time to take your medicine",
      sound: true,
      priority: N.AndroidNotificationPriority.MAX,
      categoryIdentifier: PUSH_CATEGORY,
      data: {
        docId: medicine.docId,
        selectedDate: date,
        medicine: JSON.stringify(buildPayloadMedicine(medicine)),
      },
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  });
};

export const cancelMedicationNotifications = async (docId) => {
  const N = getNotifications();
  if (!N || !docId) return;

  const scheduled = await N.getAllScheduledNotificationsAsync();
  const prefix = `${SCHEDULE_PREFIX}${docId}_`;
  await Promise.all(
    scheduled
      .filter((item) => item.identifier?.startsWith(prefix))
      .map((item) => N.cancelScheduledNotificationAsync(item.identifier)),
  );
};

export const scheduleMedicationNotifications = async (medicine) => {
  const N = getNotifications();
  if (!N || !medicine?.docId || !medicine?.dates?.length) {
    return false;
  }

  const granted = await requestPushNotificationPermissions();
  if (!granted) return false;

  await cancelMedicationNotifications(medicine.docId);

  const windowEnd = moment().add(WINDOW_DAYS, "days").endOf("day");
  const jobs = [];

  for (const date of medicine.dates) {
    const fireDate = buildFireDate(date, medicine.reminder);
    if (!fireDate) continue;
    if (moment(fireDate).isAfter(windowEnd)) continue;
    jobs.push(scheduleOne(N, medicine, date, fireDate));
  }

  await Promise.all(jobs);
  return true;
};

const getDesiredNotifications = (medicines) => {
  const desired = new Map();
  const windowEnd = moment().add(WINDOW_DAYS, "days").endOf("day");

  for (const medicine of medicines) {
    for (const date of medicine.dates ?? []) {
      const fireDate = buildFireDate(date, medicine.reminder);
      if (!fireDate) continue;
      if (moment(fireDate).isAfter(windowEnd)) continue;
      desired.set(buildIdentifier(medicine.docId, date), {
        medicine,
        date,
        fireDate,
      });
    }
  }

  return desired;
};

export const reconcilePushNotifications = async () => {
  const N = getNotifications();
  if (!N) return;

  try {
    const permissions = await N.getPermissionsAsync();
    if (!permissions.granted) return;

    const user = await getLocalStorage("userDetail");
    if (!user?.email) return;

    const snapshot = await getDocs(
      query(collection(db, "medication"), where("userEmail", "==", user.email)),
    );
    const medicines = snapshot.docs.map((docItem) => docItem.data());

    const desired = getDesiredNotifications(medicines);
    const scheduled = await N.getAllScheduledNotificationsAsync();
    const ours = scheduled.filter((item) =>
      item.identifier?.startsWith(SCHEDULE_PREFIX),
    );
    const scheduledIds = new Set(ours.map((item) => item.identifier));

    await Promise.all(
      ours
        .filter((item) => !desired.has(item.identifier))
        .map((item) => N.cancelScheduledNotificationAsync(item.identifier)),
    );

    const missing = [];
    for (const [identifier, info] of desired) {
      if (scheduledIds.has(identifier)) continue;
      missing.push(scheduleOne(N, info.medicine, info.date, info.fireDate));
    }
    await Promise.all(missing);
  } catch (e) {
    console.warn("reconcilePushNotifications:", e);
  }
};

export const sendTestPushNotification = async () => {
  const N = getNotifications();
  if (!N) return { ok: false, reason: "unsupported" };

  const granted = await requestPushNotificationPermissions();
  if (!granted) return { ok: false, reason: "denied" };

  const identifier = `test_${Date.now()}`;
  await N.scheduleNotificationAsync({
    identifier,
    content: {
      title: "Test Notification",
      body: "Its time to take your medicine",
      sound: true,
      priority: N.AndroidNotificationPriority.MAX,
      categoryIdentifier: PUSH_CATEGORY,
      data: {
        docId: "test",
        selectedDate: moment().format("D/MMM/YYYY"),
        medicine: JSON.stringify({ name: "Test" }),
      },
    },
    trigger: null,
  });
  return { ok: true, identifier };
};

export const handlePushNotificationResponse = async (response) => {
  if (!response?.notification?.request?.content?.data) return null;

  const parsed = parsePushNotificationData(
    response.notification.request.content.data,
  );
  if (!parsed?.docId || !parsed?.selectedDate) return null;

  if (
    response.actionIdentifier === ACTION_TAKEN ||
    response.actionIdentifier === ACTION_MISSED
  ) {
    const status =
      response.actionIdentifier === ACTION_TAKEN ? "Taken" : "Missed";
    try {
      await updateMedicationAction(parsed.docId, parsed.selectedDate, status);
    } catch (e) {
      console.warn("handlePushNotificationResponse:", e);
    }
    return { type: "action", status, ...parsed };
  }

  return { type: "open", ...parsed };
};

export const addPushNotificationResponseListener = (callback) => {
  const N = getNotifications();
  if (!N) return null;

  return N.addNotificationResponseReceivedListener(callback);
};

export const getLastPushNotificationResponse = async () => {
  const N = getNotifications();
  if (!N) return null;

  try {
    return await N.getLastNotificationResponseAsync();
  } catch (e) {
    return null;
  }
};

export const clearLastPushNotificationResponse = async () => {
  const N = getNotifications();
  if (!N) return;

  try {
    await N.clearLastNotificationResponseAsync();
  } catch (e) {}
};
