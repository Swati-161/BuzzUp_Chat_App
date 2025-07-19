import { useEffect } from "react";
import { onValue, ref, remove, set } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CallRequestListener() {
  const { user, loading } = useAuth(); // ✅ Corrected
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;

    const callsRef = ref(database, "calls");

    const unsub = onValue(callsRef, (snapshot) => {
      const calls = snapshot.val();
      if (!calls) return;

      // ✅ Only handle the first matching incoming call
      const incomingCall = Object.entries(calls).find(
        ([_, callData]) =>
          callData.calleeId === user.uid && callData.status === "ringing"
      );

      if (incomingCall) {
        const [callId] = incomingCall;
        const accept = window.confirm("Incoming call. Accept?");
        if (accept) {
          set(ref(database, `calls/${callId}/status`), "accepted");
          navigate(`/call/${callId}`);
        } else {
          remove(ref(database, `calls/${callId}`));
        }
      }
    });

    return () => unsub();
  }, [user, loading, navigate]);

  return null;
}
