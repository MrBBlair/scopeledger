# Firebase setup (step-by-step)

Do these steps **once** to create your Firebase project and connect this app. The repo already has `firestore.rules`, `firestore.indexes.json`, and `firebase.json` configured.

---

## Part 1: Create the project (you do this in the browser)

### Step 1.1 – Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com).
2. Click **Add project** (or **Create a project**).
3. Enter a name (e.g. **PM Budgeting** or **pm-budgeting-prod**).
4. If asked, you can disable Google Analytics for now (or enable it).
5. Click **Create project** and wait until it’s ready.

### Step 1.2 – Enable Authentication

1. In the left sidebar, open **Build → Authentication**.
2. Click **Get started**.
3. Open the **Sign-in method** tab.
4. Enable **Email/Password**: click it, turn **Enable** on, Save.
5. Enable **Google**: click it, turn **Enable** on, pick a support email, Save.

### Step 1.3 – Create a Firestore database

1. In the left sidebar, open **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** (we’ll deploy rules next).
4. Pick a location (e.g. `us-central1`) and confirm.

### Step 1.4 – Register the web app and get config

1. In **Project overview** (gear icon → Project settings), go to **Your apps**.
2. Click the **Web** icon (`</>`).
3. Register an app nickname (e.g. **PM Budgeting Web**).
4. Don’t enable Firebase Hosting for now.
5. Click **Register app**, then copy the `firebaseConfig` object. It looks like:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

6. In your project folder, copy `.env.example` to `.env.local` and fill in **only** the Firebase variables from that config:

- `VITE_FIREBASE_API_KEY` = `apiKey`
- `VITE_FIREBASE_AUTH_DOMAIN` = `authDomain`
- `VITE_FIREBASE_PROJECT_ID` = `projectId`
- `VITE_FIREBASE_STORAGE_BUCKET` = `storageBucket`
- `VITE_FIREBASE_MESSAGING_SENDER_ID` = `messagingSenderId`
- `VITE_FIREBASE_APP_ID` = `appId`

Save `.env.local`. You can add `VITE_ADMIN_UIDS` later.

---

## Part 2: Deploy Firestore rules and indexes (you do this in the terminal)

The repo is already set up so the Firebase CLI can deploy the same rules and indexes used by the app.

### Step 2.1 – Install Firebase CLI and log in

```bash
npm install -g firebase-tools
firebase login
```

Use the browser to sign in with your Google account.

### Step 2.2 – Select your Firebase project

From the **PM Budgeting Tool** project root:

```bash
firebase use --add
```

- Choose the project you created (e.g. **PM Budgeting**).
- When asked for an alias, press Enter to use **default** (or type e.g. `prod`).

This creates or updates `.firebaserc` with your project ID.

### Step 2.3 – Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore
```

You should see:

- `firestore: released rules`
- `firestore: released indexes`

If the CLI says indexes need to be created in the Console, open the link it gives you and create the composite indexes there (Firebase will suggest them from `firestore.indexes.json`). Then run `firebase deploy --only firestore` again if needed.

---

## You’re done with Firebase

- **Auth:** Email/Password and Google are on; users can sign up and sign in.
- **Firestore:** Database is created; rules and indexes are deployed so the app can read/write only its own data.
- **App config:** `.env.local` has your Firebase config for local runs. For Vercel, you’ll add the same `VITE_FIREBASE_*` variables in the Vercel project (see [Vercel setup](VERCEL_SETUP.md)).

Next: [Vercel setup](VERCEL_SETUP.md) to deploy the app.
