# 🎯 Quick Reference - Security Implementation

## 🚨 Critical Actions (Do First)

### 1. Rotate Leaked API Key
```bash
# Old key (COMPROMISED - do not use):
# <REDACTED_ROTATE_THIS_KEY>

# Go to: https://aistudio.google.com/app/apikey
# 1. Delete old key
# 2. Create new key
# 3. Add to .env.local
```

### 2. Generate Secrets
```bash
# Method 1: Using OpenSSL (Unix/Mac/Git Bash)
openssl rand -base64 32    # For JWT_SECRET
openssl rand -base64 32    # For ADMIN_SECRET

# Method 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Online (if no tools available)
# Visit: https://generate-secret.vercel.app
```

### 3. Update .env.local
```bash
MONGODB_URI=mongodb://localhost:27017/optiflow
JWT_SECRET=<paste generated secret>
ADMIN_SECRET=<paste generated secret>
GEMINI_API_KEY=<paste NEW rotated key>
NODE_ENV=development
DEV_AUTH_FALLBACK=true
```

---

## 📁 Files Status

### ✅ Complete (No Action Required)
- `src/lib/logger.js` - Structured logging
- `src/lib/gemini.js` - AI integration
- `src/app/api/me/route.js` - Current user endpoint
- `src/app/api/admin/requests/route.js` - Admin requests
- `src/app/api/admin/approve/route.js` - Admin approval
- `src/models/AdminRequest.js` - Request model
- `src/models/User.js` - Updated with owner role
- `src/middleware/auth.js` - Strict JWT + requireOwner
- `.env.example` - Template
- `IMPLEMENTATION_GUIDE.md` - Step-by-step guide
- `SUMMARY.md` - Executive summary
- `setup-security.bat` - Setup script

### ⚠️ Needs Manual Updates
| File | Lines | Action | Priority |
|------|-------|--------|----------|
| `src/app/api/auth/login/route.js` | All | Replace with route.new.js | 🔴 HIGH |
| `src/app/api/auth/register/route.js` | ~180-213 | Update fallback section | 🔴 HIGH |
| `src/app/signup/page.js` | ~395 | Remove admin code display | 🔴 HIGH |
| `src/app/api/suggestions/route.js` | ~20-150 | Add Gemini + bulkWrite | 🟡 MEDIUM |
| `src/utils/auth.js` | Add | Add getCurrentUser() | 🟡 MEDIUM |
| `src/app/teams/page.js` | Replace | Wire to /api/teams | 🟢 LOW |
| `src/app/users/page.js` | Replace | Wire to /api/users | 🟢 LOW |
| `src/app/api/tasks/route.js` | Add | Add logger | 🟢 LOW |
| `src/app/api/teams/route.js` | Add | Add logger | 🟢 LOW |
| `README.md` | Add | Security section | 🟢 LOW |

---

## ⚡ Quick Commands

### Setup
```bash
# Run automated setup
setup-security.bat

# Or manual:
copy .env.example .env.local
# Edit .env.local with secrets
move src\app\api\auth\login\route.new.js src\app\api\auth\login\route.js
npm run dev
```

### Testing
```bash
# Test app starts
npm run dev

# Test registration (first user becomes owner)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@example.com","password":"password123"}'

# Test /api/me
curl http://localhost:3000/api/me \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Test admin request
curl -X POST http://localhost:3000/api/admin/requests \
  -H "Cookie: auth-token=USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Need admin access"}'
```

---

## 🔧 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "JWT_SECRET environment variable is required" | Add JWT_SECRET to .env.local |
| "Admin registration is not available" | Add ADMIN_SECRET to .env.local |
| "Service temporarily unavailable" (dev) | Set DEV_AUTH_FALLBACK=true |
| "Service temporarily unavailable" (prod) | Fix database connection |
| Cookies not set | Check HTTPS in production, secure flag |
| AI suggestions fail | Verify GEMINI_API_KEY is correct |

---

## 📊 Implementation Progress

### Phase 1: Core Infrastructure (✅ 100%)
- [x] Logger utility
- [x] Gemini service
- [x] User model (owner role)
- [x] Middleware (strict JWT + requireOwner)
- [x] Environment template

### Phase 2: Authentication (⚠️ 80%)
- [x] Register route (partially updated)
- [x] Login route (new file created)
- [ ] Replace login route file
- [ ] Complete register route updates

### Phase 3: Admin Governance (✅ 100%)
- [x] AdminRequest model
- [x] POST /api/admin/requests
- [x] GET /api/admin/requests (owner)
- [x] POST /api/admin/approve (owner)
- [x] GET /api/me

### Phase 4: Client Updates (⚠️ 0%)
- [ ] Update signup UI (remove code)
- [ ] Update auth utils (add getCurrentUser)
- [ ] Wire teams page
- [ ] Wire users page

### Phase 5: Optional Improvements (⚠️ 0%)
- [ ] Suggestions route (Gemini + bulkWrite)
- [ ] Add logger to tasks route
- [ ] Add logger to teams route
- [ ] Update documentation

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| `SUMMARY.md` | Executive overview and checklist |
| `IMPLEMENTATION_GUIDE.md` | Step-by-step migration guide |
| `SECURITY_IMPROVEMENTS.md` | Technical documentation |
| `QUICK_REFERENCE.md` | This file - quick commands |
| `.env.example` | Environment template |

---

## 🎓 Key Concepts

### httpOnly Cookies
```javascript
// Prevents XSS attacks - JavaScript cannot access
response.cookies.set('auth-token', token, {
  httpOnly: true,      // ✅ No document.cookie access
  secure: true,        // ✅ HTTPS only
  sameSite: 'lax',    // ✅ CSRF protection
  maxAge: 3600        // ✅ 1 hour expiry
});
```

### Owner Bootstrap
```javascript
// First user registration
const userCount = await User.countDocuments();
if (userCount === 0) {
  role = 'owner';
  isOwner = true;
}
```

### Strict JWT
```javascript
// Before: Fallback allowed token forgery
jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

// After: App fails without secret
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET required');
}
jwt.verify(token, process.env.JWT_SECRET);
```

### Production Guard
```javascript
// Development: Fallback if explicitly enabled
if (!isDbConnected && process.env.DEV_AUTH_FALLBACK === 'true') {
  // Allow mock authentication
}

// Production: Fail fast
if (!isDbConnected && process.env.NODE_ENV === 'production') {
  return 503; // Service unavailable
}
```

---

## 🚀 Next Steps

1. **Immediate** (Today)
   - [ ] Rotate GEMINI_API_KEY
   - [ ] Generate JWT_SECRET and ADMIN_SECRET
   - [ ] Update .env.local
   - [ ] Test app starts

2. **Core Updates** (This Week)
   - [ ] Replace login route
   - [ ] Complete register route
   - [ ] Update signup UI
   - [ ] Test authentication flow

3. **Optional** (Before Production)
   - [ ] Update suggestions route
   - [ ] Wire teams & users pages
   - [ ] Update documentation
   - [ ] Add logger to other routes

4. **Production** (When Ready)
   - [ ] Complete production checklist
   - [ ] Security audit
   - [ ] Deploy and monitor

---

## 💡 Pro Tips

1. **Use the setup script**: `setup-security.bat` automates most steps
2. **Test incrementally**: Don't update everything at once
3. **Check logs**: All operations now log with request IDs
4. **Monitor cookies**: Use browser DevTools → Application → Cookies
5. **Read docs**: Each .md file covers different aspects

---

**Last Updated**: October 14, 2025  
**Status**: 9/13 Issues Fully Implemented, 4 Require Manual Completion  
**Estimated Time to Complete**: 2-4 hours
