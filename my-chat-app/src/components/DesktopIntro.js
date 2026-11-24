import { Heart, Mic, Languages, Video, Users, MonitorSmartphone } from "lucide-react";

const FEATURES = [
  { Icon: Heart, title: "Swipe into communities", text: "Swipe or tap ♥ on Home to join a room; ☆ saves it for later." },
  { Icon: Mic, title: "Voice notes, photos & reactions", text: "Hold a conversation the way friends actually do. Tap any bubble to react." },
  { Icon: Languages, title: "Translate any message", text: "Tap a message, then the translate icon. Try Priya's Spanish text." },
  { Icon: Video, title: "Hop into a video room", text: "Live speaking indicators, mute, deafen and your own camera." },
  { Icon: MonitorSmartphone, title: "Real-time across tabs", text: "Open a second tab, sign out and explore as Maya to watch messages arrive live." },
];

export default function DesktopIntro() {
  return (
    <aside className="intro">
      <span className="intro-logo">buzz<b>up</b></span>
      <h2>A friendlier way to find your people.</h2>
      <p className="intro-lead">
        A redesign of the BuzzUp real-time chat app: warm gradients, glassy surfaces and big,
        thumb-friendly controls that put people first.
      </p>
      <ul className="intro-features">
        {FEATURES.map(({ Icon, title, text }) => (
          <li key={title}>
            <span><Icon size={16} /></span>
            <div><strong>{title}</strong><p>{text}</p></div>
          </li>
        ))}
      </ul>
      <div className="intro-logins">
        <Users size={16} />
        <div>
          <strong>Try it as different people</strong>
          <p>Tap <b>Explore the demo</b> to be Alex, or pick Maya or Kofi on the welcome screen. No passwords needed.</p>
        </div>
      </div>
      <div className="intro-palette" aria-label="Design palette">
        <span style={{ background: "#1c1c1e" }} />
        <span style={{ background: "#eaeeed" }} />
        <span style={{ background: "linear-gradient(135deg,#ff9a4d,#f7728c)" }} />
        <span style={{ background: "#f4874b" }} />
        <small>Inter · 8pt grid · 44px touch targets</small>
      </div>
    </aside>
  );
}
