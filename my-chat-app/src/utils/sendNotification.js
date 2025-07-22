import { ref, push } from "firebase/database";
import { database } from "../firebase"; // make sure this is correct path

export const sendNotification = async (receiverId, notificationData) => {
  if (!receiverId || !notificationData) {
    console.error("Missing receiverId or notificationData");
    return;
  }

  try {
    const notificationsRef = ref(database, `notifications/${receiverId}`);
    await push(notificationsRef, {
      ...notificationData,
      timestamp: Date.now(),
      read: false,
    });
  } catch (err) {
    console.error("Error sending notification:", err);
  }
};
