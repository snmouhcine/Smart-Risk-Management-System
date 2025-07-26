# 🚀 Comprehensive Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code pushed to GitHub
3. **Supabase Project**: Already configured and running
4. **Stripe Account**: With Payment Links configured

## Step 1: Prepare Environment Variables

Create a `.env.production` file with your production values:

```env
# Supabase Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Stripe Production (switch to live mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/live/your_link
```

## Step 2: Build Test

Test your production build locally:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview
```

Fix any build errors before proceeding.

## Step 3: Vercel Setup

### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

Follow the prompts:
- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project: `N`
- Project name: `smart-risk-management`
- Directory: `./` (current directory)
- Build Command: `npm run build`
- Output Directory: `dist`
- Development Command: `npm run dev`

### Option B: Deploy via GitHub Integration

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select "Import Git Repository"
4. Choose your GitHub repo
5. Configure:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

## Step 4: Configure Environment Variables in Vercel

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_STRIPE_PAYMENT_LINK`

**Important**: Add variables for all environments:
- Production
- Preview
- Development

## Step 5: Configure Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic)

## Step 6: Update Your Application URLs

### In Supabase:
1. Go to **Authentication** → **URL Configuration**
2. Add your Vercel URLs to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: 
     - `https://your-app.vercel.app/*`
     - `https://your-custom-domain.com/*` (if using custom domain)

### In Stripe:
1. Update Payment Link redirect URLs:
   - Success: `https://your-app.vercel.app/payment-success`
   - Cancel: `https://your-app.vercel.app/app`

2. Add domain to Stripe's allowed domains

## Step 7: Deploy Production

```bash
# Deploy to production
vercel --prod
```

Or push to your main branch if using GitHub integration.

## Step 8: Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test payment flow
- [ ] Test admin access
- [ ] Check all environment variables are loaded
- [ ] Verify Supabase connection
- [ ] Verify Stripe integration
- [ ] Test on mobile devices

## Important Production Considerations

### 1. Re-enable RLS in Supabase

Run this SQL after webhooks are set up:
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Add proper RLS policies
CREATE POLICY "Users can read all profiles" 
ON user_profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);
```

### 2. Switch Stripe to Live Mode

1. Update environment variables to use live keys
2. Create live Payment Links
3. Update webhook endpoints

### 3. Set up Monitoring

1. Enable Vercel Analytics
2. Set up error tracking (Sentry)
3. Configure uptime monitoring

### 4. Security Headers

Add `vercel.json` to your project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Build Fails
- Check for TypeScript errors
- Ensure all imports are correct
- Verify environment variables

### Blank Page After Deploy
- Check browser console for errors
- Verify environment variables are set
- Check Network tab for failed requests

### Supabase Connection Issues
- Verify CORS settings in Supabase
- Check environment variables
- Ensure RLS policies aren't blocking requests

### Stripe Issues
- Verify redirect URLs are updated
- Check Payment Link configuration
- Ensure using correct keys (test vs live)

## Useful Commands

```bash
# View deployment logs
vercel logs

# List all deployments
vercel list

# Rollback to previous deployment
vercel rollback

# Remove a deployment
vercel remove [deployment-url]
```

## Next Steps After Deployment

1. **Set up Stripe Webhooks** for automatic subscription updates
2. **Enable Supabase Edge Functions** for secure payment processing
3. **Configure email templates** in Supabase
4. **Set up backup strategy** for your database
5. **Implement logging and monitoring**

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Status Page: [vercel-status.com](https://www.vercel-status.com/)

---

🎉 **Congratulations!** Your Smart Risk Management app is now live on Vercel!