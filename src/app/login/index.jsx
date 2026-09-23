import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../../service/i18n";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image
          source={require("../../../assets/images/android-icon-foreground.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.welcome}>{t("welcomeTo")}</Text>
      </View>

      <View style={styles.container2}>
        <Text style={styles.stay}>{t("stayOnTrack")}</Text>
        <Text style={styles.msz}>{t("trackYourMedicine")}</Text>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => router.push("/login/signIn")}
        >
          <Text style={styles.buttonText}>{t("continue")}</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>{t("termsAgree")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    alignItems: "center",
    marginTop: 10,
  },
  container2: {
    flex: 1,
    alignItems: "center",
    marginTop: -20,
    marginBottom: -70,
    backgroundColor: "#0f2f2b",
  },
  logo: {
    width: 200,
    height: 400,
  },
  welcome: {
    marginTop: -140,
    fontSize: 24,
    fontWeight: "600",
    color: "#0f2f2b",
    textAlign: "center",
    includeFontPadding: false,
  },
  stay: {
    marginTop: 10,
    color: "#FFF",
    textAlign: "center",
    fontSize: 28,
    lineHeight: 38,
    fontWeight: "bold",
  },
  msz: {
    marginTop: 10,
    color: "#FFF",
    textAlign: "center",
    fontSize: 18,
  },
  button: {
    marginTop: 28,
    width: "80%",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  buttonText: {
    color: "#0f2f2b",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  terms: {
    marginTop: 14,
    paddingHorizontal: 32,
    color: "#A8C4BC",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
});
