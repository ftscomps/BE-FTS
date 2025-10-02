# 🧹 Git Cleanup Instructions

## 🔍 Masalah yang Terjadi

Sebelumnya, `node_modules` dan `.env` file sudah ter-commit ke Git repository. Ini adalah masalah serius karena:

- `node_modules` tidak boleh di-commit ke Git (ukuran besar dan tidak perlu)
- `.env` file berisi data sensitif yang tidak boleh di-commit
- Akan membuat repository size menjadi sangat besar

## ✅ Solusi yang Sudah Dilakukan

1. **Reset Git History**: Menggunakan `git reset --soft HEAD~1` untuk kembali ke commit sebelumnya
2. **Hapus File Tidak Perlu**: Menghapus `node_modules`, `logs`, dan `.env` file
3. **Clean Staging Area**: Menambahkan hanya file yang seharusnya di-commit
4. **Proper .gitignore**: Konfigurasi .gitignore yang benar
5. **Clean Commits**: Membuat commits baru yang bersih

## 📋 Langkah-langkah Setup Ulang yang Benar

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
# Copy dari template
cp .env.example .env

# Edit .env file dengan konfigurasi yang benar
# JANGAN COMMIT .env FILE!
```

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed initial data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

## 🚀 Best Practices untuk Git

### 1. Selalu Cek Sebelum Commit

```bash
# Lihat apa saja yang akan di-commit
git status

# Lihat perubahan yang akan di-commit
git diff --staged

# Lihat commit history
git log --oneline -5
```

### 2. Jangan Pernah Commit File Berikut:

- `node_modules/` - Install dari package.json
- `.env` - File konfigurasi sensitif
- `logs/` - File log aplikasi
- `uploads/` - File upload temporary
- `dist/` - Build output
- `.cache/` - Cache files
- `*.log` - Log files

### 3. Gunakan .gitignore yang Proper

Pastikan .gitignore sudah mengatur:

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*.tsbuildinfo

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Temporary folders
tmp/
temp/

# Logs
logs/
*.log

# Uploads
uploads/
!uploads/.gitkeep

# Prisma
prisma/migrations/
!prisma/migrations/.gitkeep
```

### 4. Gunakan Pre-commit Hooks (Optional)

```bash
# Install husky untuk pre-commit hooks
npm install --save-dev husky

# Setup pre-commit hooks
npx husky install

# Tambah ke package.json
"scripts": {
  "precommit": "npm run test && npm run lint",
  "prepush": "npm run test"
}
```

## 🔄 Jika Terjadi Masalah Lagi

### Jika Ada File Tidak Perlu di Commit:

```bash
# Reset ke commit sebelumnya
git reset --soft HEAD~1

# Hapus file tidak perlu
rm -rf node_modules logs .env

# Add hanya file yang perlu
git add .

# Commit ulang
git commit -m "fix: remove sensitive files and dependencies"
```

### Jika Ingin Reset Repository Sama Sekali:

```bash
# Hapus .git directory
rm -rf .git

# Inisialisasi repository baru
git init

# Add semua file yang perlu
git add .

# Commit awal
git commit -m "Initial commit: FTS Backend API"
```

### Jika Ingin Push ke Remote Repository:

```bash
# Force push (HATI-HATI, akan overwrite remote history)
git push --force-with-lease origin main
```

## 📊 Status Saat Ini

✅ **Git Repository Sudah Bersih**:

- Tidak ada `node_modules` di commit
- Tidak ada `.env` file di commit
- Tidak ada `logs` di commit
- Hanya file yang diperlukan di-commit
- `.gitignore` sudah proper
- `.gitkeep` files untuk empty directories

✅ **Project Siap Digunakan**:

- Dependencies dapat di-install dengan `npm install`
- Environment variables dapat di-setup dengan `.env.example`
- Database dapat di-setup dengan Prisma migrations
- Development server dapat dijalankan dengan `npm run dev`

## 🎯 Rekomendasi

1. **Selalu cek `git status` sebelum commit**
2. **Gunakan `.env.example` sebagai template untuk `.env`**
3. **Jangan lupa `npm install` setelah clone repository**
4. **Setup pre-commit hooks untuk mencegah kesalahan**
5. **Review changes sebelum push ke remote repository**

---

**Status**: Git repository sudah bersih dan siap digunakan! 🎉
