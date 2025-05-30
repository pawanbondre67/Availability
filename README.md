

# 🚻 Washroom Availability App

The **Washroom Availability App** is a web application built with **React**, **TypeScript**, **Firebase**, and **Tailwind CSS** to manage washroom usage in a shared office environment. It enables users to check in to male or female washrooms, set a timer, and receive checkout prompts to ensure efficient and fair access.

---

## ✨ Features

### 🕒 Washroom Timer
- Check in to **male** or **female** washrooms.
- Timer options: **2, 5, 10, or 15 minutes** (default: 2 mins).
- Displays remaining time and status: **Occupied / Unoccupied**.

### ✅ Checkout Modal
- Prompts after **30 seconds** and **60 seconds** (max 2 prompts/session).
- Modal count stored in `localStorage` (e.g., `Prompt 1 of 2`).
- Shown only to the user who checked in (via `sessionId`).

### 🍽️ Lunch Break Lockout
- Washrooms are **unavailable from 1 PM to 2 PM** daily.
- Displays a **lunch break modal** during this time.

### 🔄 Real-Time Sync
- Uses **Firebase Realtime Database** for live updates.
- Syncs occupied status, timer, and session data across devices.

### 🎨 Attractive UI
- Styled with **Tailwind CSS**: gradients, shadows, rounded corners.
- SVG icons for modals (clock and lunch).
- Animations: modals **fade + slide**, buttons **scale on hover**, status **pulses**.

### 🔁 Reset on Check-In
- Each check-in resets timer and UI for a clean session.

### 📱 Responsive Design
- Optimized for both **desktop** and **mobile** using Tailwind responsive utilities.

---

## 🛠️ Tech Stack

| Layer      | Tools                                   |
|------------|------------------------------------------|
| Frontend   | React, TypeScript                        |
| Styling    | Tailwind CSS                             |
| Backend    | Firebase Realtime Database               |
| Build Tool | Vite                                     |
| Animations | Tailwind CSS Custom Keyframes            |
| Utils      | `firebase`, `uuid`                       |

---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/washroom-availability.git
cd washroom-availability
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Tailwind CSS Setup

Install Tailwind CSS:

```bash
npm install -D tailwindcss
npx tailwindcss init
```

Update `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'fade-slide-in': 'fade-slide-in 0.3s ease-out',
      },
      keyframes: {
        'fade-slide-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
```

Create `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Import in `src/main.tsx`:

```ts
import './index.css';
```

---

### 4. Firebase Setup

* Create a Firebase project at [Firebase Console](https://console.firebase.google.com).
* Enable **Realtime Database**.

Create `.env` in root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Set Firebase security rules for testing:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

#### For Production:

Enable anonymous authentication:

```ts
import { getAuth, signInAnonymously } from 'firebase/auth';
const auth = getAuth(app);
useEffect(() => {
  signInAnonymously(auth).catch(console.error);
}, []);
```

Update Firebase rules:

```json
{
  "rules": {
    "male": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "female": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

---

### 5. Run the App

```bash
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

### 6. Build for Production

```bash
npm run build
```

---

### 7. Deployment (Optional)

#### Firebase Hosting:

```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy --only hosting
```

#### Or use:

* [Vercel](https://vercel.com)
* [Netlify](https://netlify.com)
* `npx http-server dist` for local deployment

---

## 🚀 Usage

### ✅ Check-In

* Select duration (2, 5, 10, 15 minutes)
* Click **Check-In** → status becomes "Occupied"
* Timer starts with remaining time display

### ⏰ Checkout Prompt

* Prompts at **30s** and **60s** (max 2 prompts)
* Uses `localStorage` for `modalCount`
* "OK" → check out; "Cancel" → keep going

### 🕐 Lunch Break

* 1 PM to 2 PM → modal prevents Check-In

### 🔄 Reset

* Timer/UI reset on:

  * New check-in
  * Manual checkout
  * Timeout expiry

---

## 🧱 Project Structure

```
washroom-availability/
├── src/
│   ├── App.tsx              # Main app component
│   ├── WashroomTimer.tsx    # Timer and logic
│   ├── index.css            # Tailwind styles
│   ├── main.tsx             # App entry point
├── public/
│   ├── index.html
├── .env
├── tailwind.config.js
├── vite.config.ts
├── package.json
├── README.md
```

---

## 🗃️ Firebase Data Structure

```json
{
  "male": {
    "occupied": true,
    "endTime": 1740938375000,
    "startTime": 1740938255000,
    "prompted": true,
    "modalResponded": false,
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "female": {
    "occupied": false,
    "endTime": null,
    "startTime": null,
    "prompted": false,
    "modalResponded": false,
    "sessionId": null
  }
}
```

---

## 💾 Local Storage

* `${gender}-sessionId`: Unique session ID per gender/user
* `${gender}-modalCount`: Prompt count (0, 1, or 2)

---

## 🧪 Testing Checklist

* ✅ **UI**: Gradient backgrounds, rounded corners, shadows, icons
* ✅ **Animations**: Modals fade + slide, buttons hover scale
* ✅ **Modal Count**: Shows prompt at 30s/60s
* ✅ **Reset**: Re-check-in resets state
* ✅ **Lunch Break**: Test modal via system time
* ✅ **Sync**: Test on multiple devices

---

## ⚠️ Known Limitations

| Limitation             | Details                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `localStorage` Counter | Modal count is not synced across devices                               |
| Race Conditions        | Concurrent Check-Ins may overwrite data; use `runTransaction()`        |
| Security               | Public rules are insecure; enable auth for production                  |
| Modal Timing           | 30/60s prompts work best for short durations; adjust for longer timers |

Use Firebase transaction for safe updates:

```ts
import { runTransaction } from 'firebase/database';

const startTimer = (duration: number) => {
  const now = Date.now();
  const sessionId = uuidv4();
  localStorage.setItem(`${gender}-sessionId`, sessionId);
  localStorage.setItem(`${gender}-modalCount`, '0');
  runTransaction(ref(db, gender), () => ({
    occupied: true,
    endTime: now + duration * 1000,
    startTime: now,
    prompted: false,
    modalResponded: false,
    sessionId,
  }));
};
```

---

## 🧑‍💻 Contributing

1. Fork the repo
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

Licensed under the [MIT License](LICENSE)

---
## Contact

For any questions or feedback, please contact:
- **Email**: pawanbondre19@gmail.com
- **GitHub**: [pawanbondre](https://github.com/pawanbondre67)
---

