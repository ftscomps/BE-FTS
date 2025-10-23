# Backend Required - Blog Stats Endpoint

## 🔴 URGENT: Missing Endpoint

**Status**: ❌ Not Implemented atau Ada Bug

**Endpoint**: `GET /api/v1/blogs/stats`

**Current Error**: 
```
GET https://be-fts-production.up.railway.app/api/v1/blogs/stats
→ 500 Internal Server Error
```

---

## 📋 Required Implementation

### Endpoint Specification

**Method**: `GET`

**URL**: `/api/v1/blogs/stats`

**Auth**: Optional (return all stats if authenticated admin, return public stats if not authenticated)

**Response Format**:
```json
{
  "success": true,
  "data": {
    "totalBlogs": 10,
    "totalPublished": 8,
    "totalDrafts": 2,
    "totalViews": 1234,
    "totalCategories": 5,
    "totalTags": 15
  }
}
```

---

## 💻 Implementation Example (Node.js + Express)

### Option 1: Simple SQL Query (Recommended)

```javascript
// routes/blogs.js
router.get('/stats', async (req, res) => {
  try {
    // Query blog stats
    const stats = await db.query(`
      SELECT 
        COUNT(*) as totalBlogs,
        SUM(CASE WHEN isPublished = true THEN 1 ELSE 0 END) as totalPublished,
        SUM(CASE WHEN isPublished = false THEN 1 ELSE 0 END) as totalDrafts,
        SUM(views) as totalViews
      FROM blogs
    `);
    
    // Query category count
    const categoryCount = await db.query('SELECT COUNT(*) as count FROM categories');
    
    // Query tag count  
    const tagCount = await db.query('SELECT COUNT(*) as count FROM tags');
    
    res.json({
      success: true,
      data: {
        totalBlogs: parseInt(stats[0].totalBlogs) || 0,
        totalPublished: parseInt(stats[0].totalPublished) || 0,
        totalDrafts: parseInt(stats[0].totalDrafts) || 0,
        totalViews: parseInt(stats[0].totalViews) || 0,
        totalCategories: parseInt(categoryCount[0].count) || 0,
        totalTags: parseInt(tagCount[0].count) || 0
      }
    });
  } catch (error) {
    console.error('Blog stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog statistics'
    });
  }
});
```

### Option 2: MongoDB Aggregation

```javascript
// routes/blogs.js
router.get('/stats', async (req, res) => {
  try {
    // Blog stats aggregation
    const blogStats = await Blog.aggregate([
      {
        $group: {
          _id: null,
          totalBlogs: { $sum: 1 },
          totalPublished: {
            $sum: { $cond: ['$isPublished', 1, 0] }
          },
          totalDrafts: {
            $sum: { $cond: ['$isPublished', 0, 1] }
          },
          totalViews: { $sum: '$views' }
        }
      }
    ]);
    
    const categoryCount = await Category.countDocuments();
    const tagCount = await Tag.countDocuments();
    
    const stats = blogStats[0] || {
      totalBlogs: 0,
      totalPublished: 0,
      totalDrafts: 0,
      totalViews: 0
    };
    
    res.json({
      success: true,
      data: {
        ...stats,
        totalCategories: categoryCount,
        totalTags: tagCount
      }
    });
  } catch (error) {
    console.error('Blog stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog statistics'
    });
  }
});
```

---

## 🧪 Testing

### Test Case 1: Basic Stats
```bash
curl -X GET https://be-fts-production.up.railway.app/api/v1/blogs/stats
```

**Expected**:
```json
{
  "success": true,
  "data": {
    "totalBlogs": 2,
    "totalPublished": 2,
    "totalDrafts": 0,
    "totalViews": 123,
    "totalCategories": 3,
    "totalTags": 8
  }
}
```

### Test Case 2: Empty Database
```json
{
  "success": true,
  "data": {
    "totalBlogs": 0,
    "totalPublished": 0,
    "totalDrafts": 0,
    "totalViews": 0,
    "totalCategories": 0,
    "totalTags": 0
  }
}
```

---

## 🔍 Debugging Current 500 Error

**Kemungkinan penyebab**:

1. ✅ **Route belum didefinisikan**
   - Check: `routes/blogs.js` atau `routes/blogRoutes.js`
   - Fix: Add route handler untuk `/stats`

2. ✅ **Database connection error**
   - Check: Database credentials dan connection
   - Fix: Ensure DB connected sebelum query

3. ✅ **Query error (SQL syntax atau field tidak exist)**
   - Check: Blog table structure
   - Fix: Adjust query sesuai actual table schema

4. ✅ **Missing error handling**
   - Check: Try-catch block ada?
   - Fix: Add proper error handling

---

## 📊 Field Requirements dari Frontend

Frontend butuh fields ini (sesuai interface `BlogStatsResponse`):

```typescript
interface BlogStatsResponse {
  totalBlogs: number;        // ✅ REQUIRED
  totalPublished: number;    // ✅ REQUIRED
  totalDrafts: number;       // ✅ REQUIRED
  totalViews: number;        // ✅ REQUIRED (sum of all blog views)
  totalCategories: number;   // ✅ REQUIRED
  totalTags: number;         // ✅ REQUIRED
}
```

**Used in**: Admin Dashboard (card "Total Blogs" dan "Total Views")

---

## ⚠️ Frontend Behavior (Current)

**Graceful Degradation Implemented**:
- ✅ Dashboard TIDAK crash jika endpoint gagal
- ✅ Show default values (0) untuk blog stats
- ✅ Show toast notification: "Blog Stats Unavailable"
- ✅ Other dashboard data tetap load normal

**This means**: 
- Dashboard masih functional tanpa blog stats
- Tapi user experience tidak optimal (show 0 for all blog metrics)
- **Backend fix needed ASAP untuk complete UX**

---

## 🚀 Priority

**Priority**: 🔴 HIGH

**Reason**: 
- Admin dashboard feature incomplete tanpa blog stats
- User confusion (why blog stats show 0 padahal ada blogs)
- Frontend sudah implement, hanya tunggu backend

**Estimated Effort**: 15-30 minutes

**Impact**: HIGH (improve admin dashboard UX significantly)

---

## ✅ Checklist untuk Backend Team

- [ ] Implement endpoint `GET /api/v1/blogs/stats`
- [ ] Return proper JSON format (see specification above)
- [ ] Add error handling (try-catch)
- [ ] Test dengan database yang ada blogs
- [ ] Test dengan empty database
- [ ] Deploy ke production
- [ ] Verify endpoint di production: `curl https://be-fts-production.up.railway.app/api/v1/blogs/stats`

---

**Created**: ${new Date().toISOString().split('T')[0]}  
**Frontend Contact**: Rio  
**Frontend PR**: Dashboard cards update (Total Blogs & Total Views)  
**Blocked By**: Backend endpoint `/blogs/stats` not implemented
