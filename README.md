# MediTrack PHC

Electronic patient record system for a primary health centre, rebuilt as a full-stack application.

- **Client:** React 18 + Vite + React Router + Bootstrap 5
- **Server:** Node.js + Express (REST API)
- **Database and login:** Firebase (Firestore + Firebase Authentication), free Spark plan

## How it fits together

```
 Browser (React)                    Express API                      Firebase
 ───────────────                    ───────────                      ────────
 Sign in ──────────────────────────────────────────────────────────▶ Authentication
        ◀────────────────── ID token (includes the user's role) ────
 fetch /api/... + "Bearer <token>" ─▶ verify token, check role ───▶ Firestore
                                    ◀───────────── data ────────────
```

The React app only uses Firebase to sign in. Every patient record is read and written by the Express server through the Firebase Admin SDK, and the Firestore security rules (`firestore.rules`) deny all direct browser access. This means permissions are enforced in one place, on the server, where users can't bypass them.

## Roles and permissions

| Action | Admin | Doctor | Records officer |
|---|---|---|---|
| View patient list and demographics | ✓ | ✓ | ✓ |
| Register / edit patient details | ✓ | ✓ | ✓ |
| View consultation history | ✓ | ✓ | ✗ |
| Add consultations | ✗ | ✓ | ✗ |
| Archive / restore patients, view archived | ✓ | ✗ | ✗ |
| Create staff accounts, change roles, reset passwords | ✓ | ✗ | ✗ |

Roles are stored as a Firebase Auth custom claim. Changing someone's role, deactivating them or resetting their password signs them out everywhere, so new permissions apply immediately.

Consultations are append-only: once saved they can't be edited or deleted. A correction is recorded as a new entry. Each entry records which doctor added it.

Archiving hides a patient from everyday lists without deleting anything. An administrator can restore the record at any time.

## Firestore structure

```
counters/patients                       { lastNumber: 12 }
patients/PHC-0001                       firstName, lastName, gender, dateOfBirth, phone, address,
                                        bloodGroup, genotype, allergies, dateRegistered,
                                        archived, consultationCount, searchKeywords,
                                        createdAt/By, updatedAt/By, archivedAt/By
patients/PHC-0001/consultations/{id}    date, complaint, diagnosis, treatment, prescription,
                                        doctorNotes, recordedBy, createdAt
users/{uid}                             name, email, role, active, createdAt/By
```

Design notes:

- **Consultations are a subcollection**, not an array inside the patient document, because a Firestore document is limited to 1 MB and a patient's history grows forever.
- **Patient IDs come from a counter inside a transaction**, so two staff registering at the same moment can never receive the same `PHC-####` number.
- **Search uses a keyword array.** Firestore can't do "contains" text search, so each patient stores lowercase prefixes of their name, ID and phone number. Typing `hau`, `PHC-0012`, `12` or `0803 123` all find the right patient with one query.
- **No composite indexes are needed.** Queries were written to work with Firestore's automatic single-field indexes.

## Setup

You need **Node.js 20 LTS** (from nodejs.org) and a Google account.

### 1. Create the Firebase project

1. Go to the Firebase console (console.firebase.google.com) and create a project. Google Analytics is not needed.
2. **Authentication:** Build → Authentication → Get started → Sign-in method → enable **Email/Password**.
3. **Firestore:** Build → Firestore Database → Create database → choose a location → start in **production mode**. The location can't be changed later.
4. **Rules:** in Firestore → Rules, replace the contents with the rules in `firestore.rules` and publish.
5. **Web app config:** Project settings (gear icon) → General → Your apps → add a **Web** app. Copy the `apiKey`, `authDomain`, `projectId` and `appId` values; you'll need them in step 3.
6. **Service account key:** Project settings → Service accounts → **Generate new private key**. Save the downloaded file as `server/serviceAccountKey.json`. Treat this file like a password: it gives full access to your database and must never be committed to git (it's already in `.gitignore`).

### 2. Start the server

```bash
cd server
cp .env.example .env
npm install

# Create the first administrator (run once)
npm run create-admin -- --email you@example.com --password "choose-a-password" --name "Your Name"

npm run dev
```

The API runs on http://localhost:5000. Check http://localhost:5000/api/health shows `{"status":"ok"}`.

### 3. Start the client (in a second terminal)

```bash
cd client
cp .env.example .env
# open .env and paste in the four Firebase web config values
npm install
npm run dev
```

Open http://localhost:5173 and sign in with the admin account. Go to **Staff** to create doctor and records officer accounts, then sign in as each to see how the app changes by role.

## API reference

All routes except `/api/health` need an `Authorization: Bearer <Firebase ID token>` header.

| Method | Route | Who | Purpose |
|---|---|---|---|
| GET | `/api/health` | anyone | Server status |
| GET | `/api/me` | all staff | The signed-in user as the server sees them |
| GET | `/api/stats` | all staff | Dashboard counts and recent patients |
| GET | `/api/patients?q=&archived=` | all staff (`archived=true`: admin) | List or search patients |
| POST | `/api/patients` | all staff | Register a patient |
| GET | `/api/patients/:id` | all staff (archived: admin) | One patient |
| PUT | `/api/patients/:id` | all staff | Update patient details |
| PATCH | `/api/patients/:id/archive` | admin | Archive |
| PATCH | `/api/patients/:id/restore` | admin | Restore |
| GET | `/api/patients/:id/consultations` | admin, doctor | Consultation history |
| POST | `/api/patients/:id/consultations` | doctor | Add a consultation |
| GET | `/api/staff` | admin | List staff |
| POST | `/api/staff` | admin | Create a staff account |
| PATCH | `/api/staff/:uid` | admin | Change role, activate/deactivate, reset password, rename |

Errors come back as `{ "error": "message", "details": { "field": "message" } }`, which the forms use to highlight the right fields.

## Project structure

```
meditrack-phc/
├── firestore.rules            Deny-all rules (paste into Firebase console)
├── client/
│   ├── index.html
│   ├── vite.config.js         Proxies /api to the server in development
│   └── src/
│       ├── main.jsx, App.jsx  Entry point and route map
│       ├── lib/               api.js (all server calls), firebase.js, permissions.js, format.js, useApi.js
│       ├── context/           AuthContext (user + role), ToastContext
│       ├── components/        Layout, RequireAuth, PatientForm, Modal, badges, empty/error/loading states
│       ├── pages/             Login, Dashboard, PatientList, RegisterPatient, EditPatient,
│       │                      PatientProfile, AddConsultation, Staff, NotFound
│       └── styles/style.css   Original MediTrack styles plus additions
└── server/
    ├── scripts/createAdmin.js One-time first-admin setup
    └── src/
        ├── index.js           Express app
        ├── config/            Firebase Admin init, roles
        ├── middleware/        Token verification + role checks, error handler
        ├── routes/            patients, staff, me/stats
        ├── services/          All Firestore access (patients, consultations, staff, stats)
        └── utils/             Validation, search keywords, dates, serialisation
```

## Troubleshooting

- **"Can't reach the MediTrack server"**: the API isn't running. Start it with `npm run dev` in `server/`.
- **Server exits with "Could not read the Firebase service account key"**: `serviceAccountKey.json` is missing from `server/` or the path in `server/.env` is wrong.
- **Login page shows a blank screen or Firebase errors in the browser console**: `client/.env` is missing values. Restart `npm run dev` after editing it.
- **"This account has no role yet"**: the account was created directly in the Firebase console. Create staff from the in-app Staff page instead, or run `create-admin` for that email.
- **Server log says Firestore "requires an index"**: open the link printed in the log and click Create. It takes a minute or two. (This shouldn't happen with the current queries, but Firestore occasionally asks.)
- **Signed out unexpectedly**: an administrator changed your role, password or account status.

## Deploying (optional)

The server can be hosted on any Node.js host (Render, Railway, a VPS). Set the same `.env` values there and provide the service account key securely (most hosts let you upload a secret file). Then build the client with `npm run build`, host the `client/dist` folder on any static host (Firebase Hosting works on the free plan), set `VITE_API_URL` to the deployed API URL before building, and add the client's URL to `CLIENT_ORIGIN` on the server.
