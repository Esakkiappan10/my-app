# 🚀 Deployment Guide

## Backend Deployment (Vercel)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
cd d:\my-app\my-app
vercel
```

Follow the prompts:
- Link to existing project? **No**
- Project name: **autonomous-agent-api**
- Which directory? **./api**

### Step 4: Get Your Deployment URL
After deployment, you'll get a URL like: `https://autonomous-agent-api.vercel.app`

### Step 5: Update App API URL
Edit `src/api/agentApi.ts`:
```typescript
const IS_PRODUCTION = true; // Change to true
const VERCEL_URL = 'https://your-actual-vercel-url.vercel.app';
```

---

## Mobile App Build (EAS)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure Project
```bash
eas build:configure
```
This will update `app.json` with your project ID.

### Step 4: Update app.json
Replace placeholders in `app.json`:
- `"owner": "your-expo-username"` → Your Expo username
- `"projectId": "your-eas-project-id"` → Auto-filled by EAS
- `"com.yourname.autonomousagent"` → Your bundle identifier

### Step 5: Build Android APK
```bash
eas build -p android --profile preview
```
This creates an APK you can install directly on your phone.

### Step 6: Download & Install
After build completes (~10-15 min), download the APK from:
- The link in your terminal, OR
- expo.dev → Your project → Builds

Transfer to your phone and install!

### Step 7: Build iOS (Optional)
```bash
# For simulator testing (no Apple Developer account needed)
eas build -p ios --profile preview

# For real device (requires Apple Developer account $99/year)
eas build -p ios --profile production
```

---

## ⚠️ Important Notes

### Vercel Limitations
1. **No WebSocket support** - App uses polling instead
2. **10-second timeout** on free tier - Tasks may timeout
3. **Stateless functions** - Tasks don't persist between cold starts

### Recommended: Use Railway Instead
For better reliability, deploy to Railway.app:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```
Railway supports WebSockets and has no timeout limits on the free tier.

---

## Quick Commands Reference

```bash
# Vercel
vercel                    # Deploy
vercel --prod             # Deploy to production
vercel logs               # View logs

# EAS Build
eas build -p android      # Build Android
eas build -p ios          # Build iOS
eas build --list          # List builds
eas submit                # Submit to app stores

# Local Testing
npm run start             # Start Expo
npm run android           # Run on Android
npm run ios               # Run on iOS
```
