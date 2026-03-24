# Password Pal - Setup Instructions

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL)
- Git (optional)

## Quick Start

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

This will install dependencies for the root, frontend, backend, and shared packages.

### 2. Start PostgreSQL Database

```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d

# Wait for the database to be ready (check with)
docker-compose logs postgres
```

The database will be available at `localhost:5432` with:
- Database: `passwordpal`
- Username: `passwordpal`
- Password: `securepassword`

### 3. Run Database Migrations

```bash
# Run migrations to create tables
npm run migrate --workspace=backend
```

This will create all necessary tables (users, passwords, access_logs).

### 4. Seed Initial Admin User

```bash
# Create default admin user
npm run seed --workspace=backend
```

Default admin credentials:
- Username: `admin`
- Password: `Admin123!`

**IMPORTANT:** Change these credentials immediately after first login!

### 5. Start Development Servers

```bash
# Start both frontend and backend in development mode
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Environment Variables

The `.env` files have been created with development defaults. For production:

### Backend (.env)

- **ENCRYPTION_KEY**: Generate a new 64-char hex string:
  ```bash
  openssl rand -hex 32
  ```

- **JWT_SECRET**: Generate a secure secret:
  ```bash
  openssl rand -base64 64
  ```

### Frontend (.env)

Update the API URL if deploying to production:
```
VITE_API_URL=https://your-api-domain.com/api
VITE_FRONTEND_URL=https://your-app-domain.com
```

## Troubleshooting

### Database Connection Failed

1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Check logs:
   ```bash
   docker-compose logs postgres
   ```

3. Restart the database:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Port Already in Use

If ports 3000, 3001, or 5432 are already in use:

1. Stop conflicting services
2. Or modify ports in:
   - `docker-compose.yml` (PostgreSQL)
   - `backend/src/server.ts` (Backend)
   - `frontend/vite.config.ts` (Frontend)

### Migration Errors

If migrations fail:

1. Drop and recreate the database:
   ```bash
   docker-compose down -v
   docker-compose up -d
   npm run migrate --workspace=backend
   npm run seed --workspace=backend
   ```

## Project Structure

```
PasswordPal/
├── frontend/           # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React context (Auth)
│   │   ├── services/   # API client
│   │   └── utils/      # Utilities
│   └── package.json
├── backend/            # Node.js + Express
│   ├── src/
│   │   ├── controllers/# Route handlers
│   │   ├── services/   # Business logic
│   │   ├── middleware/ # Express middleware
│   │   ├── routes/     # API routes
│   │   └── database/   # DB connection and migrations
│   └── package.json
├── shared/             # Shared TypeScript types
│   └── src/types.ts
└── package.json        # Root monorepo config
```

## Available Scripts

### Root
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all workspaces
- `npm install` - Install all dependencies

### Backend
- `npm run dev --workspace=backend` - Start backend dev server
- `npm run migrate --workspace=backend` - Run database migrations
- `npm run seed --workspace=backend` - Seed initial data
- `npm run build --workspace=backend` - Build backend

### Frontend
- `npm run dev --workspace=frontend` - Start frontend dev server
- `npm run build --workspace=frontend` - Build frontend for production
- `npm run preview --workspace=frontend` - Preview production build

## Default Admin Account

After seeding, you can login with:
- Username: `admin`
- Password: `Admin123!`

**Security Note:** Change these credentials immediately in production!

## Next Steps

1. Login with admin credentials
2. Create additional user accounts in the Admin panel
3. Generate and save your first password
4. Share password links securely

## Production Deployment

For production deployment:

1. Generate secure encryption keys and JWT secrets
2. Use a managed PostgreSQL database
3. Enable HTTPS/TLS
4. Set NODE_ENV=production
5. Configure CORS for your production domain
6. Set up proper logging and monitoring
7. Use environment-specific secrets management

## Support

For issues or questions, please check the main README.md or create an issue in the repository.


------------

# Install PM2 globally
  npm install -g pm2

  # Start the backend
  pm2 start backend/dist/server.js --name passwordpal

  # Useful commands
  pm2 status          # check if it's running
  pm2 logs passwordpal # view logs
  pm2 restart passwordpal
  pm2 stop passwordpal

  # Auto-start on server reboot
  pm2 startup
  pm2 save

  This keeps it running in the background, auto-restarts on crashes, and persists across reboots.
