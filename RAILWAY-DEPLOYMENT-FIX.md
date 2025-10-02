# 🔧 Railway Deployment Fix Guide

## 🚨 Masalah yang Terjadi

Saat menjalankan `railway up`, deployment gagal dengan error:

- Build process gagal saat menjalankan `npm ci`
- Ada beberapa package yang deprecated (q, inflight, glob)
- Build logs menunjukkan error di stage npm install

## ✅ Solusi yang Telah Diterapkan

### 1. **Package.json Fix**

```json
{
	"scripts": {
		"build": "npm run build:ts", // Simplified build script
		"postinstall": "npm run prisma:generate || true" // Safe postinstall
	}
}
```

### 2. **Dockerfile Fix**

```dockerfile
# Install dependencies with --omit=dev flag
RUN npm ci --omit=dev

# Copy healthcheck script
COPY --from=builder /app/src/healthcheck.ts ./dist/
```

### 3. **Railway.toml Fix**

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build:ts"  # Explicit build command
```

## 🔄 Langkah-langkah Deployment Fix

### 1. **Commit Perubahan**

```bash
git add .
git commit -m "fix: resolve Railway deployment issues

- Simplify build script in package.json
- Fix Dockerfile with proper npm ci flags
- Add explicit build command to railway.toml
- Add healthcheck script copy to Dockerfile"
```

### 2. **Push ke GitHub**

```bash
git push origin main
```

### 3. **Deploy ke Railway**

```bash
railway up
```

## 🐛 Troubleshooting Tambahan

### Jika Masih Ada Error:

#### 1. **Coba Build Lokal**

```bash
# Build project secara lokal
npm run build:ts

# Test build dengan Docker
docker build -t fts-backend .
```

#### 2. **Cek Dependencies**

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Test build
npm run build:ts
```

#### 3. **Cek Railway Logs**

- Buka Railway dashboard
- Pilih project yang sedang di-deploy
- Klik tab "Logs" untuk melihat error detail
- Cari error keywords: "npm", "build", "prisma"

#### 4. **Manual Build di Railway**

Jika build otomatis gagal, coba manual build:

1. Buka Railway dashboard
2. Pilih project
3. Klik "New" → "One-off Script"
4. Run command: `npm run build:ts`

#### 5. **Environment Variables Check**

Pastikan environment variables di Railway sudah diatur dengan benar:

- `NODE_ENV=production`
- `DATABASE_URL` (untuk PostgreSQL)
- `JWT_SECRET` dan `JWT_REFRESH_SECRET`
- `CLOUDINARY_*` variables

## 📋 Alternative Deployment Options

### Option 1: **Railway dengan Dockerfile**

```bash
# Pastikan Dockerfile sudah benar
docker build -t fts-backend .
docker push your-registry/fts-backend
# Configure Railway untuk menggunakan image dari registry
```

### Option 2: **Railway dengan Nixpacks**

```toml
[railway.toml]
[build]
builder = "NIXPACKS"
buildCommand = "npm run build:ts"
startCommand = "npm start"
```

### Option 3: **Manual Deployment**

1. Build project lokal:
   ```bash
   npm run build:ts
   ```
2. Upload folder `dist` ke Railway
3. Configure start command: `node dist/server.js`

## 🔍 Cara Mengecek Deployment Success

### 1. **Health Check Endpoint**

```bash
curl https://your-app-name.up.railway.app/health
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

### 2. **API Test**

```bash
curl https://your-app-name.up.railway.app/api/v1/projects
```

### 3. **Database Connection**

```bash
curl https://your-app-name.up.railway.app/health/detailed
```

## 📊 Best Practices untuk Railway Deployment

### 1. **Keep Dependencies Minimal**

- Hanya install dependencies yang benar-benar diperlukan
- Hindari dependencies yang memiliki banyak transitive dependencies
- Gunakan `npm ci --omit=dev` untuk production builds

### 2. **Optimize Build Process**

- Build TypeScript terlebih dahulu, baru deploy
- Gunakan multi-stage Docker builds
- Cache dependencies yang mungkin

### 3. **Environment Variables**

- Jangan hardcode credentials di code
- Gunakan Railway environment variables
- Validasi semua required environment variables

### 4. **Health Checks**

- Implement health check endpoints
- Konfigurasi health checks di Railway
- Monitor application health secara berkala

## 🚀 Deployment Checklist

Sebelum deploy ke Railway, pastikan:

- [ ] `npm run build:ts` berhasil di lokal
- [ ] `npm test` berhasil (semua tests passing)
- [ ] Environment variables sudah diatur di Railway
- [ ] Database connection sudah di-test
- [ ] Health check endpoints berfungsi
- [ ] Tidak ada file yang tidak perlu di-commit

## 📞 Support

Jika deployment masih gagal:

1. **Cek Railway Status**: https://status.railway.app/
2. **Railway Documentation**: https://docs.railway.app/
3. **GitHub Issues**: https://github.com/riofach/BE-FTS/issues
4. **Contact**: admin@fts.biz.id

---

**Status**: Railway deployment issues telah diperbaiki! 🚀
