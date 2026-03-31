# 🚨 CRITICAL ISSUE: Route Not Found

## Error Message
```json
{
  "success": false,
  "message": "Route not found",
  "requestedPath": "/api/admin/evaluation-forms/999d907d-26d4-4716-86df-a5e4c2f6132b/toggle-mentor-edit",
  "method": "GET",
  "availableRoutes": ["GET /", "GET /health", "POST /api/mentors/login", "POST /api/auth/login"]
}
```

## Root Cause
The backend server is either:
1. **NOT RUNNING** at all
2. **RUNNING OLD CODE** without the new routes
3. **CRASHED** and showing a fallback error page

## Evidence
The error shows `"availableRoutes": ["GET /", "GET /health", ...]` which is the **catch-all 404 handler** from `server.js`. This means:
- The request reached the server
- But NONE of the route handlers are registered
- Only the basic routes (/, /health) are available

## Solution

### Step 1: Stop All Backend Processes
```bash
# Kill any running node processes
pkill -f node
# OR
ps aux | grep node
kill -9 <PID>
```

### Step 2: Navigate to Backend Directory
```bash
cd /home/parth219/Downloads/sparktrack-mini/reviewpanel-backend
```

### Step 3: Install Dependencies (if needed)
```bash
npm install
```

### Step 4: Start Backend Server
```bash
npm start
```

### Step 5: Verify Server Started
You should see output like:
```
🚀 Server running on port 5000 in development mode
✅ Database connected successfully!
```

### Step 6: Test the Route
```bash
# In a new terminal
cd /home/parth219/Downloads/sparktrack-mini
node test-toggle-route.js
```

### Step 7: Check Backend Logs
Look for any errors in the backend terminal. Common issues:
- **Port already in use**: Change PORT in .env or kill the process using port 5000
- **Database connection failed**: Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
- **Module not found**: Run `npm install` again

## Verification Checklist

✅ **Backend is running**
```bash
curl http://localhost:5000/health
# Should return: {"status":"OK","timestamp":"..."}
```

✅ **Routes are registered**
```bash
curl http://localhost:5000/
# Should return: {"message":"SparkTrack Backend API is running!","version":"1.0"}
```

✅ **Toggle route exists**
```bash
curl -X PATCH http://localhost:5000/api/admin/evaluation-forms/TEST/toggle-mentor-edit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"groupId":"TEST","enabled":true}'
# Should NOT return "Route not found"
```

## Common Mistakes

### ❌ Backend Not Running
**Symptom**: Frontend shows "Network error" or "Route not found"
**Solution**: Start backend with `npm start`

### ❌ Wrong Port
**Symptom**: Frontend connects but gets 404
**Solution**: Check `.env` file - PORT should be 5000

### ❌ Old Code Running
**Symptom**: Route not found even though code is correct
**Solution**: 
1. Stop backend (Ctrl+C)
2. Clear node cache: `rm -rf node_modules/.cache`
3. Restart: `npm start`

### ❌ Environment Variables Missing
**Symptom**: Server crashes on startup
**Solution**: Check `.env` file has all required variables:
```
PORT=5000
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key
JWT_SECRET=your_secret
```

## Quick Fix Commands

```bash
# Navigate to backend
cd /home/parth219/Downloads/sparktrack-mini/reviewpanel-backend

# Stop any running processes
pkill -f "node.*server.js"

# Clean install
rm -rf node_modules package-lock.json
npm install

# Start fresh
npm start
```

## After Backend Starts

1. **Go to Admin Dashboard** (frontend)
2. **Select "TY Review-2 (Technical)"** form
3. **Find group TYCC203** in the table
4. **Click the toggle** to enable mentor edit
5. **Confirm** the action
6. **Check console** - should see success message

Then:

1. **Login as Mentor**
2. **Select the form and group**
3. **Should see**: "✓ Mentor edit enabled (overrides approval). You can update marks."
4. **Edit marks** and submit

## Debug Mode

Add this to your backend `.env`:
```
NODE_ENV=development
DEBUG=*
```

Restart backend and watch for detailed logs.

## Still Not Working?

1. **Check backend terminal** for errors
2. **Check browser console** (F12) for network errors
3. **Check Network tab** in browser DevTools:
   - Is the request reaching the backend?
   - What's the actual URL being called?
   - What's the response status code?

4. **Verify route registration** in `server.js`:
```javascript
app.use("/api/admin", evaluationFormRoutes);
```

5. **Verify route definition** in `evaluationFormRoutes.js`:
```javascript
router.patch('/evaluation-forms/:formId/toggle-mentor-edit', ...)
```

## Contact Info

If still stuck, provide:
1. Backend terminal output (full log)
2. Browser console output (Network tab)
3. Output of: `curl http://localhost:5000/health`
4. Output of: `ps aux | grep node`

---

**Status**: 🔴 BACKEND NOT RUNNING OR ROUTES NOT LOADED
**Action Required**: START BACKEND SERVER
**Priority**: CRITICAL
