import React from "react";
import { ref, set } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CallButton({ calleeId }) {
  const { user, loading } = useAuth(); // ✅ Corrected
  const navigate = useNavigate();

  if (loading || !user) return null;

  const callerId = user.uid;

  const initiateCall = async () => {
    if (!callerId || !calleeId) {
      console.error("Caller or callee ID missing. CallerId:", callerId, "CalleeId:", calleeId);
      return;
    }

    const callId = `${callerId}_${calleeId}`;
    const callRef = ref(database, `calls/${callId}`);

    try {
      await set(callRef, {
        callerId,
        calleeId,
        status: "ringing",
        timestamp: Date.now(),
      });

      navigate(`/call/${callId}`);
    } catch (error) {
      console.error("Error initiating call:", error);
    }
  };

  return <button onClick={initiateCall}>📞 Call</button>;
}
