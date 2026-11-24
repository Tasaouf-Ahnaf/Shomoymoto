import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header.jsx";
import MedicationList from "../../../components/MedicationList.jsx";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mainContainer}>
        <Header />
        <MedicationList />
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
});
