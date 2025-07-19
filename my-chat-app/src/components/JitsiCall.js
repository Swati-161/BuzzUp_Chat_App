import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { database } from "../firebase";
import { onValue, ref, set } from "firebase/database";

export default function JitsiCall() {
  const { callId } = useParams();
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      console.error("JitsiMeetExternalAPI not loaded");
      return;
    }

    const domain = "meet.jit.si";
    const options = {
      roomName: `chatapp_${callId}`,
      width: "100%",
      height: "100%",
      parentNode: jitsiContainerRef.current,
      configOverwrite: { startWithVideoMuted: false },
      interfaceConfigOverwrite: {},
    };

    apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

    // Mark status as active
    set(ref(database, `calls/${callId}/status`), "active");

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
      set(ref(database, `calls/${callId}/status`), "ended");
    };
  }, [callId]);

  return (
    <div
      ref={jitsiContainerRef}
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    />
  );
}
