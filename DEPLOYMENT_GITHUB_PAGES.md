# GitHub Pages Deployment Guide

This guide covers deploying the YSA GP Attendance System React app to GitHub Pages.

## Prerequisites

- GitHub account with repository `JamesHD001/GP`
- Repository push access
- Firebase project configured (Auth + Firestore)
- Node.js 18+ installed locally

## Setup Steps

### 1. Configure GitHub Pages in Repository Settings

1. Go to `https://github.com/JamesHD001/GP/settings/pages`
2. **Source:** Select "GitHub Actions"
3. Save settings

### 2. Add Firebase Credentials to GitHub Secrets

1. Go to `https://github.com/JamesHD001/GP/settings/secrets/actions`
2. Click "New repository secret"
3. Add each credential:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `FIREBASE_API_KEY` | From Firebase Console | Project Settings > Your Apps |
| `FIREBASE_AUTH_DOMAIN` | e.g., `my-project.firebaseapp.com` | Project Settings |
| `FIREBASE_PROJECT_ID` | Your project ID | Project Settings |
| `FIREBASE_STORAGE_BUCKET` | e.g., `my-project.appspot.com` | Project Settings |
| `FIREBASE_MESSAGING_SENDER_ID` | Sender ID | Project Settings |
| `FIREBASE_APP_ID` | App ID | Project Settings |

### 3. Local Development Setup

```bash
# Clone repository
git clone https://github.com/JamesHD001/GP.git
cd GP

# Copy environment template
cp .env.example .env.local

# Edit .env.local and fill in Firebase credentials
nano .env.local  # or your editor

# Install dependencies
npm install

# Start development server
npm start
```

This runs at `http://localhost:3000`

### 4. Test Build Locally

```bash
# Create production build
npm run build

# Test build with serve (optional)
npm install -g serve
serve -s build
```

Build output is in `build/` directory. Open browser to `http://localhost:3000/#/login`

### 5. Deploy to GitHub Pages

The workflow deploys automatically on every push to `main`:

```bash
# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to trigger deployment
git push origin main
```

**GitHub Actions will:**

1. Checkout code
2. Install dependencies
3. Build production app (`npm run build`)
4. Deploy `build/` to GitHub Pages
5. Available at `https://jameShd001.github.io/GP`

Check deployment status: `https://github.com/JamesHD001/GP/actions`

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│  src/ (React Components + Services)     │
│  - App.jsx uses HashRouter              │
│  - Firebase SDK connects to backend      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Build Process (npm run build)          │
│  - Generates static HTML + JS in build/ │
│  - Includes 404.html for SPA routing    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  GitHub Actions Workflow                │
│  - Runs on: push to main                │
│  - Uses secrets for Firebase creds      │
│  - Deploys build/ via gh-pages          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  GitHub Pages (Static Host)             │
│  - Serves from gh-pages branch          │
│  - URL: jameShd001.github.io/GP         │
│  - 404.html catches route misses        │
│  - HashRouter handles client routing    │
└─────────────────────────────────────────┘
```

## URL Structure

- **Root:** `https://jameShd001.github.io/GP/#/`
- **Login:** `https://jameShd001.github.io/GP/#/login`
- **Admin Dashboard:** `https://jameShd001.github.io/GP/#/admin`
- **Instructor Dashboard:** `https://jameShd001.github.io/GP/#/instructor`
- **Leader Dashboard:** `https://jameShd001.github.io/GP/#/leader`

Note: URLs use hash routing (`/#/`) to work on static hosting.

## Routing & SPA Behavior

The app uses **HashRouter** instead of BrowserRouter:
- ✅ Works on static hosting (no server-side routing needed)
- ✅ All routes prefixed with `/#/`
- ✅ Page refreshes stay within app
- ✅ 404.html redirects unknown paths to app

**Example:**
```
User types: https://jameShd001.github.io/GP/attendance
→ GitHub Pages serves 404.html
→ 404.html redirects to /?/attendance
→ React Router loads (with #/ prefix)
→ App navigates to correct route
```

## Troubleshooting

### Issue: "Cannot find module 'react'"
**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build fails with Firebase errors
**Fix:** Ensure all secrets are set in GitHub Actions Secrets (not .env.example)

### Issue: App loads but shows "Page not found"
**Fix:** 
- Clear browser cache
- Ensure HashRouter is used in App.jsx
- Check that routes are defined in routeConfig.js

### Issue: Login redirects to root loop
**Fix:** 
- Clear browser localStorage: F12 > Application > Clear All
- Ensure .env.local has correct Firebase credentials

### Issue: Delayed deployment
**Check:** `https://github.com/JamesHD001/GP/actions`
- View workflow run logs
- Look for build or deploy errors

## Manual GitHub Pages Deployment (Alternative)

If using `gh-pages` npm script locally:

```bash
# Install gh-pages package (already in package.json)
npm install gh-pages --save-dev

# Build and deploy
npm run deploy
```

This pushes `build/` to `gh-pages` branch (simpler than Actions).

## Production Checklist

- [ ] Firebase project created and configured
- [ ] Firebase credentials added to GitHub Secrets
- [ ] .env.example updated (without real values)
- [ ] App.jsx uses HashRouter ✅
- [ ] public/404.html exists ✅
- [ ] package.json has "homepage": "https://jameShd001.github.io/GP" ✅
- [ ] GitHub Pages set to deploy from "GitHub Actions"
- [ ] First push to main triggers deployment
- [ ] App accessible at `https://jameShd001.github.io/GP/#/`

## Continuous Deployment

On every push to `main`:
1. Workflow runs automatically
2. Dependencies installed
3. Build generated (with Firebase env vars)
4. Deployed to gh-pages branch
5. Live within ~30 seconds

No manual deployment needed!

## Contact & Support

For issues: Check GitHub Actions logs or Firebase Console for errors.

---

Ready to deploy!  
`git push origin main` 🚀
