import { collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MedicationCardItem from "../../../components/MedicationCardItem.jsx";
import { db } from "../../../config/FirebaseConfig.jsx";
import { GetPreviousDateRangeToDisplay } from "../../../service/convertDateTime";
import { useLanguage } from "../../../service/i18n";
import { getLocalStorage } from "../../../service/storage";

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

  const fetchHistory = useCallback(async () => {
    const user = await getLocalStorage("userDetail");
    if (!user?.email) {
      setAllMeds([]);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, "medication"),
        where("userEmail", "==", user?.email),
      );
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => docs.push(doc.data()));
      setAllMeds(docs);
    } catch (e) {
      e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
  }, [fetchHistory]);

  const previousDays = dateRange.map((item) => item.formattedDate);
  const hasHistory = allMeds.some((med) =>
    (med?.dates || []).some((date) => previousDays.includes(date)),
  );

  const medList = allMeds.filter((med) =>
    (med?.dates || []).includes(selectedDate),
  );

  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={hasHistory ? medList : []}
        keyExtractor={(item, index) => `${item.docId}-${index}`}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Image
              source={require("./../../../assets/images/med-history.png")}
              style={styles.imageBanner}
            />
            <Text style={styles.header}>{t("medicationHistory")}</Text>

            <FlatList
              data={dateRange}
              horizontal
              style={{ marginTop: 8 }}
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
              style={{ marginTop: 40 }}
            />
          ) : (
            <Text style={styles.emptyText}>
              {hasHistory ? t("noMedicationOnDate") : t("noMedicationHistory")}
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    padding: 25,
    backgroundColor: "white",
    height: "100%",
  },
  imageBanner: {
    width: "100%",
    height: 240,
    borderRadius: 12,
  },
  header: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#0F4D0F",
    marginTop: 20,
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
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F4D0F",
    textAlign: "center",
    marginTop: 60,
  },
});
