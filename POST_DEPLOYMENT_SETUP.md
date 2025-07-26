# 🚀 Post-Deployment Setup Guide

This guide covers essential setup steps after your initial Vercel deployment.

## 1. Set up Stripe Webhooks

Webhooks ensure automatic subscription updates when payments are processed.

### Step 1: Deploy the Webhook Edge Function

First, ensure your Edge Functions are deployed:

```bash
cd supabase/functions
supabase functions deploy stripe-webhook
```

### Step 2: Get Your Webhook Endpoint URL

Your webhook endpoint will be:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook
```

### Step 3: Configure Webhook in Stripe

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Step 4: Get Webhook Secret

1. After creating the webhook, click on it
2. Copy the "Signing secret" (starts with `whsec_`)
3. Add to Supabase Edge Function secrets:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key
```

### Step 5: Update Edge Function Environment

Edit `supabase/functions/stripe-webhook/index.ts` if needed and redeploy.

## 2. Deploy All Supabase Edge Functions

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook

# Set required secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### Update Your App

Update `PaymentSuccessAutomatic.jsx` to use Edge Functions instead of direct DB updates:

```javascript
// Replace direct update with Edge Function call
const { data, error } = await supabase.functions.invoke('confirm-payment', {
  body: { 
    sessionId: searchParams.get('session_id'),
    userEmail: user.email 
  }
})
```

## 3. Configure Email Templates in Supabase

### Step 1: Access Email Templates

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Customize Templates

#### Welcome Email (Confirm Signup)
```html
<h2>Bienvenue sur Smart Risk Management! 🎉</h2>
<p>Bonjour,</p>
<p>Merci de vous être inscrit. Veuillez confirmer votre email en cliquant sur le lien ci-dessous:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
<p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
<p>Cordialement,<br>L'équipe Smart Risk Management</p>
```

#### Password Reset
```html
<h2>Réinitialisation de mot de passe</h2>
<p>Bonjour,</p>
<p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous:</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Ce lien expire dans 1 heure.</p>
<p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
<p>Cordialement,<br>L'équipe Smart Risk Management</p>
```

### Step 3: Configure SMTP (Optional)

For custom domain emails:
1. Go to **Settings** → **SMTP**
2. Configure with your email provider (SendGrid, Mailgun, etc.)

## 4. Set up Database Backup Strategy

### Option A: Automated Daily Backups (Recommended)

Supabase Pro plan includes automated daily backups. For manual backups:

### Option B: Manual Backup Script

Create `backup-database.sh`:

```bash
#!/bin/bash
# Database backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# Set your connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"

# Create backup
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Upload to cloud storage (example with AWS S3)
# aws s3 cp "${BACKUP_FILE}.gz" s3://your-backup-bucket/

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Option C: Use Supabase CLI

```bash
# Export data
supabase db dump -f backup.sql

# Restore data (if needed)
supabase db restore -f backup.sql
```

### Schedule Automated Backups

Use GitHub Actions for automated backups:

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
      
      - name: Backup Database
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: |
          supabase link --project-ref $SUPABASE_PROJECT_ID
          supabase db dump -f backup.sql
          
      - name: Upload Backup
        uses: actions/upload-artifact@v3
        with:
          name: database-backup-${{ github.run_id }}
          path: backup.sql
          retention-days: 30
```

## 5. Implement Logging and Monitoring

### Option A: Vercel Analytics (Simple)

1. Go to Vercel Dashboard
2. Navigate to your project → **Analytics**
3. Enable Web Analytics (free tier available)

### Option B: Sentry for Error Tracking

1. Sign up at [sentry.io](https://sentry.io)
2. Install Sentry:

```bash
npm install @sentry/react
```

3. Initialize in `main.jsx`:

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Option C: Custom Logging with Supabase

Create a logs table:

```sql
CREATE TABLE app_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  level TEXT NOT NULL, -- 'info', 'warning', 'error'
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_logs_user_id ON app_logs(user_id);
CREATE INDEX idx_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX idx_logs_level ON app_logs(level);
```

Create a logging utility:

```javascript
// utils/logger.js
import { supabase } from '../lib/supabase'

export const logger = {
  async log(level, message, metadata = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.from('app_logs').insert({
        user_id: user?.id,
        level,
        message,
        metadata
      })
      
      // Also log to console in development
      if (import.meta.env.DEV) {
        console.log(`[${level.toUpperCase()}]`, message, metadata)
      }
    } catch (error) {
      console.error('Logging error:', error)
    }
  },
  
  info: (message, metadata) => logger.log('info', message, metadata),
  warning: (message, metadata) => logger.log('warning', message, metadata),
  error: (message, metadata) => logger.log('error', message, metadata),
}
```

### Option D: Monitor with Uptime Services

1. **Better Uptime** (free tier)
   - Sign up at [betteruptime.com](https://betteruptime.com)
   - Add your Vercel URL
   - Configure alerts

2. **Pingdom** or **UptimeRobot**
   - Similar setup process
   - Monitor critical endpoints

## 6. Production Security Checklist

### Re-enable RLS

Once webhooks are working, re-enable RLS:

```sql
-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist
CREATE POLICY "Users can view all profiles" 
ON user_profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Service role can do anything" 
ON user_profiles 
USING (auth.role() = 'service_role');
```

### Environment Variables

Ensure all production environment variables are set in Vercel:
- Remove any test keys
- Use production Stripe keys
- Secure all secrets

### CORS Configuration

Update Supabase CORS settings for your domain:
1. Go to **Settings** → **API**
2. Add your production domain to allowed origins

## 7. Testing Checklist

After implementing each feature:

- [ ] Test user registration with email confirmation
- [ ] Test password reset flow
- [ ] Test Stripe webhook updates subscription status
- [ ] Verify backups are being created
- [ ] Check error logging is working
- [ ] Monitor performance metrics
- [ ] Test on multiple devices/browsers

## Need Help?

- Stripe Webhooks: [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- Supabase Functions: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- Vercel Analytics: [vercel.com/docs/analytics](https://vercel.com/docs/analytics)

---

🎉 Your app is now production-ready with proper monitoring and automation!