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

## Thai ID Card Reader on Each Computer

The Vercel web app cannot access a smart card reader directly. On each Windows computer that needs to read Thai ID cards:

1. Install the smart card reader driver and ensure the Windows Smart Card service is running.
2. Install Visual Studio C++ Build Tools if native dependencies need rebuilding.
3. Install project dependencies:
   `npm install`
4. Rebuild the native reader dependency if needed:
   `npm rebuild pcsclite`
5. Start the local reader service:
   `npm run reader`

The reader service runs on `http://127.0.0.1:32123` and the web app calls:

`http://127.0.0.1:32123/api/thai-id-card/read`

When using a deployed Vercel/custom domain, allow that origin before starting the reader service:

```powershell
$env:THAI_ID_CARD_ALLOWED_ORIGINS="https://your-project.vercel.app,https://your-domain.example"
npm run reader
```

For a different local reader URL, build the web app with:

```powershell
$env:VITE_THAI_ID_CARD_READER_URL="http://127.0.0.1:32123/api/thai-id-card/read"
npm run build
```
