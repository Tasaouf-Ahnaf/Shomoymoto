import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../../config/FirebaseConfig";
import { useLanguage } from "../../../service/i18n";

const DARK = "#0f2f2b";
const MUTED = "#6B7A76";
const BORDER = "#D9E2DF";

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const notify = (message) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("সময়মত", message);
    }
  };

  const OnSendResetLink = () => {
    if (!email) {
      notify(t("enterEmail"));
      return;
    }

    setBusy(true);
    sendPasswordResetEmail(auth, email.trim())
      .then(() => {
        Alert.alert(t("resetEmailSent"), t("resetEmailSentMsg"), [
          {
            text: t("goToMainPage"),
            onPress: () => router.replace("/login/signIn"),
          },
        ]);
      })
      .catch((error) => {
        (error.code, error.message);
        if (error.code === "auth/user-not-found") {
          notify(t("noAccountFound"));
        } else if (error.code === "auth/invalid-email") {
          notify(t("enterValidEmail"));
        } else if (error.code === "auth/too-many-requests") {
          notify(t("tooManyAttempts"));
        } else {
          notify(t("resetLinkFailed"));
        }
      })
      .finally(() => setBusy(false));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t("resetPassword")}</Text>
            <Text style={styles.subtitle}>{t("resetPasswordSubtitle")}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{t("email")}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t("enterEmail")}
                placeholderTextColor={MUTED}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!busy}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={OnSendResetLink}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryText}>{t("sendResetLink")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={() => router.replace("/login/signIn")}
            >
              <Text style={styles.secondaryText}>{t("goToMainPage")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: DARK,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    color: MUTED,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: DARK,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: DARK,
    backgroundColor: "#FFFFFF",
  },
  actions: {
    marginTop: "auto",
    paddingTop: 36,
    gap: 14,
  },
  primaryButton: {
    height: 56,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: DARK,
    backgroundColor: "#FFFFFF",
  },
  secondaryText: {
    color: DARK,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
