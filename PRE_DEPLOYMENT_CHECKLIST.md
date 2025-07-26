# ✅ Pre-Deployment Checklist

Before deploying to Vercel, ensure you've completed these steps:

## Environment Setup
- [ ] Created `.env.production` with production values
- [ ] Tested build locally with `npm run build`
- [ ] No build errors or warnings
- [ ] Verified all environment variables are set

## Supabase Configuration
- [ ] Production Supabase project is set up
- [ ] Database migrations have been run
- [ ] RLS is temporarily disabled on `user_profiles` (re-enable after webhooks)
- [ ] Authentication providers are configured
- [ ] Database has proper indexes for performance

## Stripe Configuration
- [ ] Payment Links created in Stripe Dashboard
- [ ] Redirect URLs will be updated after deployment
- [ ] Have both test and live API keys ready
- [ ] Customer Portal is configured

## Code Quality
- [ ] Removed all console.log statements from production code
- [ ] No hardcoded sensitive data
- [ ] All test components have been removed
- [ ] Build size is reasonable (< 1MB for JS bundle)

## Testing
- [ ] User registration works
- [ ] Login/logout works
- [ ] Payment flow works (in test mode)
- [ ] Admin panel access works
- [ ] Mobile responsive design tested

## Security
- [ ] Environment variables are not exposed in code
- [ ] API keys are server-side only (except public keys)
- [ ] CORS is properly configured in Supabase
- [ ] Security headers configured in vercel.json

## Documentation
- [ ] README is updated
- [ ] Environment variables are documented
- [ ] Deployment process is documented

## Ready to Deploy? 🚀

If all items are checked, you're ready to deploy to Vercel!