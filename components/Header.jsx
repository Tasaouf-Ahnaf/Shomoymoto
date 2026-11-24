import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../service/i18n";
import { getLocalStorage } from "../service/storage";

export default function Header() {
  const [user, SetUser] = useState("");
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const GetUserDetail = async () => {
      const userinfo = await getLocalStorage("userDetail");
      SetUser(userinfo);
    };
    GetUserDetail();
  }, []);

  return (
    <View style={styles.headerRow}>
      <View style={styles.leftGroup}>
        <Image
          source={require("../assets/images/android-icon-foreground.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.headerText} numberOfLines={1}>
          {t("hello", { name: user?.displayName ?? "" })}
        </Text>
      </View>

      <TouchableOpacity onPress={() => router.push("/add-new-medication")}>
        <Ionicons name="medkit" size={28} color="green" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: -8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F4D0F",
    flexShrink: 1,
  },
});
