import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, database } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading]           = useState(true);

  // Use a ref for the cache so resolveUsername never changes reference
  const usernameCacheRef = useRef({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Stable function — cache in ref means this never triggers re-renders
  const resolveUsername = useCallback(async (uid) => {
    if (!uid) return "Unknown";
    if (usernameCacheRef.current[uid]) return usernameCacheRef.current[uid];

    try {
      const snap = await get(ref(database, `users/${uid}`));
      const data = snap.val();
      const name = data?.username || data?.displayName || uid.slice(0, 8) + "...";
      usernameCacheRef.current[uid] = name;
      return name;
    } catch {
      return uid.slice(0, 8) + "...";
    }
  }, []); // stable forever — no deps needed

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ firebaseUser, logout, resolveUsername }}>
      {loading ? (
        <div className="loading-screen">connecting</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);