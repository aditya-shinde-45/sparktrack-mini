# 🔍 DEBUGGING: Method Changed from PATCH to GET

## The Problem
The frontend code clearly sends `PATCH`:
```javascript
const response = await apiRequest(
  `/api/admin/evaluation-forms/${selectedEvaluationFormId}/toggle-mentor-edit`,
  'PATCH',  // ← This is PATCH
  { groupId: groupId, enabled: newState },
  token
);
```

But the backend receives `GET`:
```json
{
  "method": "GET",  // ← Backend sees GET
  "requestedPath": "/api/admin/evaluation-forms/.../toggle-mentor-edit"
}
```

## Possible Causes

### 1. Browser Cache/Service Worker
The browser might be caching the request and converting it to GET.

**Fix:**
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

### 2. Proxy/CORS Preflight
The browser might be sending an OPTIONS preflight request that's being converted to GET.

**Fix:** Check Network tab in DevTools:
- Look for TWO requests to the same URL
- First one should be OPTIONS (preflight)
- Second one should be PATCH (actual request)

### 3. API Request Function Bug
The `apiRequest` function might have a bug that converts PATCH to GET.

**Fix:** Add logging to `src/api.js`:

```javascript
export const apiRequest = async (endpoint, method = "GET", body = null, token = null, isFormData = false, timeoutMs = 20000) => {
  // ADD THIS LINE
  console.log(`🔍 API Request: ${method} ${endpoint}`, { body, hasToken: !!token });
  
  // ... rest of the function
  const options = { method, headers };
  
  // ADD THIS LINE
  console.log(`📤 Fetch options:`, { method: options.method, url: `${API_BASE_URL}${endpoint}` });
  
  // ... rest of the function
}
```

### 4. Backend Not Running Latest Code
The backend might be running old code without the PATCH route.

**Fix:**
```bash
cd /home/parth219/Downloads/sparktrack-mini/reviewpanel-backend
pkill -f node
npm start
```

## IMMEDIATE ACTION REQUIRED

### Step 1: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click the toggle button in admin dashboard
4. Look for the request to `toggle-mentor-edit`
5. Click on it and check:
   - **Request Method**: Should be PATCH
   - **Request URL**: Should be correct
   - **Status Code**: What is it?

### Step 2: Check Console
Look for any errors or warnings in the Console tab.

### Step 3: Clear Everything
```bash
# Clear browser cache
Ctrl+Shift+Delete → Clear browsing data

# Restart frontend
cd /home/parth219/Downloads/sparktrack-mini/reviewpannel-frontend
npm run dev

# Restart backend
cd /home/parth219/Downloads/sparktrack-mini/reviewpanel-backend
pkill -f node
npm start
```

### Step 4: Test with cURL
```bash
# Get your admin token from localStorage (F12 → Application → Local Storage)
# Then test directly:

curl -X PATCH http://localhost:5000/api/admin/evaluation-forms/999d907d-26d4-4716-86df-a5e4c2f6132b/toggle-mentor-edit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"groupId":"TYCC203","enabled":true}'
```

If cURL works but browser doesn't, it's a browser/frontend issue.
If cURL also fails, it's a backend issue.

## What to Send Me

1. **Screenshot of Network tab** showing the request details
2. **Console output** from browser
3. **Backend terminal output** 
4. **Result of cURL test** (if you tried it)

This will tell us EXACTLY where the method is being changed from PATCH to GET.

---

**Status**: 🔴 METHOD MISMATCH - PATCH → GET
**Action**: CHECK NETWORK TAB IN BROWSER DEVTOOLS
**Priority**: CRITICAL
