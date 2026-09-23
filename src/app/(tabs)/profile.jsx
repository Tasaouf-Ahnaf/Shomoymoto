import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../../config/FirebaseConfig";
import {
  deleteUserAccount,
  hasRecentLogin,
} from "../../../service/accountDeletion";
import { LANGUAGES, useLanguage } from "../../../service/i18n";
import { sendTestPushNotification } from "../../../service/pushnotification";
import { getLocalStorage, removeLocalStorage } from "../../../service/storage";

const GREEN = "#2E8B57";
const RED = "#D32F2F";

function MenuItem({ icon, label, value, onPress }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={22} color={GREEN} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={20} color={GREEN} />
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const GetUserDetail = async () => {
      const userinfo = await getLocalStorage("userDetail");
      setUser(userinfo);
    };
    GetUserDetail();
  }, []);

  const handleLogout = () => {
    Alert.alert(t("logout"), t("logoutConfirmMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            await removeLocalStorage("userDetail");
            router.replace("/login");
          } catch (e) {
            e;
          }
        },
      },
    ]);
  };

  const isWrongPassword = (e) =>
    e?.code === "auth/wrong-password" ||
    e?.code === "auth/invalid-credential" ||
    e?.code === "auth/invalid-login-credentials";

  const finishDeletion = async () => {
    await removeLocalStorage("userDetail");
    router.replace("/login");
  };

  const runDelete = async (password) => {
    setBusy(true);
    try {
      await deleteUserAccount(user, password);
      await finishDeletion();
    } catch (e) {
      e;
      if (e?.code === "auth/requires-recent-login" || isWrongPassword(e)) {
        setShowDeleteModal(true);
      } else {
        Alert.alert(t("error"), t("couldNotDeleteAccount"));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      await deleteUserAccount(user, deletePassword);
      setShowDeleteModal(false);
      setDeletePassword("");
      await finishDeletion();
    } catch (e) {
      e;
      if (isWrongPassword(e) || e?.code === "auth/requires-recent-login") {
        Alert.alert(t("error"), t("incorrectPassword"));
      } else {
        setShowDeleteModal(false);
        setDeletePassword("");
        Alert.alert(t("error"), t("couldNotDeleteAccount"));
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(t("deleteAccount"), t("deleteAccountConfirmMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          if (hasRecentLogin()) {
            runDelete();
          } else {
            setShowDeleteModal(true);
          }
        },
      },
    ]);
  };

  const handleLanguage = () => {
    Alert.alert(t("language"), undefined, [
      ...LANGUAGES.map((lang) => ({
        text: lang.label,
        onPress: () => setLanguage(lang.code),
      })),
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  const handleTestNotification = async () => {
    const result = await sendTestPushNotification();
    if (result?.ok) {
      Alert.alert(t("testNotification"), t("testNotificationSent"));
    } else {
      Alert.alert(t("error"), t("testNotificationPermission"));
    }
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>{t("profile")}</Text>

        <View style={styles.profileSection}>
          <Image
            source={require("../../../assets/images/splash-icon.png")}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.menu}>
          <MenuItem
            icon="add-circle-outline"
            label={t("addNewMedication")}
            onPress={() => router.push("/add-new-medication")}
          />
          <MenuItem
            icon="medkit-outline"
            label={t("myMedication")}
            onPress={() => router.push("/")}
          />
          <MenuItem
            icon="time-outline"
            label={t("history")}
            onPress={() => router.push("/History")}
          />
          <MenuItem
            icon="language-outline"
            label={t("language")}
            value={LANGUAGES.find((lang) => lang.code === language)?.label}
            onPress={handleLanguage}
          />
          <MenuItem
            icon="notifications-outline"
            label={t("testNotification")}
            onPress={handleTestNotification}
          />
        </View>

        <TouchableOpacity
          style={styles.logout}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={RED} />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccount}
          activeOpacity={0.8}
          disabled={busy}
          onPress={handleDeleteAccount}
        >
          {busy ? (
            <ActivityIndicator color={RED} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color={RED} />
              <Text style={styles.deleteAccountText}>{t("deleteAccount")}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) {
            setShowDeleteModal(false);
            setDeletePassword("");
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("confirmDeleteTitle")}</Text>
            <Text style={styles.modalMessage}>{t("confirmDeleteMsg")}</Text>
            <TextInput
              style={styles.modalInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder={t("password")}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoFocus
              editable={!deleting}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                disabled={deleting}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                }}
              >
                <Text style={styles.modalCancelText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  !deletePassword && styles.modalConfirmDisabled,
                ]}
                disabled={deleting || !deletePassword}
                onPress={handleConfirmDelete}
              >
                {deleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>{t("delete")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    padding: 25,
    paddingBottom: 120,
  },
  header: {
    fontSize: 25,
    fontWeight: "bold",
    color: GREEN,
    marginTop: 20,
  },
  profileSection: {
    alignItems: "center",
    marginTop: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: GREEN,
    marginTop: 16,
  },
  email: {
    fontSize: 15,
    color: "#6B7A76",
    marginTop: 6,
  },
  menu: {
    marginTop: 40,
    gap: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F8F4",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#DCEFE4",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E0F1E7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#0F4D0F",
  },
  menuValue: {
    fontSize: 15,
    fontWeight: "600",
    color: GREEN,
    marginRight: 6,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 40,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3D2D2",
    backgroundColor: "#FDF1F1",
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "700",
    color: RED,
  },
  deleteAccount: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  deleteAccountText: {
    fontSize: 15,
    fontWeight: "600",
    color: RED,
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0F4D0F",
  },
  modalMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7A76",
  },
  modalInput: {
    marginTop: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#D9E2DF",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#0f2f2b",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7A76",
  },
  modalConfirm: {
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: RED,
  },
  modalConfirmDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
