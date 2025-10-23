# Test Blog Stats Endpoint

## 🧪 Manual Testing Guide

### Prerequisites
- Backend server running
- Database connected
- At least 1 blog, category, and tag in database

---

## Test 1: Local Development Test

```bash
# Start server
npm run dev

# Test endpoint
curl http://localhost:3000/api/v1/blogs/stats
```

**Expected Response Format:**
```json
{
  "success": true,
  "data": {
    "total": <number>,
    "published": <number>,
    "draft": <number>,
    "totalViews": <number>,
    "totalCategories": <number>,
    "totalTags": <number>,
    "totalBlogs": <number>,
    "totalPublished": <number>,
    "totalDrafts": <number>,
    "byCategory": { ... },
    "byAuthor": { ... },
    "byTags": { ... },
    "recentBlogs": [ ... ],
    "popularBlogs": [ ... ]
  }
}
```

---

## Test 2: Production Test (After Deploy)

```bash
curl https://be-fts-production.up.railway.app/api/v1/blogs/stats
```

**Check:**
- ✅ Status code: 200
- ✅ Response has `success: true`
- ✅ `data.totalCategories` exists and is a number
- ✅ `data.totalTags` exists and is a number
- ✅ `data.totalBlogs` equals `data.total`
- ✅ `data.totalPublished` equals `data.published`
- ✅ `data.totalDrafts` equals `data.draft`

---

## Test 3: Browser DevTools Test

```javascript
// Paste di browser console
fetch('http://localhost:3000/api/v1/blogs/stats')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Success:', data.success);
    console.log('📊 Total Blogs:', data.data.totalBlogs);
    console.log('📝 Published:', data.data.totalPublished);
    console.log('📋 Drafts:', data.data.totalDrafts);
    console.log('👁️ Total Views:', data.data.totalViews);
    console.log('📁 Categories:', data.data.totalCategories);
    console.log('🏷️ Tags:', data.data.totalTags);
  });
```

---

## Test 4: Postman/Insomnia Test

**Request:**
```
Method: GET
URL: http://localhost:3000/api/v1/blogs/stats
Headers: (none required - public endpoint)
```

**Assertions:**
- Status code is 200
- Response time < 500ms
- Body has `success` field
- Body has `data` object
- `data.totalCategories` is a number >= 0
- `data.totalTags` is a number >= 0

---

## Test 5: Empty Database Test

```bash
# Reset database (CAUTION: Deletes all data!)
npx prisma migrate reset --force

# Test endpoint
curl http://localhost:3000/api/v1/blogs/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total": 0,
    "published": 0,
    "draft": 0,
    "totalViews": 0,
    "totalCategories": 0,
    "totalTags": 0,
    "totalBlogs": 0,
    "totalPublished": 0,
    "totalDrafts": 0,
    "byCategory": {},
    "byAuthor": {},
    "byTags": {},
    "recentBlogs": [],
    "popularBlogs": []
  }
}
```

---

## Verification Checklist

- [ ] Endpoint returns 200 OK
- [ ] Response has correct JSON structure
- [ ] `totalCategories` field exists
- [ ] `totalTags` field exists
- [ ] `totalBlogs` = `total` (alias works)
- [ ] `totalPublished` = `published` (alias works)
- [ ] `totalDrafts` = `draft` (alias works)
- [ ] All numbers are non-negative
- [ ] Empty database returns 0 for all counts
- [ ] Response time < 500ms
- [ ] No TypeScript errors in logs
- [ ] No Prisma errors in logs

---

## Expected Values (Sample Data)

If you have sample data in database:

```
Scenario: 10 total blogs
- Published: 8
- Drafts: 2
- Total Views: 1234
- Categories: 5
- Tags: 15
```

**Response should show:**
```json
{
  "total": 10,
  "totalBlogs": 10,
  "published": 8,
  "totalPublished": 8,
  "draft": 2,
  "totalDrafts": 2,
  "totalViews": 1234,
  "totalCategories": 5,
  "totalTags": 15
}
```

---

## Troubleshooting

### Issue: totalCategories is always 0

**Check:**
```sql
-- Connect to database
psql $DATABASE_URL

-- Check categories
SELECT COUNT(*) FROM categories;
```

**Fix:** Seed categories
```bash
npm run prisma:seed
```

### Issue: 500 Internal Server Error

**Check logs:**
```bash
# Development
tail -f logs/app.log

# Production (Railway)
railway logs
```

**Common causes:**
- Database not connected
- Prisma Client not generated
- Missing environment variables

---

**Created**: 2025-10-22  
**Purpose**: Manual testing guide for blog stats endpoint  
**Status**: Ready for testing
