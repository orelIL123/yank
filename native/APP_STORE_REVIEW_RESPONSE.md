# תשובה לסקירת App Store - הינוקא

## Submission ID: 3cfaa6d9-85b1-4f23-a5f0-a7816e20f20d

---

## Guideline 2.1 - Information Needed

### תשובות לשאלות:

**1. Who are the users that will use the paid content, subscriptions, features, and services in the app?**

**תשובה:** אין תוכן בתשלום באפליקציה. כל התוכן באפליקציה זמין בחינם לכל המשתמשים ללא כל תשלום. האפליקציה היא אפליקציה חינוכית-דתית המספקת תוכן רוחני ללא כל עלות.

**Answer:** There is NO paid content in the app. All content in the app is completely free and available to all users without any payment. The app is an educational-religious app that provides spiritual content at no cost.

---

**2. Where can users purchase the content, subscriptions, features, and services that can be accessed in the app?**

**תשובה:** אין אפשרות לרכוש תוכן, מנויים או שירותים באפליקציה. כל התוכן זמין בחינם. ההרשמה היחידה היא אופציונלית ומשמשת רק למשתמשים שמעוניינים שמישהו יתפלל עבורם (תפילות בקשות) - גם זה ללא תשלום.

הדבר היחיד שקשור לכסף באפליקציה הוא מסך תרומה אופציונלי לחלוטין, שמיועד לתמיכה במוסדות. זה לא קשור לאפליקציה עצמה או לתוכן שלה - זה החלטה של המשתמש אם הוא רוצה לתמוך במוסדות, ואין שום קשר בין התרומה לבין גישה לתוכן או תכונות באפליקציה.

**Answer:** There is NO option to purchase content, subscriptions, or services in the app. All content is available for free. The only registration is optional and is used only for users who want someone to pray for them (prayer requests) - this is also free of charge.

The only thing related to money in the app is an optional donation screen, intended for supporting institutions. This is completely unrelated to the app itself or its content - it is the user's decision if they want to support institutions, and there is no connection between the donation and access to content or features in the app.

---

**3. What specific types of previously purchased content, subscriptions, features, and services can a user access in the app?**

**תשובה:** אין תוכן שנרכש בעבר. כל התוכן זמין בחינם ללא צורך ברכישה או מנוי. אין מנויים או תוכן בתשלום באפליקציה.

**Answer:** There is NO previously purchased content. All content is available for free without the need for purchase or subscription. There are no subscriptions or paid content in the app.

---

**4. What paid content, subscriptions, or features are unlocked within your app that do not use in-app purchase?**

**תשובה:** אין תוכן בתשלום, מנויים או תכונות בתשלום באפליקציה. כל התוכן זמין בחינם. אין שימוש ב-In-App Purchase כי אין שום דבר למכור. האפליקציה מספקת תוכן חינוכי-דתי בחינם בלבד.

הדבר היחיד שקשור לכסף הוא מסך תרומה אופציונלי לחלוטין לתמיכה במוסדות, שאינו משפיע על שום תכונה או תוכן באפליקציה. התרומה היא החלטה של המשתמש בלבד ואינה קשורה לאפליקציה עצמה.

**Answer:** There is NO paid content, subscriptions, or paid features in the app. All content is available for free. In-App Purchase is not used because there is nothing to sell. The app provides educational-religious content for free only.

The only thing related to money is a completely optional donation screen for supporting institutions, which does not affect any feature or content in the app. The donation is solely the user's decision and is not related to the app itself.

---

## Guideline 2.1 - Performance - App Completeness

### תיקון הבאג בעמוד הפרופיל ב-iPad

**תיאור התיקון:**

תיקנו את בעיית התגובה בעמוד הפרופיל ב-iPad על ידי:

1. הוספת `SafeAreaView` לתמיכה נכונה ב-iPad
2. שיפור ה-`ScrollView` עם `contentContainerStyle` נכון
3. הוספת `bounces={true}` לשיפור חוויית המשתמש
4. בדיקת תגובה נכונה לכל הכפתורים והאלמנטים

האפליקציה נבדקה כעת על iPad Air (דור 5) ופועלת כצפוי.

**Fix Description:**

We fixed the Profile page responsiveness issue on iPad by:

1. Adding `SafeAreaView` for proper iPad support
2. Improving the `ScrollView` with proper `contentContainerStyle`
3. Adding `bounces={true}` for better user experience
4. Ensuring proper responsiveness for all buttons and elements

The app has been tested on iPad Air (5th generation) and now works as expected.

---

## Guideline 5.1.1(v) - Data Collection and Storage

### הוספת אפשרות מחיקת חשבון

**תיאור התכונה:**

הוספנו תכונת מחיקת חשבון מלאה באפליקציה:

1. **מיקום התכונה:** בעמוד הפרופיל, תחת כפתור ההתנתקות, יש כפתור "מחק חשבון" (אדום)

2. **תהליך המחיקה:**
   - המשתמש מקבל התראה עם הסבר ברור שהפעולה אינה הפיכה
   - המשתמש צריך לאשר את המחיקה
   - האפליקציה מוחקת:
     - את כל התחייבויות התפילה של המשתמש (prayer commitments)
     - את מסמך המשתמש ב-Firestore
     - את חשבון המשתמש ב-Firebase Authentication

3. **אבטחה:**
   - רק המשתמש עצמו יכול למחוק את החשבון שלו
   - אם נדרשת אימות מחדש, המשתמש מקבל הודעה ברורה

**Account Deletion Feature Description:**

We have added a complete account deletion feature in the app:

1. **Feature Location:** In the Profile page, below the logout button, there is a "Delete Account" button (red)

2. **Deletion Process:**
   - The user receives an alert with a clear explanation that the action is irreversible
   - The user must confirm the deletion
   - The app deletes:
     - All user's prayer commitments
     - The user document in Firestore
     - The user account in Firebase Authentication

3. **Security:**
   - Only the user themselves can delete their account
   - If re-authentication is required, the user receives a clear message

---

## סיכום

כל הבעיות שזוהו בסקירה תוקנו:

1. ✅ **תוכן בתשלום:** אין תוכן בתשלום - הכל חינם
2. ✅ **באג ב-iPad:** תוקן - עמוד הפרופיל עובד כעת כראוי
3. ✅ **מחיקת חשבון:** נוספה תכונת מחיקת חשבון מלאה

**Summary**

All issues identified in the review have been fixed:

1. ✅ **Paid Content:** No paid content - everything is free
2. ✅ **iPad Bug:** Fixed - Profile page now works correctly
3. ✅ **Account Deletion:** Added complete account deletion feature

---

## הערות נוספות

האפליקציה היא אפליקציה חינוכית-דתית המספקת תוכן רוחני בחינם. ההרשמה היחידה היא אופציונלית ומשמשת רק למשתמשים שמעוניינים שמישהו יתפלל עבורם - גם זה ללא תשלום. אין שום תוכן או תכונה שדורשת תשלום.

**מסך תרומה (Donation Screen):**

הדבר היחיד שקשור לכסף באפליקציה הוא מסך תרומה אופציונלי לחלוטין. מסך זה:
- **אינו קשור לאפליקציה עצמה** - הוא מיועד לתמיכה במוסדות בלבד
- **אינו משפיע על שום תכונה או תוכן** - כל התוכן זמין בחינם ללא קשר לתרומה
- **החלטה של המשתמש בלבד** - המשתמש בוחר אם הוא רוצה לתרום או לא
- **אינו דורש תשלום** - זה אופציונלי לחלוטין
- **אינו משתמש ב-In-App Purchase** - התרומה מתבצעת דרך קישור חיצוני (אם בכלל)

האפליקציה פועלת במלואה ללא כל תרומה, והתרומה היא רק דרך לתמוך במוסדות, לא חלק מהאפליקציה עצמה.

**Additional Notes**

The app is an educational-religious app that provides spiritual content for free. The only registration is optional and is used only for users who want someone to pray for them - this is also free of charge. There is no content or feature that requires payment.

**Donation Screen:**

The only thing related to money in the app is a completely optional donation screen. This screen:
- **Is not related to the app itself** - it is intended for supporting institutions only
- **Does not affect any feature or content** - all content is available for free regardless of donation
- **User's decision only** - the user chooses whether they want to donate or not
- **Does not require payment** - it is completely optional
- **Does not use In-App Purchase** - the donation is made through an external link (if at all)

The app functions fully without any donation, and the donation is only a way to support institutions, not part of the app itself.

