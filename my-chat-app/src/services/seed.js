const asset = (path) => `${process.env.PUBLIC_URL || ""}/demo/${path}`;
export const person = (name) => asset(`people/${name}.jpg`);
export const place = (name) => asset(`places/${name}.jpg`);
export const VOICE_NOTE_URL = asset("audio/voice-note.wav");

export const DEMO_PASSWORD = "buzzup123";
export const DEMO_EMAIL = "alex@buzzup.app";
export const DEMO_UID = "u-alex";

export const SEED_USERS = [
  { uid: "u-alex",  username: "Alex Rivera",  handle: "alex",  city: "Mumbai",    bio: "Product designer. Weekend trail runner, weekday pixel pusher.", interests: ["Hiking", "Design", "Coffee", "Bouldering"], online: true },
  { uid: "u-maya",  username: "Maya Chen",    handle: "maya",  city: "Pune",      bio: "Collecting sunsets and summit selfies.", interests: ["Hiking", "Photography", "CraftBeer"], online: true },
  { uid: "u-kofi",  username: "Kofi Mensah",  handle: "kofi",  city: "Bengaluru", bio: "Plans the hikes. Forgets the snacks.", interests: ["Hiking", "Running", "Music"], online: true },
  { uid: "u-priya", username: "Priya Nair",   handle: "priya", city: "Mumbai",    bio: "Frontend dev & part-time mixologist.", interests: ["Tech", "Mixology", "Startups"], online: false },
  { uid: "u-lena",  username: "Lena Fischer", handle: "lena",  city: "Goa",       bio: "Climbing walls, literally.", interests: ["Bouldering", "Yoga", "Travel"], online: true },
  { uid: "u-arjun", username: "Arjun Mehta",  handle: "arjun", city: "Delhi",     bio: "Building things that buzz.", interests: ["Tech", "Running", "Startups"], online: false },
  { uid: "u-zoe",   username: "Zoe Martin",   handle: "zoe",   city: "Pune",      bio: "Lakes > beaches. Fight me.", interests: ["Travel", "Swimming", "Photography"], online: true },
  { uid: "u-sam",   username: "Sam Okafor",   handle: "sam",   city: "Hyderabad", bio: "Hat collector, trail mix connoisseur.", interests: ["Hiking", "Food", "Running"], online: false },
  { uid: "u-amara", username: "Amara Obi",    handle: "amara", city: "Chennai",   bio: "5K every morning before chai.", interests: ["Running", "Fitness", "Podcasts"], online: true },
  { uid: "u-noah",  username: "Noah Brooks",  handle: "noah",  city: "Bengaluru", bio: "Backend engineer, cocktail nerd.", interests: ["Tech", "Mixology"], online: false },
  { uid: "u-isla",  username: "Isla Romero",  handle: "isla",  city: "Goa",       bio: "Road trips with zero planning.", interests: ["Travel", "Music", "CraftBeer"], online: true },
  { uid: "u-ethan", username: "Ethan Cole",   handle: "ethan", city: "Mumbai",    bio: "Boulder V5, coffee V10.", interests: ["Bouldering", "Coffee"], online: false },
  { uid: "u-mei",   username: "Mei Tanaka",   handle: "mei",   city: "Delhi",     bio: "UX researcher who asks too many questions.", interests: ["Design", "Tech", "Yoga"], online: true },
  { uid: "u-sofia", username: "Sofia Rossi",  handle: "sofia", city: "Pune",      bio: "Golden hour is my favourite hour.", interests: ["Photography", "Hiking"], online: false },
  { uid: "u-ruby",  username: "Ruby Shah",    handle: "ruby",  city: "Mumbai",    bio: "Saying yes to every adventure.", interests: ["Travel", "Running"], online: true },
  { uid: "u-walt",  username: "Walt Hughes",  handle: "walt",  city: "Shimla",    bio: "40 years on the trails and counting.", interests: ["Hiking", "Stories"], online: false },
].map((u) => ({ ...u, email: `${u.handle}@buzzup.app`, avatar: person(u.handle) }));

export const COMMUNITIES = [
  {
    id: "weekend-wanderers",
    name: "Weekend Wanderers",
    headline: "Chasing sunsets and mountain tops",
    cover: place("weekend-wanderers"),
    tags: ["CraftBeer", "Hiking", "Running", "Bouldering"],
    members: ["u-isla", "u-zoe", "u-sofia", "u-ruby", "u-sam"],
    memberCount: 9,
  },
  {
    id: "sunrise-runners",
    name: "Sunrise Runners",
    headline: "Five kilometres before the city wakes up",
    cover: place("sunrise-runners"),
    tags: ["Running", "Fitness", "Chai"],
    members: ["u-amara", "u-arjun", "u-ruby", "u-kofi"],
    memberCount: 23,
  },
  {
    id: "boulder-buddies",
    name: "Boulder Buddies",
    headline: "Find your next problem to solve",
    cover: place("boulder-buddies"),
    tags: ["Bouldering", "Travel", "Yoga"],
    members: ["u-lena", "u-ethan", "u-zoe"],
    memberCount: 12,
  },
  {
    id: "trail-tales",
    name: "Trail & Tales",
    headline: "Long walks, longer stories",
    cover: place("mountains"),
    tags: ["Hiking", "Stories", "Camping"],
    members: ["u-walt", "u-sofia", "u-sam", "u-maya"],
    memberCount: 31,
  },
  {
    id: "rooftop-fridays",
    name: "Rooftop Fridays",
    headline: "New city, same golden hour crew",
    cover: place("rooftop"),
    tags: ["Music", "CraftBeer", "Meetups"],
    members: ["u-isla", "u-noah", "u-mei", "u-amara", "u-ruby"],
    memberCount: 48,
  },
  {
    id: "peak-seekers",
    name: "Peak Seekers",
    headline: "Every summit starts with a group chat",
    cover: place("peak-seekers"),
    tags: ["Hiking", "Photography", "Camping"],
    members: ["u-maya", "u-kofi", "u-lena", "u-zoe", "u-sam", "u-walt"],
    memberCount: 7,
  },
  {
    id: "code-cocktails",
    name: "Code & Cocktails",
    headline: "Ship code by day, shake cocktails by night",
    cover: place("code-cocktails"),
    tags: ["Tech", "Mixology", "Startups"],
    members: ["u-priya", "u-noah", "u-arjun", "u-mei", "u-ethan", "u-maya"],
    memberCount: 17,
  },
];

export const INITIAL_JOINED = ["peak-seekers", "code-cocktails"];

export const roomConversationId = (communityId) => `room-${communityId}`;
export const directConversationId = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);

const MIN = 60 * 1000;

// Conversations every newly signed-in demo account starts with.
// Messages flagged `unread` start unread for that account.
export function buildStarterThreads(me, firstName = "there", now = Date.now()) {
  const t = (minsAgo) => now - minsAgo * MIN;
  const dm = (uid) => directConversationId(me, uid);

  return {
    [roomConversationId("peak-seekers")]: [
      { sender: "u-kofi", type: "text", text: "Who's in for Saturday's sunrise hike up Kalsubai? 🌄", timestamp: t(190) },
      { sender: "u-zoe", type: "text", text: "Me! Can someone share the exact meeting point and time?", timestamp: t(176), reactions: { "❤️": ["u-maya"] } },
      { sender: me, type: "voice", media: [VOICE_NOTE_URL], duration: 8, timestamp: t(170) },
      { sender: "u-maya", type: "gallery", text: "Here's what I put together from our last trip:", media: [place("weekend-wanderers"), place("mountains"), place("rooftop")], timestamp: t(120), reactions: { "👍": ["u-kofi", "u-lena"], "🔥": ["u-zoe"] } },
      { sender: me, type: "text", text: "I like it! Let's make another one in a different style 🎨", timestamp: t(95) },
      { sender: "u-lena", type: "text", text: "Count me in ✨ I'll bring the speaker", timestamp: t(42), unread: true },
      { sender: "u-walt", type: "text", text: "Pack layers — it gets windy near the top.", timestamp: t(12), unread: true },
    ],
    [roomConversationId("code-cocktails")]: [
      { sender: "u-priya", type: "text", text: "Tonight's theme: espresso martinis + debugging stories 🍸", timestamp: t(300) },
      { sender: "u-noah", type: "text", text: "I'll bring the shaker. Someone bring a laptop that doesn't crash.", timestamp: t(280) },
      { sender: "u-mei", type: "image", media: [place("code-cocktails")], text: "Prototype of the menu", timestamp: t(240), reactions: { "🔥": ["u-priya", "u-noah"] } },
      { sender: "u-arjun", type: "text", text: "Joining the room call in 10 👋", timestamp: t(25), unread: true },
    ],
    [dm("u-maya")]: [
      { sender: "u-maya", type: "text", text: `Hey ${firstName}! Did you see the photos from Lonavala?`, timestamp: t(65) },
      { sender: me, type: "text", text: "Just did — the golden hour shot is unreal 😍", timestamp: t(60) },
      { sender: "u-maya", type: "image", media: [place("mountains")], timestamp: t(9), unread: true },
      { sender: "u-maya", type: "text", text: "Printing this one for my wall. Hike again soon?", timestamp: t(8), unread: true },
    ],
    [dm("u-kofi")]: [
      { sender: me, type: "text", text: "Bro, did you pack the snacks this time?", timestamp: t(400) },
      { sender: "u-kofi", type: "text", text: "Define 'pack'… 😅", timestamp: t(395) },
      { sender: "u-kofi", type: "voice", media: [VOICE_NOTE_URL], duration: 8, timestamp: t(31), unread: true },
    ],
    [dm("u-priya")]: [
      { sender: "u-priya", type: "text", text: "Your Figma file for the onboarding flow is so clean 👀", timestamp: t(1500) },
      { sender: me, type: "text", text: "Thank you!! Took 4 iterations to get the spacing right.", timestamp: t(1490) },
      { sender: "u-priya", type: "text", text: "Hola! ¿Quieres tomar un café mañana?", timestamp: t(1400) },
    ],
    [dm("u-lena")]: [
      { sender: "u-lena", type: "text", text: "New bouldering gym opened in Bandra. Saturday?", timestamp: t(2900) },
      { sender: me, type: "text", text: "Yes! My forearms are scared already.", timestamp: t(2880) },
    ],
    [dm("u-amara")]: [
      { sender: "u-amara", type: "text", text: "5K at Marine Drive tomorrow, 6am. You in? 🏃‍♀️", timestamp: t(5000) },
    ],
  };
}

export const AUTO_REPLIES = [
  "Haha love that 😄",
  "Sounds like a plan! 🙌",
  "Wait, tell me more 👀",
  "I'm so in. When?",
  "That's amazing!! 🔥",
  "Sending this to the group 😂",
  "Okay but the vibes are immaculate ✨",
  "Let me check my calendar and get back to you",
  "Same here! Great minds 🧠",
  "Yesss, finally someone said it",
];

export const ROOM_CHATTER = [
  "Can everyone hear me okay?",
  "Ooh good idea",
  "I'll share the map in the chat",
  "Who's driving on Saturday?",
  "That trail was so worth it",
];
