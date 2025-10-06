# MITADT Login Redirect Fix

## Problem
After logging in with MITADT credentials, the system was redirecting to the evaluation form instead of the mentor selection page.

## Root Cause
The issue was that we were checking the `name` field from localStorage to determine if the user is MITADT. However, in the database, the MITADT user has:
- `external_id`: "MITADT" 
- `name`: "PBL REVIEW 2"

So when we stored `localStorage.setItem("name", data.user?.name)`, it stored "PBL REVIEW 2" instead of "MITADT", and our check `name === "MITADT"` was failing.

## Solution
Instead of using the `name` field for identification, we now:

1. **Store both values** in localStorage:
   - `name`: Display name from API (e.g., "PBL REVIEW 2")
   - `external_id`: External ID from API (e.g., "MITADT")

2. **Use `external_id` for identification** in all MITADT checks:
   ```javascript
   const isMITADT = externalId.toUpperCase() === "MITADT";
   ```

3. **Use `name` for display** in the UI (header, greeting, etc.)

## Files Modified

### 1. Login.jsx
**Changes:**
- Added `localStorage.setItem("external_id", externalId)` to store external_id separately
- Changed MITADT check from `username === "MITADT"` to `externalId.toUpperCase() === "MITADT"`
- Now redirects to `/mentor-selection` (not `/test-mentor`)

**Code:**
```javascript
// Store BOTH the name (for display) and external_id (for identification)
localStorage.setItem("name", externalName);
localStorage.setItem("external_id", externalId);

// Check using external_id instead of name
const isMITADT = externalId.toUpperCase() === "MITADT";
```

### 2. MentorSelection.jsx
**Changes:**
- Changed from `localStorage.getItem("name")` to `localStorage.getItem("external_id")`
- Re-enabled the MITADT verification check
- Uses external_id for identification

**Code:**
```javascript
const externalId = localStorage.getItem("external_id");

// Check if this is MITADT external (case-insensitive)
if (externalId?.toUpperCase() !== "MITADT") {
  navigate("/external-home");
  return;
}
```

### 3. ExternalHome.jsx
**Changes:**
- Added `externalId` from localStorage
- Changed MITADT check to use external_id
- Keeps `name` for display in header

**Code:**
```javascript
const name = localStorage.getItem("name") || ""; // For display
const externalId = localStorage.getItem("external_id") || ""; // For identification
const isMITADT = externalId.toUpperCase() === "MITADT";
```

### 4. approutes.jsx
**Changes:**
- Removed test route `/test-mentor`
- Restored ProtectedRoute for `/mentor-selection`
- Clean routes structure

## Testing Results

### Before Fix:
```
localStorage:
- name: "PBL REVIEW 2"
- external_id: (not set)

Check: name === "MITADT" → FALSE ❌
Result: Redirects to /external-home
```

### After Fix:
```
localStorage:
- name: "PBL REVIEW 2" (for display)
- external_id: "MITADT" (for identification)

Check: external_id === "MITADT" → TRUE ✅
Result: Redirects to /mentor-selection
```

## Benefits

1. **Separation of Concerns**: Display name vs identification
2. **Robust**: Works even if name field changes in database
3. **Consistent**: Uses external_id (primary key) for logic
4. **User-Friendly**: Shows proper display name in UI

## Database Structure

In the `externals` table:
```sql
external_id | name           | password
------------|----------------|------------
MITADT      | PBL REVIEW 2   | MITADT1230
EXT001      | John Smith     | pass123
```

- `external_id`: Unique identifier (used for login & logic)
- `name`: Display name (can be null, used for UI)
- `password`: Login password

## localStorage Keys After Login

| Key | Purpose | Example Value |
|-----|---------|---------------|
| `name` | Display in UI | "PBL REVIEW 2" |
| `external_id` | Identification logic | "MITADT" |
| `token` | Authentication | "eyJhbGc..." |
| `role` | User role | "external" |

## Testing Checklist

- [x] Login with MITADT → Redirects to /mentor-selection
- [x] Login with other external → Redirects to /external-home
- [x] MentorSelection page checks external_id
- [x] ExternalHome shows MITADT banner for MITADT users
- [x] Name displays correctly in header
- [x] ProtectedRoute allows access to /mentor-selection
- [x] Console logs show correct values

## Next Steps

If issues persist, check:
1. Browser console for localStorage values
2. Network tab for API response structure
3. Backend database values for MITADT user
4. Token payload contains external_id

## Cleanup

Removed temporary files:
- `TestMentorSelection.jsx` (can be deleted)

Removed debug code:
- Test route in approutes.jsx
- Excessive console.logs (can be removed in production)
