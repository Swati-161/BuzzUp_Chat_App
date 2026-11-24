import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getBackend, savedMode, saveMode } from "../services/backend";

const AppContext = createContext(null);
const LANG_KEY = "buzzup.translateLang";

export function AppProvider({ children }) {
  const [mode, setMode] = useState(savedMode);
  const [backend, setBackend] = useState(null);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [memberships, setMemberships] = useState({ joined: [], saved: [], skipped: [] });
  const [communities, setCommunities] = useState([]);
  const [tab, setTab] = useState("home");
  const [stack, setStack] = useState([]);
  const [toastState, setToastState] = useState(null);
  const [translateLang, setTranslateLangState] = useState(() => localStorage.getItem(LANG_KEY) || "hi");
  const toastTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    setReady(false);
    getBackend(mode).then((b) => {
      if (cancelled) return;
      setBackend(b);
      unsub = b.onAuthChange((u) => {
        setUser(u);
        setReady(true);
      });
    });
    return () => { cancelled = true; unsub(); };
  }, [mode]);

  const uid = user?.uid;
  useEffect(() => {
    if (!backend || !uid) return;
    const subs = [
      backend.subscribeUsers(setUsers),
      backend.subscribeConversations(uid, setConversations),
      backend.subscribeNotifications(uid, setNotifications),
      backend.subscribeMemberships(uid, setMemberships),
      backend.subscribeCommunities(setCommunities),
    ];
    return () => subs.forEach((u) => u());
  }, [backend, uid]);

  useEffect(() => {
    if (!uid) { setStack([]); setTab("home"); }
  }, [uid]);

  const activate = useCallback((nextMode) => {
    saveMode(nextMode);
    setMode(nextMode);
  }, []);

  const toast = useCallback((message, action) => {
    clearTimeout(toastTimer.current);
    setToastState({ message, action, id: Date.now() });
    toastTimer.current = setTimeout(() => setToastState(null), 3200);
  }, []);

  const push = useCallback((screen) => setStack((s) => [...s, screen]), []);
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  const goTab = useCallback((t) => { setStack([]); setTab(t); }, []);
  const openConversation = useCallback((convId) => push({ screen: "conversation", convId }), [push]);
  const openCall = useCallback((convId) => push({ screen: "call", convId }), [push]);

  const setTranslateLang = useCallback((lang) => {
    localStorage.setItem(LANG_KEY, lang);
    setTranslateLangState(lang);
  }, []);

  const value = useMemo(() => ({
    mode, backend, ready, user, users, conversations, notifications, memberships, communities,
    tab, stack, toastState, translateLang,
    activate, toast, push, pop, goTab, openConversation, openCall, setTranslateLang,
    unreadNotifications: notifications.filter((n) => !n.read).length,
  }), [mode, backend, ready, user, users, conversations, notifications, memberships, communities, tab, stack, toastState, translateLang, activate, toast, push, pop, goTab, openConversation, openCall, setTranslateLang]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
