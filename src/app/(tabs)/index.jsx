import { View } from "react-native";
import Header from "../../../components/Header.jsx";
import MedicationList from "../../../components/MedicationList.jsx";

export default function HomeScreen() {
  return (
    <View
      style={{
        padding: 25,
        backgroundColor: "white",
        height: "100%",
        width: "100%",
      }}
    >
      <Header />
      <MedicationList />
    </View>
  );
}
