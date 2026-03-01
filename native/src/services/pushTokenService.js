import { arrayUnion, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db as firestoreDb } from '../config/firebase'
import supaDb from './database'
import { registerForPushNotificationsAsync, sendPushNotifications } from '../utils/notifications'

/**
 * Refresh push token and persist it in both Firestore and Supabase.
 * Optionally sends a test push notification to the same device token.
 */
export async function refreshPushToken(user, { sendTestPush = false } = {}) {
  if (!user?.uid) {
    return { ok: false, reason: 'missing_user' }
  }

  const token = await registerForPushNotificationsAsync()
  if (!token) {
    return { ok: false, reason: 'no_token' }
  }

  // Save token in Firestore users/{uid}
  await setDoc(
    doc(firestoreDb, 'users', user.uid),
    {
      email: user.email || null,
      expoPushTokens: arrayUnion(token),
      lastPushTokenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  // Mirror token in Supabase users table (best effort)
  try {
    let existingTokens = []
    try {
      const supaUser = await supaDb.getDocument('users', user.uid)
      if (Array.isArray(supaUser?.expoPushTokens)) {
        existingTokens = supaUser.expoPushTokens.filter(Boolean)
      } else if (typeof supaUser?.expoPushToken === 'string' && supaUser.expoPushToken) {
        existingTokens = [supaUser.expoPushToken]
      }
    } catch (_) {}

    const mergedTokens = Array.from(new Set([...existingTokens, token]))
    await supaDb.updateDocument('users', user.uid, {
      email: user.email || null,
      expoPushTokens: mergedTokens,
      lastPushTokenAt: new Date().toISOString(),
    })
  } catch (err) {
    // Supabase mirror is optional; Firestore remains the source for admin push fanout.
    console.log('Could not mirror push token to Supabase:', err?.message || err)
  }

  let testResult = null
  if (sendTestPush) {
    testResult = await sendPushNotifications(
      [token],
      'בדיקת התראות',
      'אם קיבלת הודעה זו, ה‑Push פעיל במכשיר שלך.',
      { screen: 'Notifications', isPushTest: true }
    )
  }

  return { ok: true, token, testResult }
}

export default {
  refreshPushToken,
}
