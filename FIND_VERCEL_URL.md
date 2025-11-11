# How to Find Your Vercel App URL

## Quick Answer

Your Vercel app URL is displayed in multiple places:

### Option 1: Vercel Dashboard (Easiest)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project (`evi-check` or whatever you named it)
3. **The URL is shown at the top** of the project page
   - Format: `https://your-project-name.vercel.app`
   - Or: `https://your-project-name-xyz123.vercel.app`

### Option 2: Deployment Page

1. In your project dashboard
2. Go to **"Deployments"** tab
3. Click on the latest deployment
4. The URL is shown at the top: **"Visit"** button or the URL itself

### Option 3: Settings → Domains

1. Go to your project → **Settings**
2. Click **"Domains"** in the sidebar
3. Your default Vercel domain is listed there
   - Usually: `your-project-name.vercel.app`

## Example URLs

Your Vercel URL will look like one of these:
- `https://evi-check.vercel.app`
- `https://evi-check-frontend.vercel.app`
- `https://evi-check-abc123.vercel.app` (if name was taken)

## How to Set NEXT_PUBLIC_APP_URL

1. **Copy your Vercel URL** (from any method above)

2. **Go to Vercel Dashboard:**
   - Your Project → **Settings** → **Environment Variables**

3. **Add or Update:**
   ```
   NEXT_PUBLIC_APP_URL = https://your-actual-vercel-url.vercel.app
   ```

4. **Important:** 
   - Use the **exact URL** (with `https://`)
   - **No trailing slash**
   - Make sure it's set for **Production** environment

5. **Redeploy** (or it will auto-update on next push)

## Visual Guide

```
Vercel Dashboard
└── Your Project
    ├── [URL shown here at top] ← This is your NEXT_PUBLIC_APP_URL
    ├── Deployments
    │   └── Latest Deployment
    │       └── [Visit button with URL]
    └── Settings
        └── Domains
            └── [Default domain listed]
```

## Quick Check

To verify you have the right URL:
1. Visit the URL in your browser
2. You should see your application
3. That's your `NEXT_PUBLIC_APP_URL`!

