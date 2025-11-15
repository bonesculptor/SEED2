# How to Log In - Quick Guide

## Step 1: Start the Application

```bash
npm run dev
```

Open your browser to: **http://localhost:5173/**

## Step 2: You'll See the Login Screen

```
┌──────────────────────────────────────────────┐
│                                              │
│              [Blue Circle Icon]              │
│        Digital Twin Dashboard                │
│   Sign in to access your medical records    │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Email Address                          │ │
│  │ [📧] you@example.com                   │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Password                               │ │
│  │ [🔒] Enter your password               │ │
│  └────────────────────────────────────────┘ │
│                                              │
│       [🔐 Sign In Button]                    │
│                                              │
│    Don't have an account? Sign up            │
│                                              │
└──────────────────────────────────────────────┘
```

## Step 3: Create a New Account (First Time)

1. **Click** "Don't have an account? Sign up"
2. The form switches to Sign Up mode
3. **Enter**:
   - Your email address (e.g., `test@example.com`)
   - Password (at least 6 characters)
   - Confirm password (must match)
4. **Click** "Create Account"

You'll see: ✅ **"Account created! You can now sign in."**

The form automatically switches back to Sign In mode after 2 seconds.

## Step 4: Sign In

1. **Enter**:
   - Your email address
   - Your password
2. **Click** "Sign In"

You'll see: ✅ **"Successfully signed in!"**

The dashboard loads automatically!

## Step 5: You're In!

You'll now see the full dashboard:

```
═══════════════════════════════════════════════════════════════
  Digital Twin Dashboard    [Import Data] [user@email] [Sign Out]
  Personal Health Record & Medical Graph Database
═══════════════════════════════════════════════════════════════
```

## Quick Demo Flow

### Complete First-Time Setup (1 minute)

```bash
# 1. Start the app
npm run dev

# 2. Open browser → http://localhost:5173/

# 3. Click "Sign up" link

# 4. Enter:
Email: demo@example.com
Password: demo123
Confirm: demo123

# 5. Click "Create Account"

# 6. Wait 2 seconds (auto-switches to sign in)

# 7. Enter same credentials and click "Sign In"

# 8. Click "Import Simon Grange Data"

# 9. Explore the dashboard!
```

## Sign Out

Click the **"Sign Out"** button in the top right corner anytime.

You'll return to the login screen.

## Features of the Login Screen

### Sign In Mode
- Email and password fields
- "Sign In" button
- Link to switch to Sign Up
- System status indicator

### Sign Up Mode
- Email field
- Password field (minimum 6 characters)
- Confirm password field
- "Create Account" button
- Link to switch to Sign In
- Password requirement hint

### Error Handling
The form shows helpful errors:
- ❌ "Email and password are required"
- ❌ "Passwords do not match"
- ❌ "Password must be at least 6 characters"
- ❌ Any authentication errors from Supabase

### Success Messages
- ✅ "Account created! You can now sign in."
- ✅ "Successfully signed in!"

### Loading States
- Shows spinner when processing
- Disables buttons to prevent double-submission
- "Processing..." text

## Security Features

Your login is protected by:
- ✅ **Supabase Authentication** - Industry-standard auth service
- ✅ **Encrypted passwords** - Never stored in plain text
- ✅ **Secure sessions** - JWT tokens with automatic refresh
- ✅ **Row Level Security** - Database access restricted to your data only
- ✅ **HTTPS** - Encrypted communication (in production)

## Troubleshooting

### "Authentication failed"
- Check your email and password are correct
- Make sure you've created an account first
- Try using the password reset feature (if implemented)

### Can't create account
- Email might already be registered
- Try signing in instead
- Check that passwords match
- Ensure password is at least 6 characters

### Dashboard doesn't load after login
- Check browser console for errors (F12)
- Verify Supabase connection in `.env` file
- Refresh the page

### Stuck on loading screen
- Check your internet connection
- Verify Supabase is accessible
- Look for errors in browser console

## What Happens Behind the Scenes

### When You Sign Up:
1. Email and password sent to Supabase
2. Supabase creates user account
3. Password encrypted and stored securely
4. Confirmation message shown
5. Form switches to sign in mode

### When You Sign In:
1. Credentials sent to Supabase
2. Supabase verifies password
3. JWT token generated
4. Session stored in browser
5. User redirected to dashboard
6. Dashboard loads your medical data

### When You Sign Out:
1. Session cleared from Supabase
2. Local storage cleared
3. User redirected to login
4. Dashboard data cleared from memory

## Testing Accounts

For testing, you can create multiple accounts:

```
Account 1:
Email: doctor@example.com
Password: doctor123

Account 2:
Email: patient@example.com
Password: patient123

Account 3:
Email: admin@example.com
Password: admin123
```

Each account has its own isolated data thanks to Row Level Security!

## Next Steps After Login

1. **Import Demo Data** - Click "Import Simon Grange Data"
2. **Explore Visualizations** - Try Graph, Timeline, and Galaxy views
3. **Click Nodes** - See detailed information
4. **Review Statistics** - Check the 6 cards at the top
5. **Add Your Own Data** - Use the parser for your medical letters

## Remember

- Your password must be **at least 6 characters**
- Each user sees **only their own data**
- You can **sign out anytime** using the button
- The dashboard is **fully functional** once logged in
- All data is stored **securely in Supabase**

## Quick Reference

| Action | Button/Link |
|--------|-------------|
| Create account | "Sign up" link |
| Sign in | "Sign In" button |
| Sign out | "Sign Out" button (top right) |
| Switch modes | Links at bottom of form |
| Import data | Green "Import" button (dashboard) |

You're all set! Log in and start exploring your digital twin medical records system! 🎉
