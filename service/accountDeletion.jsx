import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
} from "firebase/auth";
import { collection, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../config/FirebaseConfig";

const RECENT_LOGIN_WINDOW_MS = 5 * 60 * 1000;

export const hasRecentLogin = () => {
  const currentUser = auth.currentUser;
  if (!currentUser?.metadata?.lastSignInTime) return false;

  const lastSignIn = new Date(currentUser.metadata.lastSignInTime).getTime();
  return Date.now() - lastSignIn < RECENT_LOGIN_WINDOW_MS;
};

export const deleteUserAccount = async (user, password) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No signed in user");
  }

  const email = user?.email ?? currentUser.email;
  if (!email) {
    throw new Error("No email for signed in user");
  }

  if (password) {
    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(currentUser, credential);
  }

  const meds = await getDocs(
    query(collection(db, "medication"), where("userEmail", "==", email)),
  );
  await Promise.all(meds.docs.map((med) => deleteDoc(med.ref)));

  await deleteUser(currentUser);
};
