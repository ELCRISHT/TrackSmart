# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket Account**: Your code needs to be in a Git repository
3. **Environment Variables**: Prepare all required API keys

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Vercel will auto-detect Next.js

### 3. Configure Environment Variables

In the Vercel project settings, add these environment variables:

#### Required Variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret_key
```

### 4. Configure Clerk for Production

Update your Clerk dashboard settings:

1. Go to [clerk.com](https://clerk.com) dashboard
2. Navigate to **"Domains"** in your application settings
3. Add your Vercel domain (e.g., `your-app.vercel.app`)
4. Update **"Allowed Redirect URLs"**:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/sign-in`
   - `https://your-app.vercel.app/sign-up`

### 5. Configure Stream.io for Production

1. Go to [getstream.io](https://getstream.io) dashboard
2. Navigate to your application settings
3. Add your Vercel domain to allowed origins
4. Ensure webhooks are configured if needed

### 6. Deploy

1. Click **"Deploy"** in Vercel
2. Wait for the build to complete
3. Your app will be live at `https://your-app.vercel.app`

### 7. Custom Domain (Optional)

1. In Vercel project settings, go to **"Domains"**
2. Add your custom domain
3. Follow DNS configuration instructions

## Post-Deployment Checklist

- [ ] Test authentication (sign in/sign up)
- [ ] Test video meeting creation
- [ ] Test PDF report generation
- [ ] Verify all environment variables are set
- [ ] Check Vercel function logs for errors
- [ ] Test on mobile devices

## Troubleshooting

### Build Errors

- Check Vercel build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Runtime Errors

- Check Vercel function logs
- Verify environment variables are set correctly
- Ensure API keys are valid

### Blob Storage Issues

- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Blob store is created in Vercel dashboard
- Ensure blob operations have proper error handling

## Important Notes

- **File Storage**: The app now uses Vercel Blob Storage instead of filesystem (required for serverless)
- **Serverless Functions**: All API routes run as serverless functions
- **Environment Variables**: Must be set in Vercel dashboard, not in `.env` file
- **Build Time**: First deployment may take 2-5 minutes

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review environment variables
3. Verify API credentials are correct
4. Check Clerk and Stream.io dashboard configurations

