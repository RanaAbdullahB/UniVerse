const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const portalKnowledge = {
  greeting: {
    patterns: [/^(hi|hello|hey|howdy|greetings|sup|yo|hola)/i, /^(good\s*(morning|afternoon|evening))/i, /^what'?s up/i],
    response: (user) =>
      `Hello ${user?.name || 'there'}! 👋 I'm the UniVerse Assistant. I can help you navigate the portal. Here's what I can help with:\n\n` +
      `🏛️ **Clubs** — Browse & join student societies\n` +
      `📅 **Events** — Find & register for campus events\n` +
      `📚 **Study Groups** — Find or create study sessions\n` +
      `💬 **Messages** — Chat with other students\n` +
      `👤 **Profile** — Manage your account\n` +
      `📦 **Resources** — Access the resource pool\n\n` +
      `Just ask me about any of these, or say **"tour"** for a full walkthrough!`,
  },

  tour: {
    patterns: [/tour/i, /walkthrough/i, /show me around/i, /how (does|do) (this|the) (portal|app|site) work/i, /getting started/i, /new here/i, /guide me/i, /help me get started/i],
    response: (user) =>
      `Welcome to your UniVerse tour, ${user?.name || 'student'}! 🎓 Here's a quick walkthrough:\n\n` +
      `**Step 1 — Dashboard (🏠 Home)**\nYour landing page shows stats: clubs joined, events registered, study groups, and quick actions.\n\n` +
      `**Step 2 — Societies & Clubs (🏛️)**\nBrowse all student clubs by category (Technical, Sports, Arts, Cultural, Academic). Click any club to see details, then hit "Join" to become a member.\n\n` +
      `**Step 3 — Upcoming Events (📅)**\nDiscover workshops, seminars, competitions, and social events. Filter by type, register with one click. Check your capacity before events fill up!\n\n` +
      `**Step 4 — Study Groups (📚)**\nCreate or join peer study groups. Filter by department or online/in-person. Each group shows schedule, members, and meeting location.\n\n` +
      `**Step 5 — Messages (💬)**\nChat in real-time with other students. Use direct messages or group conversations.\n\n` +
      `**Step 6 — Resource Pool (📦)**\nShare and access study materials, notes, and resources with your peers.\n\n` +
      `**Step 7 — Profile (👤)**\nUpdate your name, department, year, and profile photo. You can also change your password here.\n\n` +
      `💡 **Tip:** Use the sidebar on the left to navigate between sections. Want details on any specific feature? Just ask!`,
  },

  clubs: {
    patterns: [/club/i, /societ/i, /organization/i, /join.*(club|society)/i, /how.*(join|find|browse).*(club|societ)/i, /leave.*(club|society)/i],
    response: () =>
      `🏛️ **Societies & Clubs**\n\n` +
      `Here's how clubs work on UniVerse:\n\n` +
      `**To browse clubs:**\n` +
      `1. Click **"Societies & Clubs"** in the sidebar\n` +
      `2. Browse by category: Technical, Sports, Arts, Cultural, Academic\n` +
      `3. Use the search bar to find specific clubs\n\n` +
      `**To join a club:**\n` +
      `Click on any club card → Hit the **"Join Club"** button. You'll see the member count update instantly!\n\n` +
      `**To leave a club:**\n` +
      `Go to the club's page → Click **"Leave Club"**\n\n` +
      `**Your clubs:**\n` +
      `Check your joined clubs on the Dashboard home or in your Profile.\n\n` +
      `💡 Each club shows a cover image, description, president info, tags, and current member count.`,
  },

  events: {
    patterns: [/event/i, /workshop/i, /seminar/i, /competition/i, /register.*(event|workshop)/i, /how.*(register|sign up|attend)/i, /hackathon/i],
    response: () =>
      `📅 **Upcoming Events**\n\n` +
      `Here's how events work:\n\n` +
      `**To find events:**\n` +
      `1. Click **"Upcoming Events"** in the sidebar\n` +
      `2. Filter by type: Workshop, Seminar, Competition, Social, Sports, Cultural\n` +
      `3. Search for specific events by name\n\n` +
      `**To register:**\n` +
      `Click on an event → Hit **"Register"**. Keep an eye on capacity — some events fill up fast!\n\n` +
      `**To cancel registration:**\n` +
      `Go to the event → Click **"Cancel Registration"**\n\n` +
      `**Your events:**\n` +
      `View your registered events on the Dashboard home page.\n\n` +
      `💡 Each event shows the organizing club, date/time, venue, and how many spots remain.`,
  },

  studyGroups: {
    patterns: [/study.?group/i, /study.?session/i, /study.?buddy/i, /study.?partner/i, /create.*(group|session)/i, /find.*(group|study)/i, /peer.*(study|learn)/i],
    response: () =>
      `📚 **Study Groups**\n\n` +
      `Here's how study groups work:\n\n` +
      `**To find groups:**\n` +
      `1. Click **"Study Groups"** in the sidebar\n` +
      `2. Filter by department (CS, Math, Chemistry, Business, etc.)\n` +
      `3. Toggle between online and in-person groups\n\n` +
      `**To join a group:**\n` +
      `Click on a group card → Hit **"Join Group"**. Check the schedule to make sure it fits yours!\n\n` +
      `**To create a group:**\n` +
      `Click the **"Create Group"** button → Fill in subject, course, department, schedule, and whether it's online or in-person.\n\n` +
      `**Group types:**\n` +
      `• **Open** — Anyone can join\n` +
      `• **Invite-Only** — Requires approval\n\n` +
      `💡 Each group shows max members, meeting day/time, location (or Zoom link for online), and the creator.`,
  },

  messages: {
    patterns: [/message/i, /chat/i, /dm/i, /direct message/i, /conversation/i, /talk to/i, /send.*(message|msg)/i, /how.*(message|chat|contact)/i],
    response: () =>
      `💬 **Messages**\n\n` +
      `Here's how messaging works:\n\n` +
      `**To access messages:**\n` +
      `Click **"Messages"** in the sidebar\n\n` +
      `**Features:**\n` +
      `• Real-time messaging powered by Socket.IO\n` +
      `• Direct messages (1-on-1 with other students)\n` +
      `• Group conversations\n` +
      `• See when messages are delivered\n\n` +
      `**To start a conversation:**\n` +
      `Click the new message button and search for a student to chat with.\n\n` +
      `💡 Messages update in real-time — no need to refresh the page!`,
  },

  profile: {
    patterns: [/profile/i, /account/i, /settings/i, /change.*(password|name|photo|department)/i, /update.*(profile|info|details)/i, /my info/i, /edit.*(profile|account)/i],
    response: () =>
      `👤 **Profile Management**\n\n` +
      `Here's what you can do with your profile:\n\n` +
      `**To access your profile:**\n` +
      `Click **"My Profile"** in the sidebar\n\n` +
      `**You can update:**\n` +
      `• Your display name\n` +
      `• Department\n` +
      `• Academic year\n` +
      `• Profile photo\n\n` +
      `**Change password:**\n` +
      `In your profile, enter your current password and the new one.\n\n` +
      `**Your memberships:**\n` +
      `Your profile shows all your joined clubs, study groups, and registered events.\n\n` +
      `💡 Your profile info is visible to other students in group chats and club lists.`,
  },

  resources: {
    patterns: [/resource/i, /resource.?pool/i, /shared.*(material|file|note|resource)/i, /study.*(material|note|resource)/i, /upload.*(resource|file|note)/i, /download.*(resource|file|note)/i],
    response: () =>
      `📦 **Resource Pool**\n\n` +
      `The Resource Pool lets you share and access study materials:\n\n` +
      `**To access:**\n` +
      `Click **"Resource Pool"** in the sidebar\n\n` +
      `**Features:**\n` +
      `• Share notes, documents, and study materials\n` +
      `• Browse resources shared by other students\n` +
      `• Organized for easy discovery\n\n` +
      `💡 Great for sharing lecture notes, past exams, and study guides with your peers!`,
  },

  dashboard: {
    patterns: [/dashboard/i, /home.?page/i, /main.?page/i, /landing/i, /overview/i, /stats/i, /quick.?action/i],
    response: (user) =>
      `🏠 **Dashboard Home**\n\n` +
      `Your dashboard is your command center! Here's what you'll see:\n\n` +
      `**Stats Cards:**\n` +
      `• Clubs Joined — How many societies you're a member of\n` +
      `• Events Registered — Upcoming events you've signed up for\n` +
      `• Study Groups — Groups you're part of\n` +
      `• Your Year — Current academic year\n\n` +
      `**Quick Actions:**\n` +
      `Jump directly to Browse Clubs, Find Events, or Join Study Groups.\n\n` +
      `💡 The dashboard gives you a snapshot of your university life at a glance, ${user?.name || 'student'}!`,
  },

  navigation: {
    patterns: [/navigate/i, /sidebar/i, /where.*(find|is|go|click)/i, /how.*(get to|go to|access|open|find)/i, /menu/i, /navbar/i],
    response: () =>
      `🧭 **Navigation Guide**\n\n` +
      `The portal uses a sidebar for navigation:\n\n` +
      `**Sidebar (left side):**\n` +
      `🏠 Home — Dashboard overview\n` +
      `🏛️ Societies & Clubs — Browse/join clubs\n` +
      `📅 Upcoming Events — Find/register for events\n` +
      `📚 Study Groups — Join/create study sessions\n` +
      `💬 Messages — Real-time chat\n` +
      `📦 Resource Pool — Shared materials\n` +
      `👤 My Profile — Account settings\n\n` +
      `**On mobile:**\n` +
      `Tap the hamburger menu (☰) in the top navbar to open the sidebar.\n\n` +
      `💡 The active section is highlighted in the sidebar so you always know where you are.`,
  },

  admin: {
    patterns: [/admin/i, /manage/i, /create.*(club|event)/i, /delete/i, /moderate/i, /admin.*(dashboard|panel)/i],
    response: () =>
      `🔐 **Admin Features**\n\n` +
      `Admin accounts have extra privileges:\n\n` +
      `• **Create clubs** and events\n` +
      `• **Manage users** and content\n` +
      `• **View analytics** and activity logs\n` +
      `• **Send announcements** (with optional email blasts)\n` +
      `• **Delete** study groups and moderate content\n\n` +
      `💡 Admin access is separate from the student portal. If you think you need admin access, contact your university administrator.`,
  },

  help: {
    patterns: [/help/i, /what can you do/i, /commands/i, /options/i, /features/i, /what.*(you|bot).*(do|help)/i, /capabilities/i],
    response: (user) =>
      `🤖 **I can help you with:**\n\n` +
      `• **"tour"** — Get a full walkthrough of the portal\n` +
      `• **"clubs"** — Learn about Societies & Clubs\n` +
      `• **"events"** — Learn about Events & Registration\n` +
      `• **"study groups"** — Learn about Study Groups\n` +
      `• **"messages"** — Learn about Messaging\n` +
      `• **"resources"** — Learn about the Resource Pool\n` +
      `• **"profile"** — Learn about Profile Management\n` +
      `• **"dashboard"** — Learn about the Dashboard\n` +
      `• **"navigation"** — How to get around the portal\n\n` +
      `Just type your question naturally — I understand conversational language too, ${user?.name || 'student'}! 😊`,
  },

  thanks: {
    patterns: [/thank/i, /thanks/i, /thx/i, /appreciate/i, /ty/i, /cheers/i],
    response: (user) =>
      `You're welcome, ${user?.name || 'student'}! 😊 Happy to help. If you have more questions about the portal, just ask!`,
  },

  bye: {
    patterns: [/bye/i, /goodbye/i, /see you/i, /later/i, /gotta go/i, /ttyl/i],
    response: (user) =>
      `Goodbye, ${user?.name || 'student'}! 👋 Have a great day at university. I'm always here if you need help with the portal!`,
  },
};

function findBestMatch(message) {
  const cleaned = message.trim().toLowerCase();

  for (const [key, entry] of Object.entries(portalKnowledge)) {
    for (const pattern of entry.patterns) {
      if (pattern.test(cleaned)) {
        return entry;
      }
    }
  }

  return null;
}

function generateContextualSuggestions(activeTab) {
  const suggestions = {
    home: ['What can I see on my dashboard?', 'Give me a tour', 'How do I join a club?'],
    clubs: ['How do I join a club?', 'Can I leave a club?', 'What categories are available?'],
    events: ['How do I register for an event?', 'What types of events are there?', 'Can I cancel registration?'],
    studygroups: ['How do I create a study group?', 'What is an invite-only group?', 'Can I join online groups?'],
    messages: ['How does messaging work?', 'Can I send direct messages?', 'Are messages real-time?'],
    profile: ['How do I change my password?', 'Can I update my photo?', 'What info is visible to others?'],
    'resource-pool': ['What is the resource pool?', 'How do I share materials?', 'Can I download resources?'],
  };

  return suggestions[activeTab] || suggestions.home;
}

// POST /api/chatbot/message
router.post('/message', authMiddleware, async (req, res, next) => {
  try {
    const { message, activeTab } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const user = req.user;
    const match = findBestMatch(message);

    let reply;
    if (match) {
      reply = match.response(user);
    } else {
      reply =
        `I'm not sure I understand that question, ${user?.name || 'student'}. 🤔\n\n` +
        `Here are some things I can help with:\n` +
        `• Say **"tour"** for a full portal walkthrough\n` +
        `• Ask about **clubs**, **events**, **study groups**, **messages**, **resources**, or **profile**\n` +
        `• Say **"help"** to see all my capabilities\n\n` +
        `Try rephrasing your question, or pick one of the suggestions below!`;
    }

    const suggestions = generateContextualSuggestions(activeTab || 'home');

    res.json({
      success: true,
      reply,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/chatbot/suggestions
router.get('/suggestions', authMiddleware, (req, res) => {
  const { activeTab } = req.query;
  const suggestions = generateContextualSuggestions(activeTab || 'home');
  res.json({ success: true, suggestions });
});

module.exports = router;
