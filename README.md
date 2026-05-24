<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/77f96820-f2f6-47dc-be85-ff5a5b58b155

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

Deploy the web app as a Vite SPA:

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

The existing `vercel.json` rewrites all routes to `index.html`, so direct links such as `/registration` can refresh correctly on Vercel.

## User Login and Admin Setup

Mini HIS now uses Username/Password login. The first Admin account is created from the login page with the button `สร้าง Admin เริ่มต้น`.

Default bootstrap account:

- Username: `Admin`
- Password: `Clinic`

After the first login, the system forces the Admin to change the password before using the app. Once logged in as Admin, open `จัดการผู้ใช้งาน` to create users for each role: Admin, Register, Nurse, Doctor, Cashier, Stock, and Report.

Vercel Admin API endpoints use Firebase Admin SDK. Set these environment variables in Vercel before using bootstrap or user management:

- `FIREBASE_SERVICE_ACCOUNT_JSON` as the full Firebase service account JSON, or
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- Optional: `FIREBASE_FIRESTORE_DATABASE_ID` if different from `firebase-applet-config.json`

Deploy Firestore rules separately after changes:

```powershell
firebase deploy --only firestore:rules
```

## Thai ID Card Reader on Each Computer

The Vercel web app cannot access a smart card reader directly. On each Windows computer that needs to read Thai ID cards, copy only the `reader-service/` folder and install that small local service.

1. Install the smart card reader driver and ensure the Windows Smart Card service is running.
2. Install Visual Studio C++ Build Tools if native dependencies need rebuilding.
3. Copy the `reader-service/` folder to that computer.
4. Open `reader-service/` and run `install.bat`.
5. Run `start.bat`.

The reader service runs on `http://127.0.0.1:32123` and the web app calls:

`http://127.0.0.1:32123/api/thai-id-card/read`

Health check:

`http://127.0.0.1:32123/api/health`

The default `start.bat` already allows:

`https://mini-his.vercel.app`

When using another Vercel/custom domain, edit `reader-service/start.bat` or allow that origin before starting the reader service:

```powershell
$env:THAI_ID_CARD_ALLOWED_ORIGINS="https://mini-his.vercel.app,https://your-domain.example"
cd reader-service
npm.cmd run reader
```

For a different local reader URL, build the web app with:

```powershell
$env:VITE_THAI_ID_CARD_READER_URL="http://127.0.0.1:32123/api/thai-id-card/read"
npm run build
```

## Maintenance Checklist

Before deploying:

```powershell
npm.cmd run lint
npm.cmd run build
```

Recommended daily checks:

- Confirm the web app version shown in Data Management matches the deployed build.
- Confirm each reader computer returns `ok: true` and the expected version from `/api/health`.
- Export Audit Log from Data Management when reviewing deleted patients, voided visits, stock edits, dose edits, OPD layout changes, or system reset events.
- Use the date/status/vaccine filters in Data Management before exporting Excel reports.

Operational notes:

- Dispensing updates visit status and vaccine stock in one Firestore transaction, so the visit should not move to injection if stock cannot be reduced.
- Keep Firebase Security Rules restrictive in production. UI-level buttons are convenience controls, not a replacement for server-side rules.
- `firestore.rules.example` contains a role-based starter policy using custom claims (`admin`, `register`, `nurse`, `doctor`, `cashier`, `stock`); review it before deploying rules to avoid blocking current users.
- Back up Firestore before using Factory Reset or bulk corrections.
