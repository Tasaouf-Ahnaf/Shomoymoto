import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
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

export default function SignUp() {
  const router = useRouter();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const notify = (message) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("সময়মত", message);
    }
  };

  const OnCreateAccount = () => {
    if (!fullName || !email || !password) {
      notify(t("fillAllDetails"));
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        //Signed up
        const user = userCredential.user;

        await updateProfile(user, {
          displayName: fullName,
        });

        await setLocalStorage("userDetail", {
          uid: user.uid,
          email: user.email,
          displayName: fullName,
        });

        router.replace("/");
        //...
      })
      .catch((error) => {
        const errorCode = error.code;
        (errorCode, error.message);
        if (errorCode === "auth/email-already-in-use") {
          notify(t("emailAlreadyExists"));
        } else if (errorCode === "auth/invalid-email") {
          notify(t("enterValidEmail"));
        } else if (errorCode === "auth/weak-password") {
          notify(t("weakPassword"));
        } else {
          notify(t("couldNotCreateAccount"));
        }
      });
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
            <Text style={styles.title}>{t("createNewAccount")}</Text>
            <Text style={styles.subtitle}>{t("getStarted")}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{t("fullName")}</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder={t("enterFullName")}
                placeholderTextColor={MUTED}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

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
                  placeholder={t("createPassword")}
                  placeholderTextColor={MUTED}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
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
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={OnCreateAccount}
            >
              <Text style={styles.primaryText}>{t("createAccount")}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("alreadyHaveAccount")}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.replace("/login/signIn")}
              >
                <Text style={styles.footerLink}>{t("signIn")}</Text>
              </TouchableOpacity>
            </View>
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
  actions: {
    marginTop: "auto",
    paddingTop: 36,
    gap: 18,
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 15,
    color: MUTED,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: "700",
    color: DARK,
  },
});
