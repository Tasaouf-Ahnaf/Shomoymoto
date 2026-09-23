// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_uefVi_9wburemyKuarfRQkg1ozFQRNw",
  authDomain: "cse2100.firebaseapp.com",
  projectId: "cse2100",
  storageBucket: "cse2100.firebasestorage.app",
  messagingSenderId: "456249339933",
  appId: "1:456249339933:web:e69db67abc5551535a16f4",
  measurementId: "G-JKVD4KK6XS",
};

setLogLevel("error");

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const createAuth = () => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
};

export const auth = createAuth();

export const db = getFirestore(app);
