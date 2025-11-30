# Quick Deployment Checklist for Vercel

## ✅ Pre-Deployment (Do This First!)

### 1. Code is Ready
- [x] Build passes (`npm run build`)
- [x] All API routes updated for serverless (using Vercel Blob instead of filesystem)
- [x] Code committed to Git

### 2. Environment Variables to Set in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these **6 required variables**:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_STREAM_API_KEY=your_stream_key
STREAM_SECRET_KEY=your_stream_secret
```

### 3. Configure Clerk

1. Go to [clerk.com](https://clerk.com) dashboard
2. Your App → **Domains**
3. Add your Vercel domain: `your-app.vercel.app`
4. **Allowed Redirect URLs** - Add:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/sign-in`
   - `https://your-app.vercel.app/sign-up`

### 4. Configure Stream.io

1. Go to [getstream.io](https://getstream.io) dashboard
2. Your App → **Settings**
3. Add your Vercel domain to allowed origins

## 🚀 Deploy Steps

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Vercel auto-detects Next.js - click **"Deploy"**
5. **Wait 2-5 minutes** for build to complete
6. Your app is live! 🎉

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No (first time) or Yes
# - Project name? (press enter for default)
# - Directory? ./ (press enter)
# - Override settings? No (press enter)
```

## ✅ Post-Deployment

### Test These Features:

- [ ] Sign up / Sign in works
- [ ] Create a new meeting
- [ ] Join a meeting
- [ ] Video/audio works
- [ ] Download PDF report

### If Something Breaks:

1. **Check Vercel Logs**: Dashboard → Your Project → **Logs** tab
2. **Check Function Logs**: Dashboard → Your Project → **Functions** tab
3. **Verify Environment Variables**: Settings → Environment Variables
4. **Check Build Logs**: Deployments → Click latest deployment → View build logs

## 🔧 Common Issues

### "Blob not found" error
- Make sure `BLOB_READ_WRITE_TOKEN` is set correctly
- Verify Blob store is created in Vercel

### Authentication not working
- Check Clerk domain settings
- Verify redirect URLs are correct
- Check environment variables are set

### Video not working
- Verify Stream.io API keys
- Check domain is allowed in Stream.io dashboard

## 📝 Notes

- **First deployment**: Takes 2-5 minutes
- **Subsequent deployments**: Usually 1-2 minutes
- **Environment variables**: Must be set in Vercel, not in `.env` file
- **Blob storage**: Automatically handles file persistence (no filesystem needed)

## 🎯 You're Done!

Once deployed, share your Vercel URL with your team/teacher!

