import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
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
    <View
      style={{
        marginTop: 20,
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Image
            source={require("../assets/images/android-icon-foreground.png")}
            style={{
              width: 60,
              height: 60,
              marginRight: -10,
            }}
          />

          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              flexShrink: 1,
            }}
          >
            {t("hello", { name: user?.displayName ?? "" })}{" "}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/add-new-medication")}>
          <Ionicons name="medkit" size={28} color="green" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
