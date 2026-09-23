import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Image, TouchableOpacity, View } from "react-native";

export default function AddMedicationHeader() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View>
      <Image
        source={require("../assets/images/consult.png")}
        style={{
          height: 280,
          width: "100%",
        }}
      />
      <TouchableOpacity
        style={{
          position: "absolute",
          padding: 27,
        }}
        onPress={handleBack}
      >
        <Ionicons name="arrow-back-outline" size={26} color="black" />
      </TouchableOpacity>
    </View>
  );
}
