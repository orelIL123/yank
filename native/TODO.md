# 📋 TODO List - Remaining Migration Tasks

## 🔴 High Priority (Do First)

### 1. Test Migrated Screens
Test all fully migrated screens to ensure they work:

- [ ] **HomeScreen** - Test cards, music, pidyon, notifications
  - [ ] Cards load correctly
  - [ ] Music plays
  - [ ] Pidyon list shows
  - [ ] Unread notifications count works

- [ ] **BooksScreen** - Test book list and images
  - [ ] Books load
  - [ ] Images display
  - [ ] Buy buttons work

- [ ] **NewsScreen** - Test articles
  - [ ] Articles load
  - [ ] Dates format correctly
  - [ ] Share works

- [ ] **PrayersScreen** - Test prayers
  - [ ] Prayers load
  - [ ] Delete works (admin)

- [ ] **BeitMidrashScreen** - Test videos
  - [ ] Videos load
  - [ ] YouTube player works

- [ ] **NotificationsScreen** - Test notifications
  - [ ] Notifications load
  - [ ] Mark as read works

- [ ] **PidyonNefeshScreen** - Test pidyon
  - [ ] List loads
  - [ ] Add new works

- [ ] **MiBeitRabeinuScreen** - Test categories
  - [ ] Categories load
  - [ ] Videos per category load
  - [ ] Admin can add videos

### 2. Fix Remaining Screens

These screens still have Firestore code that needs to be replaced:

#### A. TzadikimScreen.jsx
**Issue:** Uses `startAfter()` pagination

**Fix:**
```javascript
// Replace the pagination logic around line 106-122
// Use db.getCollectionPaginated() instead

const tzadikim = await db.getCollectionPaginated('tzadikim', {
  orderBy: { field: 'name', direction: 'asc' },
  startAfter: offset,  // Track offset instead of lastVisible
  limit: 20
})
```

**Tasks:**
- [ ] Update loadTzadikim() function
- [ ] Replace `query()` with `db.getCollectionPaginated()`
- [ ] Update pagination state to use offset
- [ ] Test load more functionality

#### B. AdminScreen.jsx
**Issue:** Multiple `addDoc` calls for different collections

**Fix:** Replace all `addDoc()` with `db.addDocument()`

**Tasks:**
- [ ] Find all `addDoc(collection(db, ...))` calls
- [ ] Replace with `db.addDocument('collectionName', data)`
- [ ] Replace `Timestamp.now()` with `new Date().toISOString()`
- [ ] Replace `serverTimestamp()` with `new Date().toISOString()`
- [ ] Test adding books
- [ ] Test adding newsletters
- [ ] Test adding prayers
- [ ] Test adding news
- [ ] Test adding lessons
- [ ] Test adding notifications

#### C. DailyLearningScreen.jsx
**Issue:** Complex queries and updates

**Tasks:**
- [ ] Check for remaining `query(collection(db, ...))` calls
- [ ] Replace with `db.getCollection()`
- [ ] Check for `updateDoc` calls
- [ ] Replace with `db.updateDocument()`
- [ ] Test daily learning functionality

#### D. LongLessonsScreen.jsx & ShortLessonsScreen.jsx
**Issue:** Similar structure, need same fixes

**Tasks:**
- [ ] Replace `query()` with `db.getCollection()`
- [ ] Replace `addDoc()` with `db.addDocument()`
- [ ] Replace `updateDoc()` with `db.updateDocument()`
- [ ] Replace `deleteDoc()` with `db.deleteDocument()`
- [ ] Test adding lesson
- [ ] Test editing lesson
- [ ] Test deleting lesson

#### E. NewslettersScreen.jsx
**Issue:** Delete operations

**Tasks:**
- [ ] Replace `deleteDoc()` with `db.deleteDocument()`
- [ ] Test delete functionality

#### F. AddNewsletterScreen.jsx & AddPrayerScreen.jsx
**Issue:** Form submissions using `addDoc`

**Tasks:**
- [ ] Replace `addDoc()` with `db.addDocument()`
- [ ] Test form submission
- [ ] Verify data saves correctly

#### G. PrayerCommitmentScreen.jsx
**Issue:** Complex matching algorithm with nested queries

**Current State:** Partially migrated

**Options:**
1. **Simple approach:** Fetch all and filter client-side
2. **Complex approach:** Add support for complex queries to database service
3. **Backend approach:** Move matching logic to a cloud function

**Recommended:** Option 1 (simple)

**Tasks:**
- [ ] Review the matching logic (lines ~125-160)
- [ ] Decide on approach
- [ ] Implement the fix
- [ ] Test prayer commitment creation
- [ ] Test matching works correctly

---

## 🟡 Medium Priority

### 3. Database Service Enhancements

Add these features if needed:

- [ ] **Batch Operations**
  ```javascript
  async batchWrite(operations) {
    // Execute multiple operations in one transaction
  }
  ```

- [ ] **Better Pagination**
  ```javascript
  async getCollectionCursor(collectionName, options) {
    // Return cursor-based pagination
    // Return { data, nextCursor, hasMore }
  }
  ```

- [ ] **Search Functionality**
  ```javascript
  async searchCollection(collectionName, field, searchTerm) {
    // Full-text search using PostgreSQL
  }
  ```

### 4. Error Handling

Improve error messages:

- [ ] Add user-friendly error messages
- [ ] Add retry logic for network errors
- [ ] Add error logging/reporting
- [ ] Show loading states everywhere

### 5. Performance Optimization

- [ ] Add caching for frequently accessed data
- [ ] Lazy load images
- [ ] Optimize large lists with virtualization
- [ ] Monitor query performance

---

## 🟢 Low Priority (Nice to Have)

### 6. Code Quality

- [ ] Add TypeScript types to database service
- [ ] Add JSDoc comments
- [ ] Add unit tests for database service
- [ ] Add integration tests

### 7. Migration Cleanup

- [ ] Remove all unused Firestore imports
- [ ] Remove migration scripts after confirming everything works
- [ ] Update package.json (can remove some Firebase packages)

### 8. Documentation

- [ ] Add inline comments to database service
- [ ] Create video tutorial for team
- [ ] Document database schema
- [ ] Create migration guide for future developers

### 9. Future Enhancements

- [ ] Offline support with local storage
- [ ] Real-time sync improvements
- [ ] Migrate Firebase Auth to Supabase Auth (optional)
- [ ] Add analytics

---

## 🧪 Testing Checklist

### Manual Testing
Run through each screen and test:

- [ ] Data loads correctly
- [ ] Can add new items
- [ ] Can edit items
- [ ] Can delete items
- [ ] Images load
- [ ] Notifications work
- [ ] Real-time updates work
- [ ] No console errors

### Edge Cases
- [ ] Empty states display correctly
- [ ] Error states display user-friendly messages
- [ ] Loading states show spinners
- [ ] No data = proper empty message

### Performance Testing
- [ ] Large lists load quickly
- [ ] Pagination works smoothly
- [ ] Images load progressively
- [ ] No memory leaks

---

## 📊 Progress Tracker

### Overall Progress
- ✅ **Migration Started:** 100%
- ✅ **Core Service Created:** 100%
- ✅ **Main Screens Migrated:** 60% (9/15)
- ⏳ **Remaining Screens:** 40% (6/15)
- ⏳ **Testing:** 0%
- ⏳ **Deployment:** 0%

### By Category
- ✅ **Database Service:** 100%
- ✅ **HomeScreen:** 100%
- ✅ **Books:** 100%
- ✅ **News:** 100%
- ✅ **Prayers:** 100%
- ✅ **Beit Midrash:** 100%
- ✅ **Notifications:** 100%
- ✅ **Pidyon Nefesh:** 100%
- ✅ **Mi Beit Rabeinu:** 100%
- ⚠️ **Prayer Commitments:** 70%
- ❌ **Tzadikim:** 0%
- ❌ **Admin:** 0%
- ❌ **Daily Learning:** 20%
- ❌ **Lessons (Long/Short):** 20%
- ❌ **Newsletters:** 50%
- ❌ **Add Forms:** 0%

---

## 🎯 Immediate Next Steps

1. **Today:**
   - [ ] Test all migrated screens
   - [ ] Fix any bugs found
   - [ ] Start on TzadikimScreen

2. **This Week:**
   - [ ] Complete TzadikimScreen
   - [ ] Complete AdminScreen
   - [ ] Test everything thoroughly

3. **Next Week:**
   - [ ] Finish remaining screens
   - [ ] Deploy to staging
   - [ ] Get user feedback

---

## 📝 Notes

### Important Reminders
- Firebase Auth is still used - don't remove it!
- Always use `db.getCollection()` not Firestore directly
- Always use `new Date().toISOString()` not `Timestamp.now()`
- Test on both iOS and Android

### Common Patterns
```javascript
// ❌ Old way
const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'))
const snapshot = await getDocs(q)
const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

// ✅ New way
const books = await db.getCollection('books', {
  orderBy: { field: 'createdAt', direction: 'desc' }
})
```

---

**Last Updated:** December 26, 2025
**Status:** 🟡 In Progress (60% Complete)
