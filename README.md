# Shomoymoto (সময়মত) — Medication Reminder App

"সময়মত" means **"on time"** in Bengali. Shomoymoto is a cross-platform
(React Native / Expo) mobile app that helps people take their medicines on
time. Users register/login with email, add medications with a date range and a
daily reminder time, and receive **locally scheduled push notifications** at
the exact time every day. From the notification they can instantly mark the
medicine as **Taken** or **Missed**, keep a 7-day history, and the app
automatically highlights any day that was missed.

Built with **Expo SDK 57** + **React Native 0.86** and **Firebase** (Auth +
Cloud Firestore). The UI is fully bilingual (English / বাংলা).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Screens & Routing](#screens--routing)
- [Firestore Data Model](#firestore-data-model)
- [Notification System (deep dive)](#notification-system-deep-dive)
- [Supporting Services](#supporting-services)
- [Key Components](#key-components)
- [Build & Distribution (EAS)](#build--distribution-eas)
- [Offline Behavior](#offline-behavior)
- [Troubleshooting](#troubleshooting)
- [Scripts](#scripts)
- [License](#license)

---

## Features

**Authentication & Account**
- Email/password sign up, sign in, and password reset (Firebase Auth).
- Session persists on device via AsyncStorage; logged-out users are redirected
  to the welcome screen.
- Full account deletion with password re-authentication: removes the Firebase
  user **and** deletes all of that user's medication documents.

**Medication Management**
- Add a new medication: name, type (Tablet / Capsules / Drops / Syrup /
  Injection / Other), dose, "when to take" (Morning, Before/After Lunch, etc.),
  start date, end date, and reminder time.
- A date-range generates a list of scheduled dates stored on the document.
- **Edit** any medication (the form is pre-filled, same document is updated,
  and notifications are re-scheduled).
- **Delete** with confirmation — also cancels all scheduled notifications for
  that medication.

**Reminders / Notifications**
- One daily notification per date in the range at the exact reminder time
  (local, OS-scheduled — no server push).
- On-time delivery using Android **exact alarm** permission
  (`SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`).
- Android notification channel with high importance + vibration, using the
  app's icon/color.
- The notification carries two actions: **Taken** and **Missed**. Pressing one
  writes the result straight to Firestore.
- Tapping the notification body opens a full **action modal** to confirm
  Taken/Missed.
- Reconcile logic keeps scheduled notifications in sync with Firestore: it
  cancels stale ones and schedules missing ones whenever the app starts or
  returns to the foreground.
- **Test Notification** button in Profile: fires an instant test notification
  so you can verify the whole pipeline (permission, channel, actions).

**Tracking & History**
- Home screen with a horizontal date strip (today + next 7 days). Swiping to a
  date shows only the medications scheduled for that day.
- Auto status coloring: **green** card = taken, **red** card = missed.
- Auto "missed" detection: if a date **has fully passed** (end of day) and no
  action was recorded, the card automatically turns red.
- History tab shows the previous 7 days with the same status coloring and lets
  you browse each day.

**Localization**
- English and বাংলা, switchable at runtime from Profile, persisted on device.
- All static strings live in one dictionary (`service/i18n.jsx`); type / when
  options are translated with a `translateOption` helper.
- AM/PM stays in Latin script while the rest of the time/date is localized.

---

## Tech Stack

| Area          | Choice                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Framework     | [Expo](https://expo.dev) SDK 57 (React Native 0.86, React 19)          |
| Navigation    | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Language      | JavaScript (`.jsx`), TypeScript allowed (`_layout.tsx`)                |
| Backend       | Firebase Auth + Cloud Firestore (`firebase` v12 JS SDK)                |
| Notifications | `expo-notifications` (local scheduled notifications)                   |
| Storage (local) | `@react-native-async-storage/async-storage`                         |
| Dates         | `moment` (EN + `moment/locale/bn`) + `@react-native-community/datetimepicker` |
| Pickers       | `@react-native-picker/picker`                                          |
| Icons         | `@expo/vector-icons` (Ionicons, Octicons)                              |
| Dev client    | `expo-dev-client` (EAS development builds)                             |
| Lint          | ESLint (`eslint-config-expo`)                                          |

---

## Getting Started

### Prerequisites
- Node.js LTS + npm
- An Android device/emulator (or iOS simulator). The notification **actions
  (buttons) only render in a development or production build** — they do not
  appear in Expo Go.
- A Firebase project (Auth with email/password + Firestore) to replace the
  config in `config/FirebaseConfig.jsx`.

### Install dependencies
```bash
npm install
```

### Firebase setup (if you fork this repo)
1. Create a Firebase project and register a web/mobile app.
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Create a **Cloud Firestore** database and deploy the included rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   (`firestore.rules` only allows a user to read/write docs owned by their
   verified email.)
4. Replace `config/FirebaseConfig.jsx` with **your** Firebase config values.

### Run
The app is made for a **development build** (needed for notification buttons):
```bash
npm run start          # start Metro (expo start -c)
```
Open it with the installed dev client, or build a fresh one (see
[Build & Distribution](#build--distribution-eas)).

---

## Project Structure

```
Shomoymoto/
├── app.json                     # Expo config, plugins, Android package, permissions
├── eas.json                     # EAS build profiles (development/preview/production)
├── firestore.rules              # Firestore security rules
├── constant/
│   └── Options.jsx              # Medication type list/icons, "When to take" options
├── config/
│   └── FirebaseConfig.jsx       # Firebase init (auth persistence + Firestore)
├── service/                     # Reusable logic (no UI)
│   ├── i18n.jsx                 # en/bn dictionaries + LanguageProvider
│   ├── storage.jsx              # AsyncStorage helpers
│   ├── medicationActions.jsx    # update action / delete doc
│   ├── pushnotification.jsx     # scheduling, reconcile, category, test (ACTIVE)
│   ├── notifications.jsx        # legacy module (no longer imported)
│   ├── convertDateTime.jsx      # date/time formatting + date ranges
│   └── accountDeletion.jsx      # reauth + delete user + delete all docs
├── components/                  # Presentational components
│   ├── Header.jsx               # greeting + medkit shortcut
│   ├── MedicationList.jsx       # home list + date strip
│   ├── MedicationCardItem.jsx   # single med card (taken/missed, edit/delete)
│   ├── EmptyState.jsx           # "no medication" placeholder
│   ├── AddMedicationForm.jsx    # add/edit form
│   └── AddMedicationHeader.jsx  # banner image + back button
├── src/app/                     # Expo Router (file-based routes)
│   ├── _layout.tsx              # root: splash, language provider, notifications bootstrap
│   ├── login/
│   │   ├── index.jsx            # onboarding / welcome
│   │   ├── signIn.jsx           # sign-in form
│   │   ├── signUp.jsx           # sign-up form
│   │   └── forgotPassword.jsx   # password reset
│   ├── (tabs)/
│   │   ├── _layout.jsx          # bottom tab bar + auth guard
│   │   ├── index.jsx            # Home
│   │   ├── History.jsx          # History (previous 7 days)
│   │   └── profile.jsx          # Profile (menus, language, test, logout, delete)
│   ├── add-new-medication/
│   │   └── index.jsx            # Add/Edit medication screen
│   └── action-modal/
│       └── index.jsx            # Taken/Missed confirmation modal
└── assets/                      # images, icons, splash
```

---

## Screens & Routing

| Route                   | File                            | Purpose                                            |
| ----------------------- | ------------------------------- | -------------------------------------------------- |
| `/` (Home tab)          | `src/app/(tabs)/index.jsx`      | Header + `MedicationList` for the selected date    |
| `/History`              | `src/app/(tabs)/History.jsx`    | Last 7 days history with status colors             |
| `(tabs) → Profile`      | `src/app/(tabs)/profile.jsx`    | User info, menu, language, test notification, logout, delete account |
| `/add-new-medication`   | `src/app/add-new-medication/`   | Add a medication (`mode` param = `edit` for editing) |
| `/action-modal`         | `src/app/action-modal/`         | Full-screen modal: mark Taken/Missed               |
| `/login`                | `src/app/login/index.jsx`       | Welcome/onboarding                                 |
| `/login/signIn`         | `src/app/login/signIn.jsx`      | Sign in with email/password                        |
| `/login/signUp`         | `src/app/login/signUp.jsx`      | Create account                                     |
| `/login/forgotPassword` | `src/app/login/forgotPassword.jsx` | Send reset link                                |

**Auth guard:** `src/app/(tabs)/_layout.jsx` reads `userDetail` from
AsyncStorage on mount; if absent it `router.replace("/login")`.

**Modal presentation:** `_layout.tsx` registers `action-modal` with
`presentation: "modal"`.

---

## Firestore Data Model

Collection: `medication` (one document per medication course per user)

```js
{
  docId:      string,          // same as the Firestore document id (Date.now() string)
  userEmail:  string,          // owner (used by security rules + queries)
  name:       string,          // medicine name
  type:       { name, icon },  // Tablet / Capsules / Drops / Syrup / Injection / Other
  dose:       string,          // e.g. "2ml", "5ml", "1 + 0 + 1"
  when:       string,          // "Morning", "After Lunch", ... (EN keys stored)
  startDate:  Date/Timestamp,  // course start (displayed via startDate/dates)
  endDate:    Date/Timestamp,  // course end
  reminder:   Date/Timestamp,  // daily reminder time (hours/minutes used)
  dates:      string[],        // ["24/Sep/2026", "25/Sep/2026", ...] generated range
  action:     [                // recorded Taken/Missed responses
    { status: "Taken" | "Missed", time: "9:41 AM", date: "24/Sep/2026" }
  ]
}
```

`firestore.rules`:
- `read`: only the user whose verified email equals `resource.data.userEmail`.
- `create`: must be signed in and `userEmail` must match the token email.
- `update/delete`: same owner rule as read.

---

## Notification System (deep dive)

All logic lives in **`service/pushnotification.jsx`**.

### Design decisions
- **Local scheduled notifications** (expo-notifications), not FCM push: the OS
  stores the alarm and fires it even when the app is closed or offline.
- An **Android channel** (`medication-reminders`) with `MAX` importance and a
  vibration pattern so reminders are loud and visible.
- The category `medicationPush` registers two actions — **Taken** / **Missed**
  (opens app to foreground when tapped).
- In Expo Go the module is disabled (`pushNotificationsSupported`), so action
  buttons only exist in dev/production builds.

### Flow on app start / foreground
`src/app/_layout.tsx` runs:
1. `setupPushNotificationHandler()` — show banner/list in foreground, play sound.
2. `registerPushNotificationCategory()` — register Taken/Missed buttons.
3. `requestPushNotificationPermissions()` — ask once if not granted.
4. `reconcilePushNotifications()` — sync OS schedule with Firestore.
5. Listens for notification responses and routes "open" taps to the modal.

`reconcilePushNotifications()`:
1. Reads permissions; if not granted, does nothing.
2. Reads the user's email from AsyncStorage and fetches all their medications.
3. Builds the **desired** set of identifiers
   (`med_<docId>_<D/MMM/YYYY>`) for the next `WINDOW_DAYS = 7` days whose fire
   time is still in the future.
4. Cancels every `med_*` scheduled notification **not** in the desired set.
5. Schedules the missing ones. Notifications past their fire time are skipped
   by `buildFireDate`.

`buildFireDate(dateStr, reminder)` combines the date string
(`D/MMM/YYYY`) with the hours/minutes of the reminder timestamp and returns
the resulting `Date` (or `null` if it's already in the past).

### After saving a medication
`AddMedicationForm.SaveMedication()` calls
`scheduleMedicationNotifications(savedMedicine)` which:
1. Requests permission (no-op if already granted).
2. Cancels existing notifications for that `docId`.
3. Schedules one notification per date in the generated range (only future
   dates within the 7-day window).

### Handling a response
`handlePushNotificationResponse(response)`:
- Parses the payload (`docId`, `selectedDate`, `medicine`).
- If the action was **Taken** or **Missed**, calls
  `updateMedicationAction(docId, selectedDate, status)` to store the result.
- Otherwise returns `{ type: "open" }`, and `_layout.tsx` pushes the action
  modal.

### Test notification
`sendTestPushNotification()` (Profile → Test Notification) requests permission
then schedules an **instant** notification (`trigger: null`) on the same
channel/category so you can verify the status-bar, sound, and Taken/Missed
buttons end-to-end.

### On-time delivery
`app.json` declares:
```json
"permissions": ["SCHEDULE_EXACT_ALARM", "USE_EXACT_ALARM"]
```
This lets `expo-notifications` use an **exact** alarm
(`AlarmManagerCompat.setExactAndAllowWhileIdle`) instead of an inexact one,
which Android would otherwise batch/delay. **Important:** adding a permission
is a native change — a fresh dev-build/binary must be installed for it to take
effect.

---

## Supporting Services

### `service/i18n.jsx` — localization
- `translations = { en: {...}, bn: {...} }`, a flat key → string dictionary.
- `translate(key, params)` replaces `{{name}}`-style placeholders.
- `translateOption(category, value)` translates option values, e.g.
  `tv("type", medicine.type.name)` or `tv("when", medicine.when)`, falling
  back to the untranslated value.
- `LanguageProvider` loads the stored language on mount, exposes
  `{ language, setLanguage, t, tv }`, and persists the choice to
  AsyncStorage under `appLanguage`.

### `service/storage.jsx` — AsyncStorage helpers
JSON-in / JSON-out wrappers: `setLocalStorage`, `getLocalStorage`,
`removeLocalStorage`.

### `service/convertDateTime.jsx` — date/time helpers
- `formatDateForText(date)` → `"24 Sep 2026"` (Bengali digits/locale when bn).
- `formatTime(time)` → `"9:41 AM"` (AM/PM always Latin).
- `getDatesRange(start, end)` → array of `"D/MMM/YYYY"` strings, one per day.
- `GetDateRangeToDisplay()` → today + next 7 days (Home strip).
- `GetPreviousDateRangeToDisplay(7)` → previous 7 days (History strip).

### `service/medicationActions.jsx`
- `updateMedicationAction(docId, date, status)`: loads the doc, removes any
  previous `action` entry for the same date, and appends
  `{ status, time: moment().format("LT"), date }`.
- `deleteMedication(docId)`: `deleteDoc` on the medication document.

### `service/pushnotification.jsx` — exports
`PUSH_CATEGORY`, `ACTION_TAKEN`, `ACTION_MISSED`,
`setupPushNotificationHandler`, `registerPushNotificationCategory`,
`ensurePushNotificationChannel`, `requestPushNotificationPermissions`,
`scheduleMedicationNotifications`, `cancelMedicationNotifications`,
`reconcilePushNotifications`, `handlePushNotificationResponse`,
`sendTestPushNotification`, `addPushNotificationResponseListener`,
`getLastPushNotificationResponse`, `clearLastPushNotificationResponse`.

### `service/accountDeletion.jsx`
- `hasRecentLogin()`: true if sign-in happened within the last 5 minutes
  (avoids the `auth/requires-recent-login` error).
- `deleteUserAccount(user, password)`: optionally re-authenticates with the
  password, deletes all of the user's medication documents, then deletes the
  Firebase user.

---

## Key Components

### `MedicationCardItem.jsx`
Renders one medication card for a given date. Determines display state:
- `recordedTaken` / `recordedMissed` — an `action` entry for the selected date.
- `isDayOver` — the selected date **fully ended** (`endOf("day") < now`);
  combined with no recorded action it auto-marks the card **missed**.
- Card turns green (`#C8E6C9`) when taken, red (`#FFCDD2`) when missed.

Card actions:
- **Tap** → open `/action-modal` (payload: medicine + selectedDate).
- **Pencil** → open `/add-new-medication?mode=edit` with the medicine JSON.
- **Trash (top-right)** → confirmation dialog, then
  `cancelMedicationNotifications` + `deleteMedication` + `onDeleted()`.

Timestamps are serialized (`.toISOString()`) before passing through route
params so they survive navigation.

### `MedicationList.jsx`
Fetches medications for the selected date:
```
medication where userEmail == <me> and dates array-contains <selectedDate>
```
Re-runs on screen focus and whenever the date changes. Renders a banner image,
a horizontal date strip, and `MedicationCardItem`s (or an `EmptyState` /
spinner).

### `AddMedicationForm.jsx`
Handles both add (`mode` unset) and edit (`mode=edit`). On edit it parses the
incoming `medicine` param, converting dates — including Firestore timestamp
objects (`{ seconds, nanoseconds }`) — back into `Date`s to pre-fill the
picker. On save it builds `savedMedicine`, writes with `setDoc` (new) or
`updateDoc` (edit, reusing the same `docId`), then calls
`scheduleMedicationNotifications`. Validation requires name, type, dose, a
real "when" option, start date, end date, and reminder time.

The "When To Take" field uses a transparent `<Picker>` overlay on top of a
visible `<Text>` label so it behaves like a native dropdown while looking
clean.

### `EmptyState.jsx` / `Header.jsx` / `AddMedicationHeader.jsx`
Simple presentational pieces: empty placeholder with a CTA to add medication,
a greeting header with a medkit shortcut, and a banner with a back button.

---

## Build & Distribution (EAS)

`eas.json` defines three profiles. The dev client work is done under
`development`:

```bash
npx eas-cli build --platform android --profile development
```

- EAS Cloud build (no local Android SDK required), project-linked via `owner`
  and `extra.eas.projectId` in `app.json`.
- After the build, install the APK on the device (same package id
  `com.ahnaf_ruet.Shomoymoto` → upgrades in place), then:
  ```bash
  npm run start
  ```
- **Any change to `app.json`, native config/plugins, or `package.json` deps
  requires a rebuild.** Pure JS/TSX changes hot-reload through Metro — no
  rebuild needed.

---

## Offline Behavior

- Data (medications, actions, auth) lives in **Cloud Firestore**, so the app
  is an online-first app: listing, adding, editing, deleting, and recording
  Taken/Missed all require a network connection.
- **Scheduled notifications are local** to the OS and fire on time even when
  the device is offline or the app is closed — as long as they were scheduled
  earlier while online.
- `reconcilePushNotifications` runs on app start/foreground and needs
  Firestore, so a fresh schedule can only be computed when online.
- Android specifics: a force-stopped app won't fire alarms until reopened;
  after a device reboot expo-notifications re-registers scheduled alarms.

---

## Troubleshooting

| Symptom | Cause / fix |
| ------- | ----------- |
| Notification buttons (Taken/Missed) don't appear | Running in **Expo Go**. Use a dev/production build (`expo-dev-client`). |
| Notification fires late / not exactly on time | Missing exact-alarm permission. Rebuild after adding `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` to `app.json`, then check Settings → Apps → Shomoymoto → Alarms & reminders. |
| Notification never fires | Permission not granted, or reminder time already passed. Use **Profile → Test Notification** to verify the pipeline; set a reminder a couple of minutes ahead to test timing. |
| "Invalid date" when editing | Old documents may hold Firestore Timestamps; the form handles `{seconds, nanoseconds}` (see `AddMedicationForm.jsx` `toDate`). |
| Stale/wrong scheduled set | `reconcilePushNotifications` auto-fixes on next foreground; editing/deleting re-schedules automatically. |
| Lint | `npm run lint` → currently 0 errors (pre-existing warnings only). |

---

## Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run start`      | Start Metro with cache clear             |
| `npm run android`    | Start and open on Android (Expo Go path) |
| `npm run ios`        | Start and open on iOS                    |
| `npm run web`        | Start web version                        |
| `npm run lint`       | Run ESLint (`expo lint`)                 |
| `npm run reset-project` | Reset starter template (not needed)  |

---

## License

See [LICENSE](LICENSE).