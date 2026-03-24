# Password Pal - Quick Start Guide

## 🚀 Fastest Way to Run

### Windows Users

1. Double-click `start.bat`
2. Wait for everything to start
3. Open http://localhost:3000
4. Login with `admin` / `Admin123!`

### Mac/Linux Users

```bash
chmod +x start.sh
./start.sh
```

## 📋 Prerequisites

You need ONE of these for the database:

- **Option A:** Docker Desktop (recommended)
- **Option B:** PostgreSQL installed locally
- **Option C:** Cloud PostgreSQL (ElephantSQL, Supabase, etc.)

## ⚡ Manual Start (If Scripts Don't Work)

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (choose one):
docker compose up -d              # If using Docker
# OR start your local PostgreSQL
# OR update backend/.env with cloud database URL

# 3. Setup database
npm run migrate --workspace=backend
npm run seed --workspace=backend

# 4. Start servers
npm run dev
```

## 🔑 Default Credentials

- **Username:** admin
- **Password:** Admin123!

⚠️ **Change these immediately after first login!**

## 🌐 Application URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/health

## 🎯 What Can I Do?

### As Any User
1. **Generate Passwords** - Go to Generate tab
   - Customize length (8-128 characters)
   - Choose character types
   - See strength meter

2. **Save & Share** - Save passwords with options
   - Set expiration dates
   - Limit access counts
   - Get shareable links

3. **Manage Passwords** - View in Dashboard
   - See all saved passwords
   - Copy links
   - Delete passwords

### As Admin
1. **User Management**
   - Create new users
   - Activate/deactivate accounts
   - Delete users

2. **View Logs**
   - See all password accesses
   - Filter by user, type, date
   - Track IP addresses

3. **Statistics**
   - Total users & passwords
   - Access counts
   - Activity trends

## 🔧 Troubleshooting

### "Cannot connect to database"
- Start PostgreSQL: `docker compose up -d`
- Or check your PostgreSQL service is running
- Verify `DATABASE_URL` in `backend/.env`

### "Port already in use"
- Kill process on port 3000: `npx kill-port 3000`
- Kill process on port 3001: `npx kill-port 3001`
- Or change ports in configs

### "Module not found"
```bash
# Clean install
rm -rf node_modules
npm install
```

### "Migration failed"
```bash
# Reset database
docker compose down -v
docker compose up -d
npm run migrate --workspace=backend
npm run seed --workspace=backend
```

## 📱 Features

✅ Secure password generation
✅ AES-256-CBC encryption
✅ Shareable links with GUID
✅ Expiration dates
✅ Access count limits
✅ User authentication
✅ Admin panel
✅ Audit logging
✅ Responsive design
✅ Copy to clipboard

## 🔒 Security

- Passwords encrypted with AES-256-CBC
- User accounts use bcrypt hashing
- JWT authentication (24h tokens)
- Rate limiting on login (5 attempts/15min)
- CORS protection
- Security headers via Helmet.js
- Complete audit trail

## 📚 More Info

- **Full Setup:** See `SETUP.md`
- **Implementation:** See `IMPLEMENTATION_COMPLETE.md`
- **Project Info:** See `README.md`

## 🆘 Need Help?

1. Check `SETUP.md` for detailed instructions
2. Review `IMPLEMENTATION_COMPLETE.md` for features
3. Check error messages in terminal
4. Verify all prerequisites are installed

## ✅ Quick Test

After starting:

1. Open http://localhost:3000
2. Login with admin/Admin123!
3. Go to Generate tab
4. Generate a password
5. Save it with a title
6. Check Dashboard - password should appear
7. Copy the shareable link
8. Open link in incognito window - password should decrypt

**Everything working? You're all set! 🎉**

## 🚀 Production Deployment

For production, remember to:
- [ ] Change encryption keys
- [ ] Change JWT secret
- [ ] Use managed PostgreSQL
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Update CORS origins
- [ ] Change admin password
- [ ] Set up monitoring

Enjoy Password Pal! 🔐
