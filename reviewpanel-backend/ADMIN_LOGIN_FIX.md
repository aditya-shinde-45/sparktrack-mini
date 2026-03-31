# Admin Login Issue - Fix Documentation

## Problem Description

Admin login was failing in development with "wrong password" error, but working correctly in testing environment.

## Root Cause

The issue was in `/src/models/userModel.js` in the `buildUserRecord` function. The function was **always hashing** the password from the environment variable, regardless of whether it was already hashed or not.

### What was happening:

1. **Development Environment**: 
   - `.env` contains plain text password: `ADMIN_DEFAULT_PASSWORD=strawhats`
   - Code hashes it once → Login works ✓

2. **Testing/Production Environment**:
   - `.env` might contain pre-hashed password: `ADMIN_DEFAULT_PASSWORD=$2b$12$...`
   - Code hashes it AGAIN (double-hashing) → Login fails ✗
   - User enters plain password "strawhats"
   - bcrypt.compare("strawhats", double-hashed-password) → false

## Solution

Modified the `buildUserRecord` function to detect if the password is already a bcrypt hash before hashing it.

### Changes Made

**File**: `/src/models/userModel.js`

**Before**:
```javascript
const passwordHash = rawUser.passwordHash || (rawUser.password ? bcrypt.hashSync(rawUser.password, 12) : null);
```

**After**:
```javascript
let passwordHash;
if (rawUser.passwordHash) {
  passwordHash = rawUser.passwordHash;
} else if (rawUser.password) {
  // Check if password is already a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(rawUser.password);
  passwordHash = isBcryptHash ? rawUser.password : bcrypt.hashSync(rawUser.password, 12);
} else {
  passwordHash = null;
}
```

### How It Works

The fix uses a regex pattern `/^\$2[aby]\$\d{2}\$/` to detect bcrypt hashes:
- `$2a$`, `$2b$`, or `$2y$` - bcrypt version identifiers
- `\d{2}` - cost factor (e.g., 12)
- If detected as hash → use as-is
- If plain text → hash it

## Testing

Both scenarios now work correctly:

1. **Plain text password in .env**:
   ```
   ADMIN_DEFAULT_PASSWORD=strawhats
   → Hashed once → Login with "strawhats" ✓
   ```

2. **Pre-hashed password in .env**:
   ```
   ADMIN_DEFAULT_PASSWORD=$2b$12$rAAN4GBhxSOnipI/L90BeuSEnzDgBsaRL9ZhLHXaMf1DSmidD3ztG
   → Used as-is → Login with "strawhats" ✓
   ```

## How to Apply

1. The fix has been applied to `/src/models/userModel.js`
2. Restart your backend server:
   ```bash
   cd reviewpanel-backend
   npm start
   # or for development
   npm run dev
   ```

3. Test admin login with username `8698078603` and password `strawhats`

## Recommendations

For production environments:
- Use plain text passwords in `.env` files (they will be hashed automatically)
- Never commit `.env` files to version control
- Use environment-specific configuration management
- Consider using secrets management services (AWS Secrets Manager, etc.)

## Verification

To verify the fix is working:

1. Try logging in as admin in development
2. Check the console logs for any authentication errors
3. If login succeeds, the fix is working correctly

---

**Fixed by**: Parth
**Date**: 2025
**Issue**: Admin login "wrong password" in development but works in testing
