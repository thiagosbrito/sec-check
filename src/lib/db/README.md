# Database Security Implementation

## Row Level Security (RLS) Setup

### 1. Apply RLS Policies
Run the following SQL in your Supabase SQL Editor to enable RLS on all tables:

```sql
-- Copy and paste the contents of rls-policies.sql
```

### 2. Environment Variables Required
Add to your `.env.local`:

```env
# Your existing variables
DATABASE_URL="..."
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Add this for service operations (get from Supabase dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. Security Principles Implemented

#### User Data Isolation
- Users can only access their own data (scans, domains, API keys, etc.)
- Public scans are accessible to all users (for free tier functionality)
- Service role can perform system operations (creating scan results, reports)

#### API Security Layers
1. **Authentication**: NextAuth integration required
2. **Authorization**: RLS policies enforce data access rules
3. **API Rate Limiting**: Usage tracking per user/plan
4. **Input Validation**: All inputs validated and sanitized

#### Connection Security
- SSL enforced on all database connections
- Connection pooling with timeouts
- Service role separation for backend operations
- Environment variable validation

### 4. Usage Patterns

#### Frontend (User Context)
```typescript
import { db } from '@/lib/db/connection';

// RLS automatically filters to user's data
const userScans = await db.select().from(scans);
```

#### Backend (Service Context)
```typescript
import { createServiceClient } from '@/lib/db/connection';

// Bypasses RLS for system operations
const serviceDb = createServiceClient();
const scanResults = await serviceDb.insert(scanResults).values({
  scanId: scanId,
  // ... other fields
});
```

### 5. Security Checklist

- [ ] RLS policies applied to all tables
- [ ] Service role key added to environment variables
- [ ] Authentication required for all user operations
- [ ] Input validation on all API endpoints
- [ ] Rate limiting implemented
- [ ] Audit logging for sensitive operations
- [ ] No sensitive data in client-side code
- [ ] SQL injection prevention (parameterized queries)
- [ ] HTTPS enforced in production

### 6. Testing RLS

Test your RLS policies by:
1. Creating test users with different roles
2. Attempting to access other users' data
3. Verifying public scans are accessible
4. Testing service role operations work correctly

### 7. Emergency Access

If you need to disable RLS temporarily (emergency only):
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

**Always re-enable after fixing issues:**
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```