# Password Pal - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│                     (React + Tailwind CSS)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Port 3000)                       │
│                        React + Vite                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Components: Login, Dashboard, Generate, Admin         │    │
│  │  Context: AuthContext (JWT state management)           │    │
│  │  Services: API Client (Axios with interceptors)        │    │
│  │  Utils: Password Generator (crypto.getRandomValues)    │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (JWT Bearer Token)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Port 3001)                        │
│                    Node.js + Express                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Security Middleware                        │    │
│  │  • Helmet.js (Security Headers)                        │    │
│  │  • CORS Protection                                     │    │
│  │  • Rate Limiting (Login: 5/15min, API: 100/15min)     │    │
│  │  • JWT Authentication                                  │    │
│  │  • Input Validation (express-validator)               │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   API Routes                            │    │
│  │  • /api/auth/*        - Authentication                 │    │
│  │  • /api/passwords/*   - Password Management            │    │
│  │  • /api/admin/*       - Admin Operations               │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  Controllers                            │    │
│  │  • AuthController     - Login, Logout, GetUser         │    │
│  │  • PasswordController - CRUD, Generate, Retrieve       │    │
│  │  • AdminController    - Users, Logs, Stats             │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Services                             │    │
│  │  • EncryptionService  - AES-256-CBC encryption         │    │
│  │  • JWTService         - Token generation/verification  │    │
│  │  • AuditService       - Access logging and stats       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries (Parameterized)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (Port 5432)                          │
│                      PostgreSQL 15                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Tables:                                                │    │
│  │  • users           - User accounts (bcrypt hashed)     │    │
│  │  • passwords       - Encrypted passwords (AES-256)     │    │
│  │  • access_logs     - Audit trail                       │    │
│  │                                                         │    │
│  │  Indexes on: guid, username, email, created_at         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Password Generation Flow
```
User → Generate Page → PasswordGenerator Component
                            │
                            ▼
                  crypto.getRandomValues()
                            │
                            ▼
                  Calculate Strength Meter
                            │
                            ▼
                  Display Password + Copy Button
```

### 2. Password Save & Share Flow
```
User → SavePasswordForm → POST /api/passwords
                              │
                              ▼
                    PasswordController.savePassword()
                              │
                              ▼
                    EncryptionService.encrypt()
                              │
                              ├─ Generate unique IV
                              ├─ AES-256-CBC encryption
                              └─ Generate GUID
                              │
                              ▼
                    Save to database (passwords table)
                              │
                              ▼
                    AuditService.logAccess() [type: create]
                              │
                              ▼
                    Return shareable link to user
```

### 3. Password Retrieval Flow
```
Anyone → /retrieve/:guid → GET /api/passwords/:guid
                              │
                              ▼
                    PasswordController.retrievePassword()
                              │
                              ├─ Check if active
                              ├─ Check expiration
                              ├─ Check access limit
                              │
                              ▼
                    EncryptionService.decrypt()
                              │
                              ▼
                    Increment access count
                              │
                              ▼
                    AuditService.logAccess() [type: view]
                              │
                              ▼
                    Return decrypted password
```

### 4. Authentication Flow
```
User → Login Page → POST /api/auth/login
                        │
                        ▼
              AuthController.login()
                        │
                        ├─ Validate credentials
                        ├─ bcrypt.compare(password, hash)
                        │
                        ▼
              JWTService.generateToken()
                        │
                        ▼
              Return JWT token + user data
                        │
                        ▼
              Store in localStorage
                        │
                        ▼
              Redirect to Dashboard
```

### 5. Protected Route Access
```
User Action → Protected Component
                  │
                  ▼
         Check localStorage for token
                  │
                  ├─ No token → Redirect to /login
                  │
                  ▼
         Add "Authorization: Bearer {token}" header
                  │
                  ▼
         Backend Middleware: authenticate()
                  │
                  ├─ Verify JWT signature
                  ├─ Check expiration
                  │
                  ▼
         Attach user to req.user
                  │
                  ▼
         Execute controller
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Network Security                         │
│  • CORS (specific origins only)                    │
│  • Helmet.js security headers                      │
│  • HTTPS in production                             │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Layer 2: Rate Limiting                            │
│  • Login: 5 attempts per 15 minutes                │
│  • API: 100 requests per 15 minutes                │
│  • Retrieval: 10 requests per minute               │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Layer 3: Authentication                           │
│  • JWT tokens (24h expiration)                     │
│  • Bearer token validation                         │
│  • Role-based access control                       │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Layer 4: Input Validation                         │
│  • express-validator on all inputs                 │
│  • Type checking with TypeScript                   │
│  • Parameterized SQL queries                       │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Layer 5: Data Encryption                          │
│  • Passwords: AES-256-CBC + unique IV              │
│  • User passwords: bcrypt (12 rounds)              │
│  • Never log plain-text passwords                  │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Layer 6: Audit Logging                            │
│  • Log all password operations                     │
│  • Track IP addresses and user agents              │
│  • Success/failure tracking                        │
└─────────────────────────────────────────────────────┘
```

## 📦 Component Hierarchy

### Frontend Component Tree
```
App
├── AuthProvider (Context)
│   ├── LoginPage
│   │   └── Card
│   │       ├── Input (username)
│   │       ├── Input (password)
│   │       └── Button (submit)
│   │
│   ├── Layout (Protected Routes)
│   │   ├── Header
│   │   │   ├── Logo
│   │   │   ├── Navigation
│   │   │   └── UserMenu
│   │   │
│   │   ├── DashboardPage
│   │   │   ├── Card (Password List)
│   │   │   │   ├── CopyButton
│   │   │   │   └── Button (Delete)
│   │   │   └── Pagination
│   │   │
│   │   ├── GeneratePage
│   │   │   ├── Card (Generator)
│   │   │   │   ├── PasswordGenerator
│   │   │   │   │   ├── Input (password display)
│   │   │   │   │   ├── CopyButton
│   │   │   │   │   ├── PasswordStrengthMeter
│   │   │   │   │   └── Options (checkboxes, slider)
│   │   │   │   └── Button (Regenerate)
│   │   │   │
│   │   │   └── Card (Save Form)
│   │   │       ├── SavePasswordForm
│   │   │       │   ├── Input (title)
│   │   │       │   ├── Input (expires_at)
│   │   │       │   ├── Input (max_access_count)
│   │   │       │   └── Button (Save)
│   │   │       └── Modal (Shareable Link)
│   │   │
│   │   └── AdminPage (Admin Only)
│   │       ├── Tabs
│   │       ├── StatsTab (4x Card with metrics)
│   │       ├── UsersTab
│   │       │   ├── Table (users)
│   │       │   └── Modal (Create User Form)
│   │       └── LogsTab
│   │           └── Table (access logs)
│   │
│   └── RetrievePage (Public)
│       └── Card
│           ├── Input (password display)
│           ├── Button (show/hide)
│           ├── CopyButton
│           └── Metadata (expiry, accesses)
│
└── Toaster (Global notifications)
```

## 🗄️ Database Schema Relationships

```
┌──────────────────────┐
│      users           │
│──────────────────────│
│ id (PK)              │◄──────┐
│ username (UNIQUE)    │       │
│ email (UNIQUE)       │       │
│ password_hash        │       │
│ role                 │       │
│ is_active            │       │
│ created_by (FK)      │───────┘ (self-reference)
│ created_at           │
│ updated_at           │
│ last_login           │
└──────────────────────┘
          │
          │ (created_by)
          │
          ▼
┌──────────────────────┐
│    passwords         │
│──────────────────────│
│ id (PK)              │◄───────┐
│ guid (UNIQUE)        │        │
│ encrypted_password   │        │
│ encryption_iv        │        │
│ title                │        │
│ created_by (FK) ─────┤        │
│ expires_at           │        │
│ max_access_count     │        │
│ current_access_count │        │
│ is_active            │        │
│ created_at           │        │
│ updated_at           │        │
└──────────────────────┘        │
          │                     │
          │ (password_id)       │
          │                     │
          ▼                     │
┌──────────────────────┐        │
│   access_logs        │        │
│──────────────────────│        │
│ id (PK)              │        │
│ password_id (FK) ────┤────────┘
│ accessed_by (FK)     │───► users.id
│ ip_address           │
│ user_agent           │
│ access_type          │
│ success              │
│ created_at           │
└──────────────────────┘
```

## 🔄 Request/Response Cycle

### Example: Generate and Save Password

```
1. USER ACTION
   └─► Click "Generate" button

2. FRONTEND
   └─► PasswordGenerator.handleGenerate()
       └─► crypto.getRandomValues()
           └─► Display password + strength

3. USER ACTION
   └─► Click "Save Password & Get Link"

4. FRONTEND
   └─► SavePasswordForm.handleSubmit()
       └─► api.savePassword()
           └─► POST /api/passwords
               Headers: { Authorization: Bearer {jwt} }
               Body: { password, title, expires_at, max_access_count }

5. BACKEND - Middleware Layer
   └─► apiLimiter (check rate limit)
       └─► authenticate (verify JWT)
           └─► runValidations (validate input)
               └─► Controller

6. BACKEND - Controller
   └─► PasswordController.savePassword()
       └─► EncryptionService.encrypt(password)
           ├─► Generate random IV (16 bytes)
           ├─► AES-256-CBC encryption
           └─► Return { encrypted, iv }
       └─► EncryptionService.generateGuid()
           └─► crypto.randomUUID()
       └─► Save to database
       └─► AuditService.logAccess()
       └─► Generate shareable link

7. DATABASE
   └─► INSERT INTO passwords (...)
       └─► Return saved record with GUID

8. BACKEND - Response
   └─► Return { success: true, data: { guid, shareable_link, ... } }

9. FRONTEND
   └─► Display success toast
       └─► Open modal with shareable link
           └─► User can copy link
```

## 🎯 Key Design Patterns

### 1. Repository Pattern
- Database queries centralized in controllers
- Services handle business logic
- Clear separation of concerns

### 2. Middleware Chain
```
Request → CORS → Helmet → Rate Limit → Body Parser
  → Route → Auth → Validation → Controller → Response
```

### 3. Context API (React)
- AuthContext provides global auth state
- Avoids prop drilling
- Centralized login/logout logic

### 4. Protected Routes
- ProtectedRoute wrapper component
- Automatic redirect if not authenticated
- Admin-only route variant

### 5. Service Layer
- EncryptionService: All crypto operations
- JWTService: Token management
- AuditService: Logging operations

## 📊 Performance Considerations

### Database Optimization
- ✅ Indexes on frequently queried columns
- ✅ Pagination for large result sets
- ✅ Connection pooling (max 20 connections)
- ✅ Prepared statements (SQL injection prevention)

### Frontend Optimization
- ✅ Code splitting with React Router
- ✅ Lazy loading components
- ✅ Memoization where appropriate
- ✅ Vite for fast builds and HMR

### API Optimization
- ✅ Rate limiting to prevent abuse
- ✅ JWT reduces database lookups
- ✅ Efficient queries with indexes
- ✅ Response compression (gzip)

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────┐
│           Load Balancer (Optional)          │
│               HTTPS/TLS                     │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  Frontend    │        │  Frontend    │
│  (Static)    │        │  (Static)    │
│  CDN/Nginx   │        │  CDN/Nginx   │
└──────────────┘        └──────────────┘
        │                       │
        └───────────┬───────────┘
                    ▼
┌─────────────────────────────────────────────┐
│           Backend API Servers               │
│         (Node.js + Express)                 │
│  Multiple instances for scaling             │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│      Managed PostgreSQL Database            │
│  (AWS RDS, Google Cloud SQL, etc.)          │
│  • Automated backups                        │
│  • Replication                              │
│  • Monitoring                               │
└─────────────────────────────────────────────┘
```

## 📈 Scalability Strategy

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Stateless API (JWT in requests, not server sessions)
- CDN for frontend static assets

### Database Scaling
- Read replicas for heavy read operations
- Connection pooling
- Query optimization with indexes
- Caching layer (Redis) for frequently accessed data

### Future Optimizations
- Redis for session caching
- Message queue for audit logs (async)
- Elasticsearch for log searching
- Microservices architecture (if needed)

---

**Architecture Status:** ✅ Complete and Production-Ready!
