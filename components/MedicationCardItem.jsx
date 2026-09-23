import Octicons from "@expo/vector-icons/Octicons";
import { useRouter } from "expo-router";
import moment from "moment";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatTime } from "../service/convertDateTime";
import { useLanguage } from "../service/i18n";
import { deleteMedication } from "../service/medicationActions";
import { cancelMedicationNotifications } from "../service/pushnotification";

export default function MedicationCardItem({
  medicine,
  selectedDate,
  disabled,
  onDeleted,
}) {
  const router = useRouter();
  const { t, tv } = useLanguage();

  const recordedTaken = (medicine?.action || []).some(
    (item) => item?.status === "Taken" && item?.date === selectedDate,
  );
  const recordedMissed = (medicine?.action || []).some(
    (item) => item?.status === "Missed" && item?.date === selectedDate,
  );

  const reminderValue = medicine?.reminder?.toDate?.() ?? medicine?.reminder;

  const isDayOver = (() => {
    const day = moment(selectedDate, "D/MMM/YYYY");
    if (!day.isValid()) return false;
    return day.endOf("day").isBefore(moment());
  })();

  const isTaken = recordedTaken;
  const isMissed = recordedMissed || (!recordedTaken && !recordedMissed && isDayOver);

  const handlePress = () => {
    const reminder = medicine?.reminder;
    const reminderISO = reminder?.toDate?.().toISOString?.() ?? reminder;
    const payload = { ...medicine, reminder: reminderISO };

    router.push({
      pathname: "/action-modal",
      params: {
        medicine: JSON.stringify(payload),
        selectedDate: selectedDate,
      },
    });
  };

  const handleEdit = () => {
    const reminder = medicine?.reminder;
    const reminderISO = reminder?.toDate?.().toISOString?.() ?? reminder;
    const payload = { ...medicine, reminder: reminderISO };

    router.push({
      pathname: "/add-new-medication",
      params: {
        mode: "edit",
        medicine: JSON.stringify(payload),
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(t("confirmDeleteTitle"), t("deleteMedicationConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await cancelMedicationNotifications(medicine?.docId);
            await deleteMedication(medicine?.docId);
            onDeleted?.();
          } catch (e) {
            console.warn("deleteMedication:", e);
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={[
        styles.Container,
        isTaken && styles.takenContainer,
        isMissed && styles.missedContainer,
      ]}
      activeOpacity={0.7}
      disabled={disabled}
      onPress={disabled ? undefined : handlePress}
    >
      <View style={styles.subContainer}>
        <View
          style={[
            styles.imageContainer,
            isTaken && styles.takenContainer,
            isMissed && styles.missedContainer,
          ]}
        >
          <Image
            source={{ uri: medicine?.type?.icon }}
            style={{ width: 40, height: 40 }}
          />
        </View>
        <View>
          <View style={styles.nameRow}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              {medicine?.name}
            </Text>
            <TouchableOpacity
              onPress={handleEdit}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Octicons name="pencil" size={16} color="#555555" />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 14 }}>{tv("when", medicine?.when)}</Text>
          <Text style={{ color: "black", fontWeight: "bold" }}>
            {medicine?.dose} {tv("type", medicine?.type?.name)}
          </Text>
        </View>
      </View>
      <View>
        <Octicons name="clock" size={24} color="black" />
        <Text style={{ marginRight: 10 }}>
          {reminderValue ? formatTime(reminderValue) : ""}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleDelete}
        hitSlop={8}
        style={styles.deleteButton}
      >
        <Octicons name="trash" size={22} color="#555555" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  Container: {
    padding: 10,
    backgroundColor: "#E0E0E0",
    marginTop: 10,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  takenContainer: {
    backgroundColor: "#C8E6C9",
  },
  missedContainer: {
    backgroundColor: "#FFCDD2",
  },
  imageContainer: {
    padding: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 15,
    marginRight: 15,
  },
  subContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 8,
    padding: 2,
  },
  deleteButton: {
    position: "absolute",
    top: 2,
    right: 2,
    padding: 4,
  },
});
