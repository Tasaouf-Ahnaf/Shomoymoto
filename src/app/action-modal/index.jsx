import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MedicationCardItem from "../../../components/MedicationCardItem.jsx";
import { formatTime } from "../../../service/convertDateTime";
import { useLanguage } from "../../../service/i18n";
import { updateMedicationAction } from "../../../service/medicationActions";

export default function MedicationActionModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();

  let medicine = {};
  try {
    medicine = params.medicine ? JSON.parse(params.medicine) : {};
  } catch (e) {
    e;
  }

  const updateActionStatus = async (status) => {
    try {
      await updateMedicationAction(
        medicine?.docId,
        params?.selectedDate,
        status,
      );
      Alert.alert(
        status === "Taken" ? t("taken") : t("missed"),
        t("responseSaved"),
        [
          {
            text: t("ok"),
            onPress: () => router.back(),
          },
        ],
      );
    } catch (e) {
      e;
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/images/notification.gif")}
        style={{
          height: 180,
          width: 180,
        }}
      />
      <Text style={styles.text}>{medicine?.name}</Text>
      <Text style={styles.text}>{params.selectedDate}</Text>
      <Text style={styles.reminderTime}>
        {medicine?.reminder ? formatTime(medicine?.reminder) : t("setReminder")}
      </Text>
      <Text style={styles.text}>{t("itsTimeToTake")}</Text>

      <View style={styles.cardContainer}>
        <MedicationCardItem medicine={medicine} disabled />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.missedButton]}
          onPress={() => updateActionStatus("Missed")}
        >
          <Text style={styles.buttonText}>{t("missed")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.takenButton]}
          onPress={() => updateActionStatus("Taken")}
        >
          <Text style={styles.buttonText}>{t("taken")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    height: "100%",
  },
  takeTime: {
    fontSize: 20,
    fontWeight: "bold",
    color: "green",
    marginTop: 5,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  reminderTime: {
    fontSize: 30,
    fontWeight: "bold",
    color: "green",
  },
  cardContainer: {
    width: "100%",
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 25,
    width: "100%",
    justifyContent: "center",
  },
  button: {
    flex: 1,
    maxWidth: 150,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  missedButton: {
    backgroundColor: "#D32F2F",
  },
  takenButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
