# 🚀 Security Improvements - Implementation Guide

## Quick Start

### 1. Install Missing Dependencies (if needed)

```bash
npm install @google/generative-ai
```

### 2. Update Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate admin secret  
openssl rand -base64 32

# Get Gemini API key from: https://aistudio.google.com/app/apikey
```

Update `.env.local`:
```bash
MONGODB_URI=mongodb://localhost:27017/optiflow
JWT_SECRET=<paste generated JWT secret>
ADMIN_SECRET=<paste generated admin secret>
GEMINI_API_KEY=<paste your Gemini API key>
NODE_ENV=development
DEV_AUTH_FALLBACK=true
```

### 3. Replace Modified Files

The following files need to be replaced with secure versions:

#### Replace login route:
```bash
mv src/app/api/auth/login/route.new.js src/app/api/auth/login/route.js
```

Or manually copy the content from `route.new.js` to `route.js`.

#### Complete register route update:

In `src/app/api/auth/register/route.js`, complete the remaining changes:

1. Find this block:
```javascript
    } else {
      // Fallback mode: Create mock user without database
      const mockUserId = 'user_' + Date.now();
      
      // Create JWT token with role
      const token = jwt.sign(
        { userId: mockUserId, role: role || 'user', name: name },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '7d' }
      );

      return NextResponse.json(
        {
          message: 'User registered successfully (Development Mode)',
          token,
          user: {
            id: mockUserId,
            name: name,
            email: email,
            role: role || 'user',
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return specific error message for debugging
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

2. Replace with:
```javascript
    } else {
      // Development fallback mode
      const mockUserId = 'user_' + Date.now();
      
      logger.warn('Using development fallback mode for registration', { requestId });

      // Create JWT token
      const token = jwt.sign(
        { userId: mockUserId, role: role || 'user', name: name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = NextResponse.json(
        {
          message: 'User registered successfully (Development Mode)',
          token,
          user: {
            id: mockUserId,
            name: name,
            email: email,
            role: role || 'user',
          },
        },
        { status: 201 }
      );

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: false, // Development mode
        sameSite: 'lax',
        maxAge: 3600,
        path: '/',
      });

      return response;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Registration failed', {
      requestId,
      error: error.message,
      duration: `${duration}ms`
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Update Signup Page - Remove Admin Code Display

In `src/app/signup/page.js`, find this section (around line 390-400):

```javascript
<p className="text-yellow-200 text-xs mt-1">
  Code: <motion.code 
    className="bg-black/30 px-2 py-0.5 rounded text-yellow-100 font-mono text-xs"
    whileHover={{ scale: 1.05, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
  >
    admin-verification-code-2025
  </motion.code>
</p>
```

Replace with:
```javascript
<p className="text-yellow-200 text-xs mt-1">
  Contact your organization owner for the admin verification code.
</p>
```

### 5. Update Suggestions Route

In `src/app/api/suggestions/route.js`:

1. Add imports at the top:
```javascript
import geminiService from '@/lib/gemini';
import logger from '@/lib/logger';
```

2. Replace the `generateAISuggestions` function:
```javascript
// Replace this entire function with Gemini integration
const generateAISuggestions = async (tasks) => {
  return await geminiService.generateTaskSuggestions(tasks);
};
```

3. In the GET handler, replace the for-loop with bulk operation:
```javascript
// OLD CODE (REMOVE):
const savedSuggestions = [];
for (const suggestionData of aiSuggestions) {
  const existingSuggestion = await Suggestion.findOne({
    userId: userObjectId,
    title: suggestionData.title
  });
  
  if (!existingSuggestion) {
    const suggestion = await Suggestion.create({
      ...suggestionData,
      userId: userObjectId
    });
    savedSuggestions.push(suggestion);
  }
}

// NEW CODE (ADD):
const bulkOps = aiSuggestions.map(suggestionData => ({
  updateOne: {
    filter: { userId: userObjectId, title: suggestionData.title },
    update: { 
      $setOnInsert: {
        ...suggestionData,
        userId: userObjectId,
        createdAt: new Date()
      }
    },
    upsert: true
  }
}));

const bulkResult = await Suggestion.bulkWrite(bulkOps);
logger.info('Suggestions bulk operation completed', {
  requestId,
  inserted: bulkResult.upsertedCount
});
```

4. Wrap the handler with logger:
```javascript
export async function GET(request) {
  const requestId = logger.generateRequestId();
  const startTime = Date.now();
  
  try {
    // ... existing code ...
    
    const duration = Date.now() - startTime;
    logger.info('Suggestions generated', {
      requestId,
      count: allSuggestions.length,
      duration: `${duration}ms`
    });
    
    // ... return response ...
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to generate suggestions', {
      requestId,
      error: error.message,
      duration: `${duration}ms`
    });
    // ... error handling ...
  }
}
```

### 6. Update Client Auth Utils

In `src/utils/auth.js`, add this function:

```javascript
// NEW: Fetch current user from server
export const getCurrentUser = async () => {
  try {
    const token = getToken();
    if (!token) return null;

    const response = await fetch('/api/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      removeToken();
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
};

// UPDATE: Use server-side role check
export const getUserRole = async () => {
  const user = await getCurrentUser();
  return user?.role || null;
};

// UPDATE: Use server-side admin check
export const isAdmin = async () => {
  const user = await getCurrentUser();
  return user?.role === 'admin' || user?.role === 'owner';
};

export const isOwner = async () => {
  const user = await getCurrentUser();
  return user?.role === 'owner';
};
```

### 7. Wire Teams & Users Pages

In `src/app/teams/page.js`, replace mock data:

```javascript
// At the top, add:
import { getAuthHeaders } from '@/utils/auth';

// In useEffect or data fetching:
const fetchTeams = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/teams', {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch teams');
    
    const data = await response.json();
    setTeams(data.teams || []);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchTeams();
}, []);
```

Similar for `src/app/users/page.js`:

```javascript
const fetchUsers = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/users', {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch users');
    
    const data = await response.json();
    setUsers(data.users || []);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchUsers();
}, []);
```

### 8. Update Other API Routes

For `src/app/api/suggestions/route.js`, `src/app/api/tasks/route.js`, `src/app/api/teams/route.js`:

1. Add import:
```javascript
import logger from '@/lib/logger';
```

2. Replace:
```javascript
process.env.JWT_SECRET || 'fallback-secret-key'
```

With:
```javascript
process.env.JWT_SECRET
```

3. Add request ID tracking:
```javascript
export async function GET(request) {
  const requestId = logger.generateRequestId();
  
  try {
    // ... existing code ...
  } catch (error) {
    logger.error('Operation failed', { requestId, error: error.message });
    // ... error handling ...
  }
}
```

### 9. Update Documentation

#### README.md

Add this section:

````markdown
## 🔐 Security Configuration

### Environment Variables

Create a `.env.local` file (never commit this):

```bash
# Required variables
MONGODB_URI=mongodb://localhost:27017/optiflow
JWT_SECRET=<generate-with-openssl>
ADMIN_SECRET=<generate-with-openssl>
GEMINI_API_KEY=<get-from-google-ai-studio>

# Optional
NODE_ENV=development
DEV_AUTH_FALLBACK=true  # Only for development
```

### Generate Secure Secrets

```bash
# Generate JWT secret (Unix/Mac/Git Bash)
openssl rand -base64 32

# Generate Admin secret
openssl rand -base64 32
```

### Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Remove or set `DEV_AUTH_FALLBACK=false`
- [ ] Use strong, unique secrets for JWT_SECRET and ADMIN_SECRET
- [ ] Never expose GEMINI_API_KEY to client (no NEXT_PUBLIC_* prefix)
- [ ] Enable HTTPS for secure cookies
- [ ] Rotate GEMINI_API_KEY if previously committed
- [ ] Configure MongoDB with authentication
- [ ] Set up log monitoring
- [ ] Test authentication flows end-to-end

### Security Features

- ✅ httpOnly cookies prevent XSS token theft
- ✅ 1-hour token expiry limits exposure
- ✅ Owner role for privilege escalation control
- ✅ Admin elevation requires owner approval
- ✅ Production guard disables DB fallback
- ✅ Structured logging with secret redaction
- ✅ Server-side AI integration only
````

## Testing

### 1. Test Authentication Flow

```bash
# Start dev server
npm run dev

# Register first user (becomes owner)
# Navigate to http://localhost:3000/signup
# Register with any email - this will be the owner

# Verify token in DevTools:
# Application -> Cookies -> localhost -> auth-token
# Should see httpOnly=true, expires in 1 hour

# Test /api/me endpoint
curl http://localhost:3000/api/me \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

### 2. Test Admin Elevation

```bash
# As a regular user, request admin:
curl -X POST http://localhost:3000/api/admin/requests \
  -H "Cookie: auth-token=USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Need admin access for team management"}'

# As owner, view requests:
curl http://localhost:3000/api/admin/requests \
  -H "Cookie: auth-token=OWNER_TOKEN"

# As owner, approve request:
curl -X POST http://localhost:3000/api/admin/approve \
  -H "Cookie: auth-token=OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requestIdDb": "REQUEST_ID", "action": "approve", "notes": "Approved"}'
```

### 3. Test AI Suggestions

Ensure GEMINI_API_KEY is set, then:

```bash
curl http://localhost:3000/api/suggestions \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

### 4. Monitor Logs

All operations now log structured JSON:

```json
{
  "timestamp": "2025-10-14T12:34:56.789Z",
  "level": "INFO",
  "message": "User registered successfully",
  "requestId": "uuid-here",
  "userId": "user-id-here",
  "role": "owner",
  "duration": "123ms"
}
```

## Troubleshooting

### "JWT_SECRET environment variable is required"
- Add JWT_SECRET to `.env.local`
- Generate with: `openssl rand -base64 32`

### "Service temporarily unavailable"
- In production, database must be available
- In development, set `DEV_AUTH_FALLBACK=true`

### "Admin registration is not available"
- Add ADMIN_SECRET to `.env.local`
- Generate with: `openssl rand -base64 32`

### AI suggestions not working
- Verify GEMINI_API_KEY is set
- Check logs for Gemini API errors
- Fallback suggestions will be used on failure

### Cookies not being set
- Check browser DevTools -> Application -> Cookies
- Verify `secure` flag matches HTTPS usage
- Check `sameSite` setting for cross-origin requests

## Next Steps

1. ✅ Complete all manual file updates above
2. ✅ Test authentication flow locally
3. ✅ Test admin elevation workflow
4. ✅ Test AI suggestions with real API
5. ✅ Review logs for sensitive data leaks
6. ✅ Update frontend to use /api/me for role checks
7. ✅ Deploy to staging environment
8. ✅ Security audit of production deployment

## Support

See `SECURITY_IMPROVEMENTS.md` for detailed documentation of all changes.
