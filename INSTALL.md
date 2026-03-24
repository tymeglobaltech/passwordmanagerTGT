# PasswordPal - Linux Server Installation Guide

## Prerequisites

**System requirements:** Linux server (Ubuntu/Debian assumed), 1GB+ RAM, Node.js 18+, PostgreSQL 15+

---

## Step 1: Install System Dependencies

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # should be v18.x+
npm -v

# Install build tools (needed for bcrypt native compilation)
sudo apt install -y build-essential python3

# Install Git
sudo apt install -y git
```

## Step 2: Install PostgreSQL 15

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable the service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 3: Configure the Database

```bash
# Switch to postgres user and create the database + role
sudo -u postgres psql <<EOF
CREATE USER passwordpal WITH PASSWORD 'your-secure-db-password';
CREATE DATABASE passwordpal OWNER passwordpal;
GRANT ALL PRIVILEGES ON DATABASE passwordpal TO passwordpal;
\c passwordpal
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF
```

## Step 4: Clone the Repository

```bash
cd /opt   # or your preferred directory
sudo git clone <YOUR_REPO_URL> passwordmanager
sudo chown -R $USER:$USER passwordmanager
cd passwordmanager
```

## Step 5: Install Node Dependencies

```bash
npm install
```

This installs all three workspaces (backend, frontend, shared) via the monorepo setup.

## Step 6: Configure Environment Variables

**Backend (`backend/.env`):**

```bash
cat > backend/.env <<'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://passwordpal:your-secure-db-password@localhost:5432/passwordpal
ENCRYPTION_KEY=REPLACE_ME
JWT_SECRET=REPLACE_ME
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com
GOOGLE_CLIENT_ID=your-google-client-id
ALLOWED_SSO_DOMAIN=your-company-domain.com
EOF
```

Generate secure values for the secrets:

```bash
# Generate ENCRYPTION_KEY (64-char hex string for AES-256-CBC)
openssl rand -hex 32

# Generate JWT_SECRET
openssl rand -base64 64
```

Replace `REPLACE_ME` values in `backend/.env` with the generated output.

**Frontend (`frontend/.env`):**

```bash
cat > frontend/.env <<'EOF'
VITE_API_URL=https://your-domain.com/api
VITE_FRONTEND_URL=https://your-domain.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
EOF
```

## Step 7: Run Database Migrations & Seed

```bash
# Initialize the database schema
npm run migrate --workspace=backend

# Seed the default admin user
npm run seed --workspace=backend
```

Default admin credentials (change immediately after first login):
- **Username:** `admin`
- **Password:** `Admin123!`

## Step 8: Build for Production

```bash
npm run build
```

This compiles:
- Backend TypeScript → `backend/dist/`
- Frontend React app → `frontend/dist/`

## Step 9: Install a Process Manager (pm2)

```bash
sudo npm install -g pm2

# Start the backend
pm2 start backend/dist/server.js --name passwordpal-api

# Auto-start on reboot
pm2 startup
pm2 save
```

## Step 10: Install & Configure Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx
```

Create the site config:

```bash
sudo tee /etc/nginx/sites-available/passwordpal <<'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (static files)
    location / {
        root /opt/passwordmanager/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check proxy
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/passwordpal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

## Step 11: (Optional) Enable HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

After this, update `FRONTEND_URL`, `CORS_ORIGINS`, and `VITE_API_URL` to use `https://`, then rebuild the frontend and restart pm2:

```bash
npm run build --workspace=frontend
pm2 restart passwordpal-api
```

## Step 12: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Verify Installation

```bash
# Check backend health
curl http://localhost:3001/health

# Check pm2 status
pm2 status

# Check nginx
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql
```

Visit `https://your-domain.com` in your browser and log in with the default admin credentials. **Change the admin password immediately.**

---

## Quick Reference - All Services

| Component | Port | Technology |
|-----------|------|------------|
| Frontend  | 80/443 (via Nginx) | React + Vite (static) |
| Backend API | 3001 (behind Nginx) | Express + TypeScript |
| Database  | 5432 | PostgreSQL 15 |
