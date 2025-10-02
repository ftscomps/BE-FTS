# 🚀 Railway Deployment Guide

Guide untuk deploy FTS Backend API ke Railway platform.

## 📋 Prerequisites

- Railway account (https://railway.app)
- GitHub repository dengan kode backend
- Cloudinary account untuk image storage
- Railway PostgreSQL database

## 🔧 Environment Variables

Set environment variables berikut di Railway dashboard:

### Database Configuration

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
```

### JWT Configuration

```bash
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-characters"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

### Cloudinary Configuration

```bash
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
CLOUDINARY_FOLDER="projects"
```

### Server Configuration

```bash
NODE_ENV="production"
PORT="3000"
API_VERSION="v1"
```

### CORS Configuration

```bash
FRONTEND_URL="https://your-frontend-domain.com"
ALLOWED_ORIGINS="https://your-frontend-domain.com,https://admin.your-domain.com"
```

### Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
```

### File Upload

```bash
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="5242880"
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp"
```

## 📝 Deployment Steps

### 1. Push Code ke GitHub

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Setup Railway Project

1. Login ke Railway dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Pilih repository FTS Backend
4. Railway akan otomatis mendeteksi Node.js application

### 3. Configure Environment Variables

1. Di Railway dashboard, buka tab "Variables"
2. Tambahkan semua environment variables di atas
3. Pastikan Railway PostgreSQL sudah ter-setup

### 4. Setup Database

1. Railway akan otomatis membuat PostgreSQL database
2. Copy `DATABASE_URL` dari Railway database settings
3. Tambahkan ke environment variables

### 5. Run Database Migrations

Railway akan otomatis menjalankan build script. Tambahkan script berikut ke `package.json`:

```json
{
	"scripts": {
		"start": "node dist/server.js",
		"build": "npm run prisma:generate && npm run prisma:deploy && npm run build:ts",
		"build:ts": "tsc",
		"prisma:generate": "prisma generate",
		"prisma:deploy": "prisma migrate deploy",
		"seed:prod": "ts-node prisma/seed-prod.ts"
	}
}
```

### 6. Configure Build Settings

Di `railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
PORT = "3000"
```

### 7. Deploy

1. Railway akan otomatis deploy setiap push ke main branch
2. Monitor deployment logs di Railway dashboard
3. Tunggu hingga deployment selesai

## 🔍 Post-Deployment Checklist

### 1. Verify Health Check

Buka health endpoint:

```
https://your-app-name.up.railway.app/health
```

Expected response:

```json
{
	"status": "ok",
	"timestamp": "2024-01-01T00:00:00.000Z",
	"uptime": 123.456,
	"environment": "production",
	"version": "1.0.0"
}
```

### 2. Test Database Connection

Buka detailed health endpoint:

```
https://your-app-name.up.railway.app/health/detailed
```

### 3. Seed Production Data

Jika ini deployment pertama, jalankan seeding:

1. Buka Railway dashboard
2. Pilih project backend
3. Klik "New" → "One-off Script"
4. Run command: `npm run seed:prod`

### 4. Test Authentication

Test login endpoint:

```bash
curl -X POST https://your-app-name.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fts.biz.id",
    "password": "adminmas123"
  }'
```

### 5. Verify API Endpoints

Test beberapa endpoint utama:

```bash
# Get projects
curl https://your-app-name.up.railway.app/api/v1/projects

# Health check
curl https://your-app-name.up.railway.app/health
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Problem**: `Error: P2021: The database connection failed`

**Solution**:

- Verify `DATABASE_URL` environment variable
- Check Railway PostgreSQL status
- Ensure database is not paused

#### 2. JWT Secret Error

**Problem**: `JWT_SECRET is not set properly`

**Solution**:

- Set `JWT_SECRET` dengan minimum 32 characters
- Restart deployment setelah mengubah environment variables

#### 3. Cloudinary Upload Error

**Problem**: `Cloudinary API error`

**Solution**:

- Verify Cloudinary credentials
- Check `CLOUDINARY_FOLDER` setting
- Ensure Cloudinary account is active

#### 4. Build Failed

**Problem**: TypeScript compilation errors

**Solution**:

- Check build logs di Railway dashboard
- Fix TypeScript errors locally sebelum deploy
- Ensure `tsconfig.json` configuration is correct

#### 5. Health Check Failed

**Problem**: Health check returning 503

**Solution**:

- Check application logs
- Verify all required environment variables
- Ensure database connection is working

### Debug Commands

Untuk debugging di Railway:

1. **View Logs**: Dashboard → Select project → View logs
2. **Access Console**: Dashboard → Select project → Console
3. **Restart Deployment**: Dashboard → Select project → Restart
4. **Check Environment**: Dashboard → Select project → Variables

## 📊 Monitoring

### Railway Monitoring

- **Metrics**: Dashboard → Metrics
- **Logs**: Real-time application logs
- **Uptime**: Service health monitoring
- **Resource Usage**: CPU, Memory, Storage

### Custom Monitoring

Gunakan endpoints untuk monitoring:

- `/health` - Basic health check
- `/health/detailed` - Detailed system status
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

## 🔒 Security Considerations

### Production Security

1. **Environment Variables**: Never commit secrets ke Git
2. **HTTPS**: Railway otomatis menyediakan SSL
3. **Rate Limiting**: Sudah dikonfigurasi di middleware
4. **Input Validation**: Semua input divalidasi dengan Zod
5. **Password Security**: Bcrypt dengan salt rounds 12

### Security Headers

Security headers sudah dikonfigurasi via Helmet.js:

- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

## 🚀 Performance Optimization

### Railway Performance

1. **Region**: Pilih region terdekat dengan users
2. **Plan**: Upgrade plan jika needed untuk production
3. **Database**: Gunakan Railway PostgreSQL untuk production
4. **CDN**: Cloudinary provides CDN untuk images

### Application Performance

1. **Database Indexing**: Sudah di-setup di Prisma schema
2. **Image Optimization**: Sharp processing untuk uploads
3. **Caching**: Implementasi caching jika needed
4. **Compression**: Gzip compression via Express

## 📱 Frontend Integration

Update frontend configuration untuk production:

```javascript
// API Base URL
const API_BASE_URL = 'https://your-app-name.up.railway.app/api/v1';

// Frontend URL untuk CORS
const FRONTEND_URL = 'https://your-frontend-domain.com';
```

## 🔄 CI/CD Pipeline

Railway menyediakan automatic deployment:

1. **Push to main** → Automatic deployment
2. **Pull requests** → Preview deployments
3. **Rollback**: Dashboard → Deployments → Rollback

## 📞 Support

Untuk issues dengan deployment:

1. **Railway Documentation**: https://docs.railway.app
2. **Railway Support**: support@railway.app
3. **Project Issues**: Check GitHub issues
4. **Community**: Railway Discord community

---

## 🎯 Deployment Summary

✅ **Configuration Complete**: Railway.toml dan environment variables  
✅ **Database Ready**: PostgreSQL dengan Prisma migrations  
✅ **Security Setup**: JWT, rate limiting, CORS, security headers  
✅ **Monitoring**: Health checks dan logging  
✅ **Testing**: Unit dan integration tests  
✅ **Documentation**: Complete deployment guide

**Next Steps**:

1. Deploy ke Railway
2. Test semua endpoints
3. Setup monitoring alerts
4. Configure backup strategy
5. Update frontend integration

---

**Status**: Ready for production deployment 🚀
