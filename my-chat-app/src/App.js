import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import ChatsScreen from "./screens/ChatsScreen";
import RoomsScreen from "./screens/RoomsScreen";
import ForYouScreen from "./screens/ForYouScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ConversationScreen from "./screens/ConversationScreen";
import RoomCallScreen from "./screens/RoomCallScreen";
import { BottomNav, Toast } from "./components/ui";
import { NotificationsSheet, MenuDrawer } from "./components/Overlays";
import DesktopIntro from "./components/DesktopIntro";
import "./styles/app.css";

function MainApp() {
  const { tab, stack } = useApp();
  const [sheet, setSheet] = useState(null);
  const top = stack[stack.length - 1];

  const tabs = {
    home: <HomeScreen onOpenMenu={() => setSheet("menu")} onOpenNotifications={() => setSheet("notifications")} />,
    chats: <ChatsScreen />,
    rooms: <RoomsScreen />,
    foryou: <ForYouScreen />,
    profile: <ProfileScreen />,
  };

  return (
    <>
      <div className={`tab-layer ${top ? "is-covered" : ""}`}>
        {tabs[tab]}
        <BottomNav />
      </div>
      {top && (
        <div className="stack-layer" key={`${top.screen}-${top.convId}-${stack.length}`}>
          {top.screen === "conversation" && <ConversationScreen convId={top.convId} />}
          {top.screen === "call" && <RoomCallScreen convId={top.convId} />}
        </div>
      )}
      {sheet === "notifications" && <NotificationsSheet onClose={() => setSheet(null)} />}
      {sheet === "menu" && <MenuDrawer onClose={() => setSheet(null)} />}
    </>
  );
}

function Root() {
  const { ready, user } = useApp();
  return (
    <div className="stage">
      <DesktopIntro />
      <div className="device">
        <div className="device-screen">
          {!ready ? (
            <div className="splash"><span className="auth-logo">buzz<b>up</b></span><i /></div>
          ) : user ? (
            <MainApp />
          ) : (
            <AuthScreen />
          )}
          <Toast />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
