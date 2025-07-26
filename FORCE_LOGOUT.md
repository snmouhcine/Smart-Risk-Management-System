# Force Logout from Console

## Quick Solution

Open your browser console (F12) and run these commands:

```javascript
// Method 1: Direct logout
const { supabase } = await import('./src/lib/supabase.js')
await supabase.auth.signOut()
localStorage.clear()
sessionStorage.clear()
window.location.href = '/'
```

## If that doesn't work, try:

```javascript
// Method 2: Clear everything manually
localStorage.clear()
sessionStorage.clear()
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
})
window.location.href = '/'
```

## Nuclear Option (clears EVERYTHING):

1. Open Chrome DevTools (F12)
2. Go to Application tab
3. On the left sidebar, find "Storage"
4. Click "Clear site data"
5. Refresh the page

## Alternative: Incognito Mode

Just open an incognito/private window to start fresh without any stored sessions.

After logging out, you should be able to access `/auth` directly.