// src/utils/sendNotification.js
import { ref, push } from "firebase/database";
import { database } from "../firebase"; // make sure this is correct path

export const sendNotification = async (receiverId, notificationData) => {
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
