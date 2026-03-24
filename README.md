# Password Pal

A secure password management application with password generation, encrypted storage via shareable GUIDs/links, and admin-controlled user access.

## Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (or use Docker)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start PostgreSQL:
   ```bash
   docker-compose up -d
   ```

4. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Update with your configuration

5. Run database migrations:
   ```bash
   npm run migrate --workspace=backend
   ```

6. Seed initial admin user:
   ```bash
   npm run seed --workspace=backend
   ```

7. Start development servers:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:3000 and the backend at http://localhost:3001.

## Default Admin Credentials

- Username: `admin`
- Password: `Admin123!`

**Important:** Change these credentials immediately after first login.

## Project Structure

```
PasswordPal/
├── frontend/          # React + Tailwind UI
├── backend/           # Node.js + Express API
├── shared/            # Shared TypeScript types
├── docker-compose.yml # PostgreSQL development environment
└── package.json       # Root monorepo configuration
```

## Features

- Secure password generation with customizable options
- Encrypted password storage (AES-256-CBC)
- Shareable password links with GUID
- Optional expiration and access limits
- User authentication with JWT
- Admin panel for user management
- Comprehensive audit logging
- Role-based access control

## Security

- AES-256-CBC encryption for passwords
- bcrypt password hashing for user accounts
- JWT token-based authentication
- Rate limiting on sensitive endpoints
- Comprehensive audit logging
- Security headers via helmet.js

## License

MIT
