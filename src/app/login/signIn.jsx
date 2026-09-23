import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
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
import { setLocalStorage } from "../../../service/storage";

const DARK = "#0f2f2b";
const MUTED = "#6B7A76";
const BORDER = "#D9E2DF";

export default function SignIn() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const notify = (message) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("সময়মত", message);
    }
  };

  const OnSignInClick = () => {
    if (!email || !password) {
      notify(t("enterEmailPassword"));
      return;
    }

    setBusy(true);
    signInWithEmailAndPassword(auth, email.trim(), password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        ("signed in:", user.email);
        await setLocalStorage("userDetail", {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
        router.replace("/");
      })
      .catch((error) => {
        (error.code, error.message);
        if (
          error.code === "auth/invalid-credential" ||
          error.code === "auth/wrong-password" ||
          error.code === "auth/user-not-found"
        ) {
          notify(t("invalidEmailPassword"));
        } else if (error.code === "auth/invalid-email") {
          notify(t("enterValidEmail"));
        } else if (error.code === "auth/too-many-requests") {
          notify(t("tooManyAttempts"));
        } else {
          notify(t("couldNotSignIn"));
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
            <Text style={styles.title}>{t("letsSignYouIn")}</Text>
            <Text style={styles.subtitle}>{t("welcomeBack")}</Text>
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
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("password")}</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t("enterPassword")}
                  placeholderTextColor={MUTED}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                  hitSlop={10}
                  onPress={() => setShowPassword((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={MUTED}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.forgotButton}
                activeOpacity={0.7}
                onPress={() => router.push("/login/forgotPassword")}
              >
                <Text style={styles.forgotText}>{t("forgotPassword")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={OnSignInClick}
              disabled={busy}
            >
              <Text style={styles.primaryText}>
                {busy ? t("signingIn") : t("signIn")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={() => router.push("/login/signUp")}
            >
              <Text style={styles.secondaryText}>{t("createAccount")}</Text>
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
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: DARK,
    padding: 0,
  },
  eyeButton: {
    paddingLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 10,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
    color: DARK,
    textDecorationLine: "underline",
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
