# PropView — Property Dashboard

Private, login-protected property management dashboard.
One HTML file. Deploys anywhere in ~10 minutes.

---

## How access works

| Role | Access |
|------|--------|
| **No login** | Blocked — sees the login screen only |
| **Admin (you)** | Full dashboard: add/edit/delete properties, create landlord accounts |
| **Landlord** | Sees ONLY their own properties — nothing else |

Nobody can see any data without signing in with a valid email + password.

---

## Setup (10 minutes)

### 1. Create a Firebase project

1. Go to **https://console.firebase.google.com**
2. Click **Add project** → name it (e.g. `propview`) → Create
3. Once inside the project, click **Firestore Database** in the left sidebar
4. Click **Create database** → **Production mode** → pick a region (e.g. `europe-west2` for UK) → Done

### 2. Enable Email/Password auth

1. In Firebase Console → **Authentication** (left sidebar)
2. Click **Get started** → **Sign-in method** tab
3. Click **Email/Password** → toggle **Enable** → Save

### 3. Get your Firebase config

1. Click the ⚙️ gear → **Project settings**
2. Scroll to **Your apps** → click `</>` (Web app)
3. Register it (any nickname, skip Firebase Hosting for now)
4. Copy the `firebaseConfig` object shown

### 4. Paste config into index.html

Open `index.html`, find the `CONFIG` block at the top, and replace:

```js
const CONFIG = {
  firebase: {
    apiKey:            "AIzaSy...",          // ← from step 3
    authDomain:        "your-app.firebaseapp.com",
    projectId:         "your-app",
    storageBucket:     "your-app.appspot.com",
    messagingSenderId: "123456789",
    appId:             "1:123...",
  },
  adminEmail: "usman@example.com",  // ← YOUR email (becomes admin)
};
```

### 5. Create your admin account

1. In Firebase Console → **Authentication** → **Users** tab
2. Click **Add user**
3. Enter YOUR email + a strong password
4. Click Add user

That's the admin account. Log in with it to get full access.

### 6. Set Firestore security rules

In Firebase Console → **Firestore Database** → **Rules** tab, replace everything with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /properties/{id} {
      // Admin (identified by email) can read & write everything
      allow read, write: if request.auth != null
        && request.auth.token.email == "YOUR_ADMIN_EMAIL_HERE";

      // Landlords can only read their own properties
      allow read: if request.auth != null
        && resource.data.landlordUid == request.auth.uid;
    }

    match /users/{uid} {
      // Admin can read & write all user records
      allow read, write: if request.auth != null
        && request.auth.token.email == "YOUR_ADMIN_EMAIL_HERE";

      // Landlords can read their own record
      allow read: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

**Replace `YOUR_ADMIN_EMAIL_HERE` with your actual email (twice).**

Click **Publish**.

### 7. Deploy

**Option A — Netlify (easiest, free, 30 seconds)**
1. Go to https://app.netlify.com/drop
2. Drag and drop the entire `propview/` folder
3. Done — you get a live URL like `https://amazing-name-123.netlify.app`
4. Optional: Settings → Domain management → change to a custom subdomain

**Option B — Firebase Hosting (free)**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory to: .  (dot)
# Configure as SPA: No
firebase deploy
```

**Option C — GitHub Pages (free)**
1. Push the `propview/` folder to a GitHub repo
2. Settings → Pages → Deploy from branch `main`
3. Live at `https://yourusername.github.io/propview/`

---

## Day-to-day usage

### Creating a landlord account (admin only)

1. Log in as admin
2. Sidebar → **Manage Landlords** → **Create Account**
3. Enter their name, email, and a temporary password
4. Share the URL and credentials with them — they log in and see only their properties

### Adding a property (admin only)

1. Click **Add Property** (top-right or sidebar)
2. Fill in address, type, rent, status, tenant details
3. **Assign to Landlord** — select from the dropdown of created accounts
4. Save — appears instantly on that landlord's dashboard

### Landlord view

- Landlord opens the URL, logs in with their credentials
- They see only the properties assigned to them
- Read-only — cannot add, edit, or delete anything

### Changing a landlord's password

Landlords can reset their own password via:
Firebase Console → Authentication → Users → find their email → Reset password

Or you can do it for them from the Firebase Console.

---

## File structure

```
propview/
├── index.html   ← entire app (HTML + CSS + JS, single file)
└── README.md    ← this file
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Firebase not configured" | You haven't replaced the placeholder values in `CONFIG.firebase` |
| Login fails with "user-not-found" | Create the admin account in Firebase Console → Authentication → Users |
| Login works but no properties load | Check Firestore rules are published with your correct email |
| "Missing or insufficient permissions" | Firestore rules aren't set correctly — re-check step 6 |
| Landlord can see all properties | Firestore rules aren't set — without rules, auth alone doesn't filter data |
| Blank page on deploy | Serve over HTTPS, not `file://` — any static host works |
