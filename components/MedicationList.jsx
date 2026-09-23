import { useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import moment from "moment";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../config/FirebaseConfig.jsx";
import { GetDateRangeToDisplay } from "../service/convertDateTime";
import { useLanguage } from "../service/i18n";
import { getLocalStorage } from "../service/storage";
import EmptyState from "./EmptyState.jsx";
import MedicationCardItem from "./MedicationCardItem.jsx";

export default function MedicationList() {
  const { language } = useLanguage();
  const [medList, setMedList] = useState([]);
  const dateRange = useMemo(() => GetDateRangeToDisplay(language), [language]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    moment().format("D/MMM/YYYY"),
  );

  const GetMedicationList = async (selectedDate) => {
    const user = await getLocalStorage("userDetail");
    if (!user?.email) {
      setMedList([]);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, "medication"),
        where("userEmail", "==", user?.email),
        where("dates", "array-contains", selectedDate),
      );

      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => {
        ("docID:" + doc.id + "==>", doc.data());
        docs.push(doc.data());
      });
      setMedList(docs);
    } catch (e) {
      e;
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      GetMedicationList(selectedDate);
    }, [selectedDate]),
  );

  return (
    <View
      style={{
        marginTop: 25,
      }}
    >
      <FlatList
        data={medList}
        keyExtractor={(item, index) => `${item.docId}-${index}`}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            <Image
              source={require("../assets/images/medication.png")}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 15,
              }}
            />

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
            onDeleted={() => GetMedicationList(selectedDate)}
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
            <EmptyState />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
