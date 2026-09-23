import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../service/i18n";

export default function EmptyState() {
  const router = useRouter();
  const { t } = useLanguage();
  return (
    <View
      style={{
        marginTop: 80,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Image
        source={require("../assets/images/medicine copy.png")}
        style={{
          width: 180,
          height: 180,
        }}
      />
      <Text style={styles.NoMedication}>{t("noMedications")}</Text>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "bold",
          color: "black",
        }}
      >
        {t("noMedicationsSetUp")}{" "}
      </Text>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "bold",
          color: "black",
        }}
      >
        {" "}
        {t("kindlySetUp")}
      </Text>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={() => router.push("/add-new-medication")}
      >
        <Text style={styles.buttonText}>+ {t("addNewMedication")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  NoMedication: {
    fontSize: 30,
    fontStyle: "italic",
    fontWeight: "bold",
    marginTop: 30,
    color: "#0F4D0F",
  },

  button: {
    width: "80%",
    paddingVertical: 16,
    backgroundColor: "#0F4D0F",
    marginTop: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderBottomWidth: 3,
    borderBottomColor: "#063d2e",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
