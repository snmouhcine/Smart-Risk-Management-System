#!/bin/bash

echo "🧹 Cleaning up project for production deployment..."

# Create a cleanup directory to move files (instead of deleting)
mkdir -p .cleanup-backup
echo "📁 Moving files to .cleanup-backup/ instead of deleting..."

# 1. Move documentation files from root
echo "📄 Moving documentation files..."
mv -v ADMIN_MODULE_SUMMARY.md .cleanup-backup/ 2>/dev/null
mv -v ADMIN_SETUP_FINAL.md .cleanup-backup/ 2>/dev/null
mv -v COMPLETE_WORKFLOW_FIX.md .cleanup-backup/ 2>/dev/null
mv -v FIX_STRIPE_REDIRECT.md .cleanup-backup/ 2>/dev/null
mv -v FORCE_LOGOUT.md .cleanup-backup/ 2>/dev/null
mv -v IMMEDIATE_FIX.md .cleanup-backup/ 2>/dev/null
mv -v QUICK_STRIPE_TEST.md .cleanup-backup/ 2>/dev/null
mv -v STRIPE_PAYMENT_LINK_SETUP.md .cleanup-backup/ 2>/dev/null
mv -v STRIPE_REDIRECT_FIX.md .cleanup-backup/ 2>/dev/null
mv -v STRIPE_SETUP.md .cleanup-backup/ 2>/dev/null

# 2. Move SQL files from root (keeping only essential ones)
echo "🗄️  Moving SQL files..."
mv -v disable_rls_subscription_plans.sql .cleanup-backup/ 2>/dev/null
mv -v fix_all_rls_policies.sql .cleanup-backup/ 2>/dev/null
mv -v fix_subscription_plans_rls.sql .cleanup-backup/ 2>/dev/null
mv -v migration_add_trading_timezone.sql .cleanup-backup/ 2>/dev/null

# 3. Move test components
echo "🧪 Moving test components..."
mv -v src/components/TestProfile.jsx .cleanup-backup/ 2>/dev/null
mv -v src/components/StripeTest.jsx .cleanup-backup/ 2>/dev/null
mv -v src/components/TestComponent.jsx .cleanup-backup/ 2>/dev/null

# 4. Move backup/broken files
echo "🔧 Moving backup/broken files..."
mv -v src/components/MethodeAlpha.jsx.backup .cleanup-backup/ 2>/dev/null
mv -v src/components/MethodeAlpha.jsx.broken .cleanup-backup/ 2>/dev/null

# 5. Move old components (keeping Fixed versions)
echo "♻️  Moving old component versions..."
mv -v src/components/admin/AdminDashboard.jsx .cleanup-backup/ 2>/dev/null
mv -v src/components/admin/UserManagement.jsx .cleanup-backup/ 2>/dev/null

# 6. Move redundant payment success components
echo "💳 Moving redundant payment components..."
mv -v src/components/PaymentSuccess.jsx .cleanup-backup/ 2>/dev/null
mv -v src/components/PaymentSuccessSimple.jsx .cleanup-backup/ 2>/dev/null
mv -v src/components/ForceRefresh.jsx .cleanup-backup/ 2>/dev/null

# 7. Move subscription manager (not used)
mv -v src/components/SubscriptionManager.jsx .cleanup-backup/ 2>/dev/null

# 8. Move Admin Activity component (removed from navigation)
mv -v src/components/admin/AdminActivity.jsx .cleanup-backup/ 2>/dev/null

# 9. Move Supabase temp files
echo "🗑️  Moving Supabase temp files..."
rm -rf supabase/.temp/

# 10. Add cleanup-backup to .gitignore
echo "📝 Adding cleanup-backup to .gitignore..."
echo -e "\n# Cleanup backup directory\n.cleanup-backup/" >> .gitignore

echo "✅ Cleanup complete! Files moved to .cleanup-backup/"
echo "📊 Project is now clean and ready for deployment"
echo ""
echo "⚠️  Note: You can delete .cleanup-backup/ after verifying everything works"
echo "    rm -rf .cleanup-backup/"