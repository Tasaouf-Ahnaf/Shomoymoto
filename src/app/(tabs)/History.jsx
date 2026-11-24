import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import moment from "moment";
import "moment/locale/bn";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MedicationCardItem from "../../../components/MedicationCardItem.jsx";
import { auth, db } from "../../../config/FirebaseConfig.jsx";
import {
  formatDateForText,
  GetPreviousDateRangeToDisplay,
} from "../../../service/convertDateTime";
import { viewAndSaveHistoryPdf } from "../../../service/historyReport";
import { useLanguage } from "../../../service/i18n";
import { getLocalStorage } from "../../../service/storage";

const toJsDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (Number.isFinite(value?.seconds)) {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function History() {
  const { t, language } = useLanguage();
  const [allMeds, setAllMeds] = useState([]);
  const dateRange = useMemo(
    () => GetPreviousDateRangeToDisplay(7, language),
    [language],
  );
  const [selectedDate, setSelectedDate] = useState(
    () => dateRange[dateRange.length - 1]?.formattedDate || "",
  );
  const [loading, setLoading] = useState(false);

  // Custom PDF report date range (default: last 30 days to today)
  const [reportStartDate, setReportStartDate] = useState(() =>
    moment().subtract(30, "days").toDate(),
  );
  const [reportEndDate, setReportEndDate] = useState(() => new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Safe translation helper so missing keys fall back cleanly
  const tr = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const fetchHistory = useCallback(async () => {
    const userInfo = await getLocalStorage("userDetail");
    const email = auth.currentUser?.email || userInfo?.email;
    if (!email) {
      setAllMeds([]);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, "medication"),
        where("userEmail", "==", email),
      );
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => docs.push(doc.data()));
      setAllMeds(docs);
    } catch (e) {
      console.warn("fetchHistory:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory]),
  );

  // Calculate Weekly Adherence across the past 7 days (handles both EN and BN dates)
  const weeklyStats = useMemo(() => {
    let taken = 0;
    let missed = 0;

    for (let i = 7; i >= 1; i--) {
      const dayMoment = moment().subtract(i, "days").startOf("day");
      const enKey = dayMoment.clone().locale("en").format("D/MMM/YYYY");
      const bnKey = dayMoment.clone().locale("bn").format("D/MMM/YYYY");

      allMeds.forEach((med) => {
        const dates = med?.dates || [];
        let isScheduled = dates.includes(enKey) || dates.includes(bnKey);

        if (!isScheduled) {
          const start = toJsDate(med?.startDate);
          const end = toJsDate(med?.endDate);
          if (start && end) {
            isScheduled = dayMoment.isBetween(
              moment(start).startOf("day"),
              moment(end).endOf("day"),
              "day",
              "[]",
            );
          }
        }

        if (!isScheduled) return;

        const actions = med?.action || [];
        const isTaken = actions.some(
          (item) =>
            item?.status === "Taken" &&
            (item?.date === enKey || item?.date === bnKey),
        );

        if (isTaken) {
          taken += 1;
        } else {
          missed += 1;
        }
      });
    }

    const total = taken + missed;
    const percent = total > 0 ? Math.round((taken / total) * 100) : 0;
    return { taken, missed, percent };
  }, [allMeds]);

  const handleGeneratePdf = async () => {
    if (moment(reportEndDate).isBefore(moment(reportStartDate), "day")) {
      Alert.alert(t("error"), t("invalidDateRange"));
      return;
    }

    setExporting(true);
    try {
      await viewAndSaveHistoryPdf({
        startDate: reportStartDate,
        endDate: reportEndDate,
      });
    } catch (e) {
      console.warn("viewAndSaveHistoryPdf:", e);
      Alert.alert(t("error"), t("pdfError"));
    } finally {
      setExporting(false);
    }
  };

  const previousDays = dateRange.map((item) => item.formattedDate);
  const hasHistory = allMeds.some((med) =>
    (med?.dates || []).some((date) => previousDays.includes(date)),
  );

  const medList = allMeds.filter((med) =>
    (med?.dates || []).includes(selectedDate),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mainContainer}>
        <FlatList
          data={hasHistory ? medList : []}
          keyExtractor={(item, index) => `${item.docId}-${index}`}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Header with Shomoymoto Logo on the left */}
              <View style={styles.headerRow}>
                <Image
                  source={require("./../../../assets/images/icon.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.header}>{t("medicationHistory")}</Text>
              </View>

              {/* 1st Portion: Weekly Adherence Card */}
              <View style={styles.adherenceCard}>
                <Text style={styles.adherenceTitle}>
                  {tr("weeklyAdherence", "Weekly Adherence")}
                </Text>

                <View style={styles.circleRing}>
                  <Text style={styles.circlePercent}>
                    {weeklyStats.percent}%
                  </Text>
                </View>

                <View style={styles.adherenceFooter}>
                  <View style={styles.statItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.statText}>
                      {tr("taken", "Taken")}: {weeklyStats.taken}
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.statText}>
                      {tr("missed", "Missed")}: {weeklyStats.missed}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 2nd Portion: Existing 7-day history strip */}
              <FlatList
                data={dateRange}
                horizontal
                style={{ marginTop: 18, marginBottom: 8 }}
                keyExtractor={(item, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dateGroup,
                      {
                        backgroundColor:
                          item?.formattedDate == selectedDate
                            ? "#008000"
                            : "#d3d3d3",
                      },
                    ]}
                    onPress={() => setSelectedDate(item.formattedDate)}
                  >
                    <Text
                      style={[
                        styles.day,
                        {
                          color:
                            item?.formattedDate == selectedDate
                              ? "white"
                              : "black",
                        },
                      ]}
                    >
                      {item.day}
                    </Text>
                    <Text
                      style={[
                        styles.date,
                        {
                          color:
                            item?.formattedDate == selectedDate
                              ? "white"
                              : "black",
                        },
                      ]}
                    >
                      {item.date}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </>
          }
          renderItem={({ item }) => (
            <MedicationCardItem
              medicine={item}
              selectedDate={selectedDate}
              disabled
              onDeleted={fetchHistory}
            />
          )}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator
                size="large"
                color="#008000"
                style={{ marginTop: 30, marginBottom: 20 }}
              />
            ) : (
              <Text style={styles.emptyText}>
                {hasHistory
                  ? t("noMedicationOnDate")
                  : t("noMedicationHistory")}
              </Text>
            )
          }
          ListFooterComponent={
            /* 3rd Portion: Export History (PDF) Card */
            <View style={styles.pdfCard}>
              <Text style={styles.pdfTitle}>{t("exportPdfReport")}</Text>

              <View style={styles.pdfDateRow}>
                <TouchableOpacity
                  style={styles.pdfDateBtn}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#114B29" />
                  <View style={styles.pdfDateTextWrap}>
                    <Text style={styles.pdfDateLabel}>{t("startDate")}</Text>
                    <Text style={styles.pdfDateValue} numberOfLines={1}>
                      {formatDateForText(reportStartDate)}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pdfDateBtn}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#114B29" />
                  <View style={styles.pdfDateTextWrap}>
                    <Text style={styles.pdfDateLabel}>{t("endDate")}</Text>
                    <Text style={styles.pdfDateValue} numberOfLines={1}>
                      {formatDateForText(reportEndDate)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.pdfGenerateBtn}
                disabled={exporting}
                onPress={handleGeneratePdf}
              >
                {exporting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.pdfGenerateText}>{t("generatePdf")}</Text>
                )}
              </TouchableOpacity>
            </View>
          }
        />

        {showStartPicker && (
          <DateTimePicker
            value={reportStartDate}
            mode="date"
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (event.type === "set" && date) {
                setReportStartDate(date);
              }
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={reportEndDate}
            mode="date"
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (event.type === "set" && date) {
                setReportEndDate(date);
              }
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  mainContainer: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 14,
    backgroundColor: "white",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F4D0F",
    flexShrink: 1,
  },
  adherenceCard: {
    backgroundColor: "#114B29",
    width: "100%",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  adherenceTitle: {
    color: "#E8F5E9",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  circleRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 6,
    borderColor: "#E8F5E9",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  circlePercent: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "bold",
  },
  adherenceFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dateGroup: {
    padding: 15,
    backgroundColor: "#d3d3d3",
    display: "flex",
    alignItems: "center",
    marginRight: 10,
    borderRadius: 10,
  },
  day: {
    padding: 5,
    fontSize: 18,
  },
  date: {
    fontSize: 18,
    fontWeight: "bold",
  },
  pdfCard: {
    marginTop: 24,
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#DDF3E8",
  },
  pdfTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F4D0F",
    marginBottom: 12,
  },
  pdfDateRow: {
    flexDirection: "row",
    gap: 10,
  },
  pdfDateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECF8F2",
    borderWidth: 1.2,
    borderColor: "#114B29",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  pdfDateTextWrap: {
    flex: 1,
  },
  pdfDateLabel: {
    fontSize: 11,
    color: "#2F5E45",
    marginBottom: 1,
  },
  pdfDateValue: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F4D0F",
  },
  pdfGenerateBtn: {
    marginTop: 14,
    backgroundColor: "#114B29",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  pdfGenerateText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F4D0F",
    textAlign: "center",
    marginTop: 32,
    marginBottom: 16,
  },
});
