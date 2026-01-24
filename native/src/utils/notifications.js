import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * Request permissions and get push token
 */
export async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E63946',
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      alert('לא התקבלה הרשאה לשלוח התראות!')
      return null
    }

    // Get Expo project ID from app config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'a3cc4905-828c-479a-93f0-9b255f822bc8'
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId
    })).data
  } else {
    alert('יש להשתמש במכשיר פיזי כדי לקבל התראות Push')
  }

  return token
}

/**
 * Send a local notification (for testing)
 */
export async function sendLocalNotification({ title, body, data = {} }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Send immediately
  })
}

/**
 * Format alert data for push notification
 */
export function formatAlertForPush(alert) {
  const typeEmoji = {
    buy: '📈',
    sell: '📉',
    watch: '👁️'
  }

  return {
    title: `${typeEmoji[alert.type] || '🔔'} ${alert.symbol} - ${alert.type === 'buy' ? 'קנייה' : alert.type === 'sell' ? 'מכירה' : 'מעקב'}`,
    body: `${alert.price} (${alert.change})\n${alert.message}`,
    data: {
      alertId: alert.id,
      symbol: alert.symbol,
      type: alert.type,
      screen: 'LiveAlerts'
    }
  }
}

/**
 * Schedule a notification for later (optional - for scheduled alerts)
 */
export async function scheduleNotification({ title, body, data = {}, triggerDate }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: triggerDate,
  })
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

/**
 * Get notification badge count
 */
export async function getBadgeCount() {
  return await Notifications.getBadgeCountAsync()
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count)
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync()
}

/**
 * Send push notification to multiple Expo push tokens
 * @param {Array<string>} tokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with notification
 * @returns {Promise<object>} Response from Expo Push API
 */
export async function sendPushNotifications(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) {
    console.warn('No push tokens provided')
    return { success: false, sent: 0 }
  }

  // Expo Push API accepts up to 100 tokens per request
  const CHUNK_SIZE = 100
  const chunks = []
  
  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    chunks.push(tokens.slice(i, i + CHUNK_SIZE))
  }

  let totalSent = 0
  let totalFailed = 0

  for (const chunk of chunks) {
    const messages = chunk.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      badge: 1,
      priority: 'high',
      channelId: 'default'
    }))

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        },
        body: JSON.stringify(messages)
      })

      const result = await response.json()
      
      // Expo returns an array of results, one per message
      if (Array.isArray(result.data)) {
        result.data.forEach((item, index) => {
          if (item.status === 'ok') {
            totalSent++
          } else {
            totalFailed++
            console.error(`Failed to send to token ${chunk[index]}:`, item)
          }
        })
      }
    } catch (error) {
      console.error('Error sending push notifications:', error)
      totalFailed += chunk.length
    }
  }

  return {
    success: totalSent > 0,
    sent: totalSent,
    failed: totalFailed,
    total: tokens.length
  }
}
