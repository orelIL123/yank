import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

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

    token = (await Notifications.getExpoPushTokenAsync()).data
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
