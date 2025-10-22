# 🚀 Railway Deployment Guide - FTS Backend API

## 📋 Prerequisites

- ✅ Railway account (https://railway.app)
- ✅ GitHub repository connected to Railway
- ✅ PostgreSQL database provisioned di Railway
- ✅ Cloudinary account untuk file uploads

---

## 🔧 Step 1: Fix Deployment Configuration

### ✅ Files Already Updated:

1. **`nixpack.toml`** - Fixed build configuration
   - ✅ Install ALL dependencies (not --omit=dev)
   - ✅ Run `prisma generate` before build
   - ✅ Run `prisma migrate deploy` untuk sync database schema
   - ✅ Build TypeScript after Prisma setup

2. **`railway.toml`** - Fixed build command
   - ✅ Sequential build: install → prisma generate → migrate → build
   - ✅ Health check endpoint configured
   - ✅ Auto-restart on failure

---

## 🗄️ Step 2: Setup PostgreSQL Database

### Option A: Railway PostgreSQL Plugin (Recommended)

1. **Add PostgreSQL Plugin:**
   ```
   Railway Dashboard → Your Project → + New → Database → PostgreSQL
   ```

2. **Connect to Service:**
   - Railway will auto-generate `DATABASE_URL` environment variable
   - Format: `postgresql://user:password@host:port/railway`
   - This will be automatically available to your app

3. **Verify DATABASE_URL:**
   ```bash
   # Di Railway Dashboard → Variables tab
   # Check that DATABASE_URL exists dan format correct:
   postgresql://postgres:PASSWORD@HOST:5432/railway
   ```

### Option B: External PostgreSQL

1. **Set DATABASE_URL manually:**
   ```bash
   # Format:
   postgresql://username:password@host:port/database_name
   
   # Example:
   postgresql://myuser:mypassword@db.example.com:5432/production_db
   ```

---

## 🔐 Step 3: Set Environment Variables

### Required Environment Variables di Railway:

Go to: **Railway Dashboard → Your Service → Variables**

```bash
# 1. Database (Auto-generated jika pakai Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/railway

# 2. JWT Secrets (WAJIB - Generate random strings!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-min-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 3. Cloudinary (WAJIB untuk file uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_FOLDER=fts-projects

# 4. CORS Configuration
FRONTEND_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# 5. Node Environment (Auto-set by Railway)
NODE_ENV=production
PORT=3000

# 6. Logging (Optional)
LOG_LEVEL=info

# 7. Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 🔑 Generate Secure JWT Secrets:

```bash
# Menggunakan Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Atau menggunakan OpenSSL:
openssl rand -hex 32
```

---

## 📦 Step 4: Deploy to Railway

### Method 1: Auto-Deploy (GitHub Integration)

1. **Connect GitHub Repository:**
   ```
   Railway Dashboard → New Project → Deploy from GitHub → Select Repository
   ```

2. **Railway will automatically:**
   - ✅ Detect Node.js project
   - ✅ Use `nixpack.toml` configuration
   - ✅ Run build commands
   - ✅ Deploy your app

3. **Monitor Build Logs:**
   ```
   Railway Dashboard → Your Service → Deployments → View Logs
   ```

4. **Expected Build Output:**
   ```
   ✓ npm ci
   ✓ npx prisma generate (Prisma Client generated)
   ✓ npx prisma migrate deploy (Migrations applied)
   ✓ npm run build:ts (TypeScript compiled)
   ✓ Deployment successful
   ```

### Method 2: Manual Deploy (Railway CLI)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

---

## 🩺 Step 5: Verify Deployment

### 1. Check Health Endpoint:

```bash
# Replace with your Railway domain
curl https://your-app.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T...",
  "uptime": 123.456,
  "database": "connected",
  "version": "1.0.0"
}
```

### 2. Check Database Connection:

```bash
# Check logs di Railway Dashboard
# Look for:
✅ Database connected successfully
✅ Prisma Client initialized
```

### 3. Test API Endpoints:

```bash
# Test blogs endpoint
curl https://your-app.up.railway.app/api/v1/blogs

# Expected: JSON response dengan blog list
```

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "Database does not exist" Error

**Error Message:**
```
Database `raiIway` does not exist
```

**Root Cause:**
- DATABASE_URL tidak set dengan benar
- Atau typo di database name

**Solution:**
1. **Check DATABASE_URL format:**
   ```bash
   # Correct format:
   postgresql://user:password@host:port/database_name
   
   # Railway PostgreSQL format:
   postgresql://postgres:PASSWORD@containers-us-west-XXX.railway.app:5432/railway
   ```

2. **Verify di Railway Dashboard:**
   - Go to: Variables tab
   - Check DATABASE_URL value
   - Pastikan tidak ada typo atau extra spaces

3. **Re-deploy after fix:**
   ```bash
   # Railway will auto-redeploy if connected to GitHub
   # Or manually trigger via Dashboard
   ```

### Issue 2: Prisma Client Not Generated

**Error Message:**
```
Cannot find module '@prisma/client'
```

**Solution:**
1. Check build logs - ensure `prisma generate` runs successfully
2. Verify `postinstall` script di package.json
3. Redeploy with fixed `nixpack.toml` (already done ✅)

### Issue 3: TypeScript Build Fails

**Error Message:**
```
tsc: command not found
```

**Solution:**
- ✅ Already fixed: `npm ci` (without --omit=dev) installs TypeScript
- Check build logs for errors
- Ensure `tsconfig.json` is valid

### Issue 4: Migrations Failed

**Error Message:**
```
Migration failed: ...
```

**Solution:**
1. **Check database connection:**
   ```bash
   # Via Railway CLI
   railway run npx prisma migrate status
   ```

2. **Manually run migrations:**
   ```bash
   railway run npx prisma migrate deploy
   ```

3. **Reset database (DANGER - only for fresh start):**
   ```bash
   railway run npx prisma migrate reset --force
   ```

### Issue 5: CORS Errors

**Error in Browser Console:**
```
Access to fetch at '...' has been blocked by CORS policy
```

**Solution:**
1. Set `FRONTEND_URL` di Railway environment variables
2. Set `ALLOWED_ORIGINS` dengan semua domain yang valid
3. Redeploy after changes

---

## 🔄 Update/Redeploy Process

### When You Make Code Changes:

1. **Commit & Push to GitHub:**
   ```bash
   git add .
   git commit -m "fix: your changes"
   git push origin main
   ```

2. **Railway Auto-Deploy:**
   - Railway detects push
   - Triggers new deployment
   - Monitor via Dashboard

### When You Update Database Schema:

1. **Create migration locally:**
   ```bash
   npm run prisma:migrate  # Creates migration file
   ```

2. **Commit migration files:**
   ```bash
   git add prisma/migrations/
   git commit -m "db: add new field to blogs table"
   git push origin main
   ```

3. **Railway will automatically:**
   - Run `prisma migrate deploy` during build
   - Apply new migrations to production database

---

## 📊 Monitoring & Logs

### View Deployment Logs:

```
Railway Dashboard → Your Service → Deployments → Select Deployment → View Logs
```

### View Runtime Logs:

```
Railway Dashboard → Your Service → View Logs (top right)
```

### Key Logs to Monitor:

```bash
# Successful startup:
✅ Database connected successfully
✅ Server running on port 3000
✅ Health check endpoint: /health

# Errors to watch:
❌ Database connection failed
❌ Prisma Client not initialized
❌ TypeScript compilation errors
```

---

## 🎯 Best Practices

### 1. Environment Variables:
- ✅ Never commit `.env` file
- ✅ Use Railway Variables tab untuk secrets
- ✅ Generate strong JWT secrets (min 32 characters)

### 2. Database Migrations:
- ✅ Always test migrations locally first
- ✅ Use `prisma migrate deploy` di production (not `migrate dev`)
- ✅ Commit migration files to Git

### 3. Deployment:
- ✅ Monitor build logs setiap deployment
- ✅ Test health endpoint after deploy
- ✅ Check error logs jika ada issues

### 4. Security:
- ✅ Use HTTPS only (Railway auto-provides)
- ✅ Set proper CORS origins
- ✅ Enable rate limiting
- ✅ Rotate JWT secrets periodically

---

## 🔗 Useful Links

- **Railway Docs**: https://docs.railway.app
- **Prisma Docs**: https://www.prisma.io/docs
- **Nixpacks Docs**: https://nixpacks.com/docs

---

## 📝 Deployment Checklist

Before deploying, ensure:

- [ ] PostgreSQL database provisioned di Railway
- [ ] DATABASE_URL environment variable set
- [ ] JWT_SECRET dan JWT_REFRESH_SECRET set (min 32 chars)
- [ ] Cloudinary credentials set (CLOUD_NAME, API_KEY, API_SECRET)
- [ ] FRONTEND_URL dan ALLOWED_ORIGINS configured
- [ ] `nixpack.toml` dan `railway.toml` up to date
- [ ] All migrations committed to Git
- [ ] Code pushed to GitHub main branch
- [ ] Build logs checked untuk errors
- [ ] Health endpoint verified (returns 200 OK)
- [ ] API endpoints tested
- [ ] Frontend can connect to backend

---

**Last Updated:** $(date)
**Status:** ✅ Ready for Production Deployment
**Version:** 1.0.0

---

## 🆘 Need Help?

If deployment masih gagal after following guide ini:

1. **Check Build Logs** di Railway Dashboard
2. **Verify Environment Variables** (especially DATABASE_URL)
3. **Test Database Connection** via Railway CLI
4. **Check Prisma Migrations Status**
5. **Review error messages** dan match dengan Troubleshooting section

**Common Fix:** Redeploy setelah environment variables di-set dengan benar!
