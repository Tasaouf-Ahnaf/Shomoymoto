import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getLocalStorage, setLocalStorage } from "./storage";

const STORAGE_KEY = "appLanguage";
const DEFAULT_LANGUAGE = "en";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
];

export const translations = {
  en: {
    hello: "{{name}}",
    home: "Home",
    history: "History",
    profile: "Profile",

    noMedications: "No Medications !",
    noMedicationsSetUp: "You have 0 medication set up.",
    kindlySetUp: "Kindly set up a new one.",
    addNewMedication: "Add New Medication",

    addNewMedicationHeader: "Add New Medication",
    editMedicationHeader: "Edit Medication",
    medicationUpdated: "Medication updated.",
    edit: "Edit",
    deleteMedicationConfirm: "Are you sure you want to delete this medication?",
    medicineName: "Medicine Name",
    dosePlaceholder: "Dose Ex. 2ml, 5ml",
    startDate: "Start Date",
    endDate: "End Date",
    selectReminderTime: "Select Reminder Time",
    enterAllFields: "Enter all Fields",
    fillAllFields: "Please fill in all the fields before submitting.",
    successful: "Successful !",
    newMedicationAdded: "New Medication added.",
    ok: "Ok",

    "type.Tablet": "Tablet",
    "type.Capsules": "Capsules",
    "type.Drops": "Drops",
    "type.Syrup": "Syrup",
    "type.Injection": "Injection",
    "type.Other": "Other",

    "when.When To Take": "When To Take",
    "when.Morning": "Morning",
    "when.Before Lunch": "Before Lunch",
    "when.After Lunch": "After Lunch",
    "when.Afternoon": "Afternoon",
    "when.Evening": "Evening",
    "when.Before Dinner": "Before Dinner",
    "when.After Dinner": "After Dinner",
    "when.Before Sleeping": "Before Sleeping",

    medicationHistory: "Medication History",
    noMedicationOnDate: "No medication on this date",
    noMedicationHistory: "No medication History",
    exportPdfReport: "Export History PDF",
    generatePdf: "Generate PDF Report",
    generatingPdf: "Generating PDF...",
    invalidDateRange: "End date must be on or after the start date.",
    pdfError: "Could not generate the PDF report. Please try again.",

    myMedication: "My Medication",
    language: "Language",
    logout: "Logout",
    deleteAccount: "Delete Account",
    logoutConfirmMsg: "Are you sure you want to logout?",
    cancel: "Cancel",
    deleteAccountConfirmMsg:
      "This will permanently delete your account and all of your medication data. This cannot be undone. Continue?",
    delete: "Delete",
    deleting: "Deleting...",
    confirmDeleteTitle: "Confirm deletion",
    confirmDeleteMsg: "Enter your password to confirm deleting your account.",
    incorrectPassword: "Incorrect password.",
    error: "Error",
    couldNotDeleteAccount: "Could not delete your account.",

    setReminder: "Set Reminder",
    itsTimeToTake: "It's time to take.",
    missed: "Missed",
    taken: "Taken",
    responseSaved: "Response Saved !",

    testNotification: "Test Notification",
    testNotificationSent: "Test notification sent. Check the notification bar.",
    testNotificationPermission:
      "Notification permission is not granted. Please enable it in Settings.",

    welcomeTo: "Welcome to Shomoymoto",
    stayOnTrack: "Stay on Track\nStay Healthy!",
    trackYourMedicine: "Track your medicine, Stay consistent, Stay Confident.",
    continue: "Continue",
    termsAgree:
      "By clicking Continue, you agree with our Terms and Conditions.",

    letsSignYouIn: "Let's Sign You In",
    welcomeBack: "Welcome back, you've been missed!",
    email: "Email",
    enterEmail: "Enter your email",
    password: "Password",
    enterPassword: "Enter your password",
    signIn: "Sign In",
    signingIn: "Signing In...",
    createAccount: "Create Account",
    enterEmailPassword: "Please enter email and password.",
    invalidEmailPassword: "Invalid email or password.",
    enterValidEmail: "Please enter a valid email.",
    tooManyAttempts: "Too many attempts. Try again later.",
    couldNotSignIn: "Could not sign in. Please try again.",

    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    resetPasswordSubtitle:
      "Enter your email and we'll send you a link to reset your password.",
    sendResetLink: "Send Reset Link",
    sending: "Sending...",
    resetEmailSent: "Email sent",
    resetEmailSentMsg: "Check your inbox for a link to reset your password.",
    noAccountFound: "No account found with this email.",
    resetLinkFailed: "Could not send reset link. Please try again.",
    goToMainPage: "Go to main page",

    createNewAccount: "Create New Account",
    getStarted: "Let's get you started on Shomoymoto.",
    fullName: "Full Name",
    enterFullName: "Enter your full name",
    createPassword: "Create a password",
    alreadyHaveAccount: "Already have an account?",
    fillAllDetails: "Please fill all details",
    emailAlreadyExists: "Email already exists",
    weakPassword: "Password should be at least 6 characters",
    couldNotCreateAccount: "Could not create account. Please try again.",
  },
  bn: {
    hello: "{{name}}",
    home: "হোম",
    history: "হিস্ট্রি",
    profile: "প্রোফাইল",

    noMedications: "কোনো ঔষধ নেই !",
    noMedicationsSetUp: "আপনার কোনো ঔষধ সেট করা নেই।",
    kindlySetUp: "অনুগ্রহ করে একটি নতুন সেট করুন।",
    addNewMedication: "নতুন ঔষধ যোগ করুন",

    addNewMedicationHeader: "নতুন ঔষধ যোগ করুন",
    editMedicationHeader: "ঔষধ সম্পাদনা করুন",
    medicationUpdated: "ঔষধ আপডেট হয়েছে।",
    edit: "সম্পাদনা",
    deleteMedicationConfirm: "আপনি কি নিশ্চিত এই ঔষধটি মুছে ফেলতে চান?",
    medicineName: "ঔষধের নাম",
    dosePlaceholder: "ডোজ যেমন ২ml, ৫ml",
    startDate: "শুরুর তারিখ",
    endDate: "শেষের তারিখ",
    selectReminderTime: "রিমাইন্ডার সময় নির্বাচন করুন",
    enterAllFields: "সব ঘর পূরণ করুন",
    fillAllFields: "জমা দেওয়ার আগে অনুগ্রহ করে সব ঘর পূরণ করুন।",
    successful: "সফল !",
    newMedicationAdded: "নতুন ঔষধ যোগ হয়েছে।",
    ok: "ঠিক আছে",

    "type.Tablet": "ট্যাবলেট",
    "type.Capsules": "ক্যাপসুল",
    "type.Drops": "ড্রপ",
    "type.Syrup": "সিরাপ",
    "type.Injection": "ইনজেকশন",
    "type.Other": "অন্যান্য",

    "when.When To Take": "কখন খাবেন",
    "when.Morning": "সকালে",
    "when.Before Lunch": "দুপুরের খাবারের আগে",
    "when.After Lunch": "দুপুরের খাবারের পরে",
    "when.Afternoon": "বিকালে",
    "when.Evening": "সন্ধ্যায়",
    "when.Before Dinner": "রাতের খাবারের আগে",
    "when.After Dinner": "রাতের খাবারের পরে",
    "when.Before Sleeping": "ঘুমানোর আগে",

    medicationHistory: "ঔষধের হিস্ট্রি",
    noMedicationOnDate: "এই তারিখে কোনো ঔষধ নেই",
    noMedicationHistory: "কোনো ঔষধের হিস্ট্রি নেই",
    exportPdfReport: "হিস্ট্রি PDF ডাউনলোড",
    generatePdf: "PDF রিপোর্ট তৈরি করুন",
    generatingPdf: "PDF তৈরি হচ্ছে...",
    invalidDateRange: "শেষের তারিখ অবশ্যই শুরুর তারিখের সমান বা পরে হতে হবে।",
    pdfError: "PDF রিপোর্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।",

    myMedication: "আমার ঔষধ",
    language: "ভাষা",
    logout: "লগ আউট",
    deleteAccount: "অ্যাকাউন্ট মুছুন",
    logoutConfirmMsg: "আপনি কি নিশ্চিত যে লগ আউট করতে চান?",
    cancel: "বাতিল",
    deleteAccountConfirmMsg:
      "এটি আপনার অ্যাকাউন্ট এবং সমস্ত ঔষধের তথ্য স্থায়ীভাবে মুছে ফেলবে। এটি ফিরিয়ে আনা যাবে না। চালিয়ে যাবেন?",
    delete: "মুছুন",
    deleting: "মুছে ফেলা হচ্ছে...",
    confirmDeleteTitle: "মুছে ফেলা নিশ্চিত করুন",
    confirmDeleteMsg: "আপনার অ্যাকাউন্ট মুছে ফেলার জন্য পাসওয়ার্ড লিখুন।",
    incorrectPassword: "ভুল পাসওয়ার্ড।",
    error: "ত্রুটি",
    couldNotDeleteAccount: "আপনার অ্যাকাউন্ট মুছে ফেলা যায়নি।",

    setReminder: "রিমাইন্ডার সেট করুন",
    itsTimeToTake: "ঔষধ খাওয়ার সময় হয়েছে।",
    missed: "মিস হয়েছে",
    taken: "নেওয়া হয়েছে",
    responseSaved: "রেসপন্স সংরক্ষিত !",

    testNotification: "পরীক্ষামূলক নোটিফিকেশন",
    testNotificationSent:
      "পরীক্ষামূলক নোটিফিকেশন পাঠানো হয়েছে। নোটিফিকেশন বারে দেখুন।",
    testNotificationPermission:
      "নোটিফিকেশন অনুমতি দেওয়া হয়নি। অনুগ্রহ করে সেটিংস থেকে চালু করুন।",

    welcomeTo: "সময়মত-এ স্বাগতম",
    stayOnTrack: "সঠিক পথে থাকুন\nসুস্থ থাকুন!",
    trackYourMedicine:
      "আপনার ঔষধ ট্র্যাক করুন, নিয়মিত থাকুন, আত্মবিশ্বাসী থাকুন।",
    continue: "চালিয়ে যান",
    termsAgree: "Continue চাপলে আপনি আমাদের শর্তাবলীতে সম্মত হচ্ছেন।",

    letsSignYouIn: "চলুন সাইন ইন করি",
    welcomeBack: "স্বাগতম, আপনাকে মিস করেছি!",
    email: "ইমেইল",
    enterEmail: "আপনার ইমেইল লিখুন",
    password: "পাসওয়ার্ড",
    enterPassword: "আপনার পাসওয়ার্ড লিখুন",
    signIn: "সাইন ইন",
    signingIn: "সাইন ইন হচ্ছে...",
    createAccount: "অ্যাকাউন্ট তৈরি করুন",
    enterEmailPassword: "অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড লিখুন।",
    invalidEmailPassword: "ভুল ইমেইল বা পাসওয়ার্ড।",
    enterValidEmail: "অনুগ্রহ করে একটি বৈধ ইমেইল লিখুন।",
    tooManyAttempts: "অনেকবার চেষ্টা হয়েছে। পরে আবার চেষ্টা করুন।",
    couldNotSignIn: "সাইন ইন করা যায়নি। আবার চেষ্টা করুন।",

    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    resetPassword: "পাসওয়ার্ড রিসেট করুন",
    resetPasswordSubtitle:
      "আপনার ইমেইল লিখুন, আমরা পাসওয়ার্ড রিসেট করার একটি লিংক পাঠাব।",
    sendResetLink: "রিসেট লিংক পাঠান",
    sending: "পাঠানো হচ্ছে...",
    resetEmailSent: "ইমেইল পাঠানো হয়েছে",
    resetEmailSentMsg: "পাসওয়ার্ড রিসেট করার লিংক আপনার ইনবক্সে দেখুন।",
    noAccountFound: "এই ইমেইলের সাথে কোনো অ্যাকাউন্ট পাওয়া যায়নি।",
    resetLinkFailed: "রিসেট লিংক পাঠানো যায়নি। আবার চেষ্টা করুন।",
    goToMainPage: "মূল পেজে যান",

    createNewAccount: "নতুন অ্যাকাউন্ট তৈরি করুন",
    getStarted: "সময়মত-এ আপনাকে শুরু করি।",
    fullName: "পূর্ণ নাম",
    enterFullName: "আপনার পূর্ণ নাম লিখুন",
    createPassword: "একটি পাসওয়ার্ড তৈরি করুন",
    alreadyHaveAccount: "আগে থেকেই অ্যাকাউন্ট আছে?",
    fillAllDetails: "অনুগ্রহ করে সব তথ্য পূরণ করুন",
    emailAlreadyExists: "ইমেইল আগে থেকেই আছে",
    weakPassword: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে",
    couldNotCreateAccount: "অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।",
  },
};

let currentLanguage = DEFAULT_LANGUAGE;

export const getLanguage = () => currentLanguage;

export const translate = (language, key, params) => {
  const dictionary = translations[language] ?? translations[DEFAULT_LANGUAGE];
  const value = dictionary[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;

  if (!params) return value;

  return Object.entries(params).reduce(
    (result, [paramKey, paramValue]) =>
      result.replace(new RegExp(`{{${paramKey}}}`, "g"), paramValue),
    value,
  );
};

export const translateOption = (language, category, value) => {
  if (value === undefined || value === null || value === "") return "";
  const key = `${category}.${value}`;
  const dictionary = translations[language] ?? translations[DEFAULT_LANGUAGE];
  return dictionary[key] ?? translations[DEFAULT_LANGUAGE][key] ?? value;
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    const loadLanguage = async () => {
      const stored = await getLocalStorage(STORAGE_KEY);
      if (stored && translations[stored]) {
        currentLanguage = stored;
        setLanguageState(stored);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (code) => {
    if (!translations[code]) return;
    currentLanguage = code;
    setLanguageState(code);
    await setLocalStorage(STORAGE_KEY, code);
  }, []);

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language],
  );

  const tv = useCallback(
    (category, optionValue) => translateOption(language, category, optionValue),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, tv }),
    [language, setLanguage, t, tv],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * @returns {{
 *   language: string,
 *   setLanguage: (code: string) => Promise<void>,
 *   t: (key: string, params?: Record<string, string | number>) => string,
 *   tv: (category: string, value?: string) => string,
 * }}
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
