import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import moment from "moment";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/FirebaseConfig.jsx";
import { TypeList, WhenToTake } from "../constant/Options";
import {
  formatDateForText,
  formatTime,
  getDatesRange,
} from "../service/convertDateTime";
import { useLanguage } from "../service/i18n";
import { scheduleMedicationNotifications } from "../service/pushnotification";
import { getLocalStorage } from "../service/storage";

export default function AddMedicationForm() {
  const { t, tv } = useLanguage();
  const params = useLocalSearchParams();
  const isEdit = params?.mode === "edit";
  const [formData, setFormData] = useState(() => {
    if (!isEdit || !params?.medicine) return {};
    let med = {};
    try {
      med = JSON.parse(params.medicine);
    } catch (e) {
      ("parseMedication:", e);
    }

    const toDate = (value) => {
      if (!value) return null;
      if (typeof value.toDate === "function") return value.toDate();
      if (value instanceof Date) return value;
      if (
        value &&
        Number.isFinite(value.seconds) &&
        Number.isFinite(value.nanoseconds)
      ) {
        return new Date(value.seconds * 1000);
      }
      if (typeof value === "string") {
        const parsed = moment(value, "D/MMM/YYYY").toDate();
        return Number.isNaN(parsed.getTime()) ? new Date(value) : parsed;
      }
      return new Date(value);
    };

    const startDate =
      toDate(med.startDate) ??
      (med.dates?.length ? toDate(med.dates[0]) : null);
    const endDate =
      toDate(med.endDate) ??
      (med.dates?.length ? toDate(med.dates[med.dates.length - 1]) : null);

    return {
      name: med.name,
      type: med.type,
      dose: med.dose,
      when: med.when,
      startDate,
      endDate,
      reminder: toDate(med.reminder),
      docId: med.docId,
    };
  });
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onHandleInputChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
  };

  const SaveMedication = async () => {
    if (
      !formData?.name ||
      !formData?.type ||
      !formData?.dose ||
      !formData?.when ||
      formData?.when === "When To Take" ||
      !formData?.startDate ||
      !formData?.endDate ||
      !formData?.reminder
    ) {
      Alert.alert(t("enterAllFields"), t("fillAllFields"));

      return;
    }
    const dates = getDatesRange(formData?.startDate, formData?.endDate);
    dates;
    setLoading(true);
    try {
      const user = await getLocalStorage("userDetail");
      const docId = isEdit && formData?.docId ? formData.docId : Date.now().toString();
      const savedMedicine = {
        ...formData,
        docId: docId,
        userEmail: user?.email,
        dates: dates,
      };

      if (isEdit && formData?.docId) {
        await updateDoc(doc(db, "medication", formData.docId), savedMedicine);
      } else {
        await setDoc(doc(db, "medication", docId), savedMedicine);
      }

      scheduleMedicationNotifications(savedMedicine);
      setLoading(false);
      Alert.alert(
        t("successful"),
        isEdit ? t("medicationUpdated") : t("newMedicationAdded"),
        [
          {
            text: t("ok"),
            onPress: () =>
              router.canGoBack() ? router.back() : router.push("(tabs)"),
          },
        ],
      );
    } catch (e) {
      setLoading(false);
      e;
    }
  };

  return (
    <View
      style={{
        padding: 25,
      }}
    >
      <Text style={styles.header}>
        {isEdit ? t("editMedicationHeader") : t("addNewMedicationHeader")}
      </Text>

      <View style={styles.nameInputContainer}>
        <TouchableOpacity style={styles.addIconButton}>
          <Text style={styles.addIconText}>+</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.nameInput}
          placeholder={t("medicineName")}
          placeholderTextColor="#999"
          onChangeText={(value) => onHandleInputChange("name", value)}
        />
      </View>

      {/* Type List */}
      <FlatList
        data={TypeList}
        horizontal
        style={{
          marginTop: 10,
        }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => {
          return (
            <TouchableOpacity
              style={[
                styles.inputGroup,
                { marginRight: 5 },
                {
                  backgroundColor:
                    item.name == formData?.type?.name ? "#0b675c" : "white",
                },
              ]}
              onPress={() => onHandleInputChange("type", item)}
            >
              <Text
                style={[
                  { fontSize: 14 },
                  {
                    color:
                      item.name == formData?.type?.name ? "white" : "black",
                  },
                ]}
              >
                {tv("type", item?.name)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Dose input */}

      <View style={[styles.nameInputContainer, { marginTop: 10 }]}>
        <TouchableOpacity style={styles.addIconButton}>
          <Text style={styles.addIconPic}>💊</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.nameInput}
          placeholder={t("dosePlaceholder")}
          placeholderTextColor="#999"
          onChangeText={(value) => onHandleInputChange("dose", value)}
        />
      </View>

      {/* When to take */}

      <View style={[styles.nameInputContainer, { marginTop: 10 }]}>
        <View style={styles.addIconButton}>
          <Text style={styles.addIconPic}>🕔</Text>
        </View>
        <View style={styles.whenPickerWrap}>
          <Text
            pointerEvents="none"
            style={[
              styles.whenText,
              (!formData?.when || formData?.when === "When To Take") &&
                styles.whenPlaceholder,
            ]}
          >
            {formData?.when && formData?.when !== "When To Take"
              ? tv("when", formData?.when)
              : tv("when", "When To Take")}
          </Text>
          <Picker
            style={styles.whenPicker}
            selectedValue={formData?.when}
            onValueChange={(itemValue, itemIndex) =>
              onHandleInputChange("when", itemValue)
            }
          >
            {WhenToTake.map((item, index) => (
              <Picker.Item key={index} label={tv("when", item)} value={item} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Start and End Date */}

      <View style={styles.dateInputGroup}>
        <TouchableOpacity
          style={[styles.nameInputContainer2, { marginTop: 10 }, { flex: 1 }]}
          onPress={() => setShowStartDate(true)}
        >
          <View style={styles.addDateButton}>
            <Text style={styles.addIconPic}>🗓</Text>
          </View>
          <Text style={styles.text}>
            {formData?.startDate
              ? formatDateForText(formData?.startDate)
              : t("startDate")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nameInputContainer2, { marginTop: 10 }, { flex: 1 }]}
          onPress={() => setShowEndDate(true)}
        >
          <View style={styles.addDateButton}>
            <Text style={styles.addIconPic}>🗓</Text>
          </View>
          <Text style={styles.text}>
            {formData?.endDate
              ? formatDateForText(formData?.endDate)
              : t("endDate")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Start Date Picker */}
      {showStartDate && (
        <DateTimePicker
          value={
            formData?.startDate ? new Date(formData?.startDate) : new Date()
          }
          mode="date"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowStartDate(false);
            if (event.type === "set" && date) {
              onHandleInputChange("startDate", date);
            }
          }}
        />
      )}

      {/* End Date Picker */}
      {showEndDate && (
        <DateTimePicker
          value={formData?.endDate ? new Date(formData?.endDate) : new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowEndDate(false);
            if (event.type === "set" && date) {
              onHandleInputChange("endDate", date);
            }
          }}
        />
      )}

      {/* Set Reminder Input */}
      <View style={styles.dateInputGroup}>
        <TouchableOpacity
          style={[styles.nameInputContainer2, { marginTop: 10 }, { flex: 1 }]}
          onPress={() => setShowTimePicker(true)}
        >
          <View style={styles.addDateButton}>
            <Text style={styles.addIconPic}>🔔</Text>
          </View>
          <Text style={styles.text}>
            {formData?.reminder
              ? formatTime(formData?.reminder)
              : t("selectReminderTime")}
          </Text>
        </TouchableOpacity>
      </View>
      {showTimePicker && (
        <DateTimePicker
          mode="time"
          value={formData?.reminder ? new Date(formData?.reminder) : new Date()}
          onChange={(event, time) => {
            setShowTimePicker(false);
            if (event.type === "set" && time) {
              onHandleInputChange("reminder", time);
            }
          }}
        />
      )}

      {/* Add new Medication button */}

      <TouchableOpacity style={styles.button} onPress={SaveMedication}>
        {loading ? (
          <ActivityIndicator size={"large"} color={"green"} />
        ) : (
          <Text style={styles.buttonText}>{t("addNewMedication")}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 25,
    color: "#0F4D0F",
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 7,
  },

  nameInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF",
  },
  nameInputContainer2: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "#FFF",
  },
  whenPickerWrap: {
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  whenPicker: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    opacity: 0,
  },
  whenText: {
    fontSize: 16,
    color: "#333",
  },
  whenPlaceholder: {
    color: "#999",
  },
  addIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E6F4EA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  addDateButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E6F4EA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginLeft: 5,
  },
  addIconText: {
    color: "#2E7D32",
    fontSize: 20,
    fontWeight: "bold",
  },
  addIconPic: {
    color: "#2E7D32",
    fontSize: 16,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  text: {
    fontSize: 16,
    padding: 10,
    flex: 1,
    marginLeft: 10,
  },
  dateInputGroup: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#109b10", //"#0F4D0F",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderBottomWidth: 3,
    borderBottomColor: "#109b10",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
