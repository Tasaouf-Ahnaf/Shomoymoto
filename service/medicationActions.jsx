import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import moment from "moment";
import { db } from "../config/FirebaseConfig";

export const deleteMedication = async (docId) => {
  if (!docId) {
    throw new Error("Missing medication id");
  }

  await deleteDoc(doc(db, "medication", docId));
};

export const updateMedicationAction = async (docId, selectedDate, status) => {
  if (!docId || !selectedDate || !status) {
    throw new Error("Missing medication action details");
  }

  const docRef = doc(db, "medication", docId);
  const snapshot = await getDoc(docRef);
  const currentActions = snapshot.exists()
    ? snapshot.data()?.action ?? []
    : [];

  const remaining = currentActions.filter(
    (item) => item?.date !== selectedDate,
  );

  await updateDoc(docRef, {
    action: [
      ...remaining,
      {
        status: status,
        time: moment().format("LT"),
        date: selectedDate,
      },
    ],
  });
};
