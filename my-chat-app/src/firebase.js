import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAEvq9G--IpmfY8DSnAbnpl84kKX5dQk1M",
  authDomain: "buzzup-724ca.firebaseapp.com",
  databaseURL: "https://buzzup-724ca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "buzzup-724ca",
  storageBucket: "buzzup-724ca.firebasestorage.app",
  messagingSenderId: "674406150055",
  appId: "1:674406150055:web:051b1f302eddf70b315082"
};
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export default app;