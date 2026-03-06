UniVerse — One Platform endless connection

A full-stack MERN web application that serves as a centralized hub for university student life — clubs, events, study groups, and more.

---

 Features

- **Authentication** — JWT-based login/register with university email domain enforcement
- **Societies & Clubs** — Browse, join, and leave student clubs with real-time member counts
- **Upcoming Events** — Register for workshops, seminars, competitions, and social events
- **Study Groups** — Create and join peer study groups with scheduling
- **Student Profile** — Manage your profile, view memberships, change password
- **Responsive Design** — Works on mobile, tablet, and desktop
- **Toast Notifications** — Real-time feedback on all user actions
- **Role-Based Access** — Admin and student roles with appropriate permissions

---

**Tech Stack**

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Styling | TailwindCSS + Custom CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT + bcryptjs |
| Fonts | Playfair Display + DM Sans |

---

**Project Structure**

```
university-portal/
├── client/                    # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js      # Top navigation bar
│   │   │   ├── Sidebar.js     # Side navigation
│   │   │   └── LoadingSpinner.js
│   │   ├── context/
│   │   │   ├── AuthContext.js # Global auth state
│   │   │   └── ToastContext.js # Toast notifications
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js   # Main layout shell
│   │   │   ├── DashboardHome.js
│   │   │   ├── Clubs.js
│   │   │   ├── Events.js
│   │   │   ├── StudyGroups.js
│   │   │   ├── Profile.js
│   │   │   └── NotFound.js
│   │   ├── utils/
│   │   │   └── api.js         # Axios instance with JWT
│   │   ├── App.js
│   │   └── index.css          # Global styles + animations
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                    # Express backend
│   ├── models/
│   │   ├── User.js
│   │   ├── Club.js
│   │   ├── Event.js
│   │   └── StudyGroup.js
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification
│   │   ├── emailDomainMiddleware.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clubs.js
│   │   ├── events.js
│   │   └── studyGroups.js
│   ├── index.js               # Server entry point
│   ├── seed.js                # Database seeder
│   └── package.json
│
├── .env.example
├── package.json               # Root (runs both concurrently)
└── README.md
```

---

**Quick Start**

### Prerequisites

- **Node.js** v18+
- **MongoDB** running locally (or MongoDB Atlas URI)
- **npm** or **yarn**

---

### 1. Clone & Install

```bash
# Clone the repository
git clone <repo-url>
cd university-portal

# Install root dependencies
npm install

# Install all dependencies (client + server)
npm run install-all
```

Or manually:
```bash
cd server && npm install
cd ../client && npm install
```

---

### 2. Configure Environment Variables

```bash
# Copy the example file
cp .env.example server/.env
```

Edit `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/university-portal
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
UNIVERSITY_EMAIL_DOMAIN=university.edu
PORT=5000
CLIENT_URL=http://localhost:3000
```

> ⚠️ Change `UNIVERSITY_EMAIL_DOMAIN` to match your actual university domain (e.g., `mit.edu`, `oxford.ac.uk`)

---

### 3. Seed the Database (Optional but Recommended)

```bash
npm run seed
# or
node server/seed.js
```

This creates:
- **5 sample clubs** (Technical, Sports, Arts, Cultural, Academic)
- **6 sample events** across different clubs
- **4 sample study groups** across departments
- **2 sample users** (1 admin, 1 student)

**Login credentials after seeding:**
```
👨‍💼 Admin:   admin@university.edu    | password: password123
👨‍🎓 Student: alex.johnson@university.edu | password: password123
```

---

### 4. Run the Application

```bash
# Run both servers concurrently (from root)
npm run dev

# Or run separately:
npm run dev:server   # Backend on http://localhost:5000
npm run dev:client   # Frontend on http://localhost:3000
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new student |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/update-profile` | Private | Update profile |
| PUT | `/api/auth/change-password` | Private | Change password |

### Clubs
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/clubs` | Private | Get all clubs (filter: `category`, `search`) |
| GET | `/api/clubs/my-clubs` | Private | Get user's clubs |
| GET | `/api/clubs/:id` | Private | Get single club |
| POST | `/api/clubs` | Admin | Create club |
| POST | `/api/clubs/:id/join` | Private | Join a club |
| POST | `/api/clubs/:id/leave` | Private | Leave a club |

### Events
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/events` | Private | Get events (filter: `eventType`, `search`, `upcoming`) |
| GET | `/api/events/my-events` | Private | User's registered events |
| GET | `/api/events/:id` | Private | Single event |
| POST | `/api/events` | Admin | Create event |
| POST | `/api/events/:id/register` | Private | Register for event |
| POST | `/api/events/:id/unregister` | Private | Cancel registration |

### Study Groups
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/study-groups` | Private | All groups (filter: `department`, `isOnline`, `search`) |
| GET | `/api/study-groups/my-groups` | Private | User's groups |
| GET | `/api/study-groups/:id` | Private | Single group |
| POST | `/api/study-groups` | Private | Create group |
| POST | `/api/study-groups/:id/join` | Private | Join group |
| POST | `/api/study-groups/:id/leave` | Private | Leave group |
| DELETE | `/api/study-groups/:id` | Creator/Admin | Delete group |

---

## 🔒 Security

- All API routes (except `/auth/register` and `/auth/login`) require a valid JWT
- University email domain enforced on register AND login
- Passwords hashed with bcryptjs (12 salt rounds)
- Passwords never returned in API responses
- JWT expires after 7 days
- Students can only modify their own memberships
- Study group deletion restricted to creator or admin
- Club/Event creation restricted to admins

---

## 🎨 Design System

The portal uses a **refined academic aesthetic** with:

- **Primary:** Deep Navy (`#0f1b2d`) — trust, prestige
- **Accent:** Antique Gold (`#c9a84c`) — excellence, achievement  
- **Background:** Warm Cream (`#f7f5f0`) — warmth, approachability
- **Typography:** Playfair Display (headings) + DM Sans (body)

---

## 📝 Notes

- The React app proxies `/api` requests to `localhost:5000` during development
- For production, set `CLIENT_URL` in `.env` and configure CORS accordingly
- MongoDB must be running before starting the server
- Profile photos accept URLs (image upload not included — integrate Cloudinary for production)
