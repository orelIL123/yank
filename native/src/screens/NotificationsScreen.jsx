import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import { auth } from '../config/firebase'
import db from '../services/database'
import AppHeader from '../components/AppHeader'
import NotificationModal from '../components/NotificationModal'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const GOLD = '#FFD700'

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notificationModalVisible, setNotificationModalVisible] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const notificationsData = await db.getCollection('notifications', {
        where: [['isActive', '==', true]],
        orderBy: { field: 'createdAt', direction: 'desc' }
      })
      setNotifications(notificationsData)
    } catch (error) {
      console.error('Error loading notifications:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את ההתראות')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadNotifications()
  }, [])

  const markAsRead = async (notificationId) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const notification = notifications.find(n => n.id === notificationId)
      if (!notification) return

      const readBy = notification.readBy || []
      
      if (!readBy.includes(userId)) {
        // Use db.updateDocument instead of Firestore doc/updateDoc
        await db.updateDocument('notifications', notificationId, {
          readBy: [...readBy, userId]
        })
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, readBy: [...(n.readBy || []), userId] }
              : n
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleNotificationPress = (notification) => {
    markAsRead(notification.id)
    
    // Show modal with notification
    setSelectedNotification(notification)
    setNotificationModalVisible(true)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'עכשיו'
    if (minutes < 60) return `לפני ${minutes} דקות`
    if (hours < 24) return `לפני ${hours} שעות`
    if (days < 7) return `לפני ${days} ימים`
    
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const isUnread = (notification) => {
    const userId = auth.currentUser?.uid
    if (!userId) return false
    return !notification.readBy || !notification.readBy.includes(userId)
  }

  const renderNotification = ({ item }) => {
    const unread = isUnread(item)
    
    return (
      <TouchableOpacity
        style={[styles.notificationItem, unread && styles.notificationItemUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationIconContainer}>
              <Ionicons
                name={item.icon || 'notifications'}
                size={24}
                color={unread ? PRIMARY_BLUE : '#6b7280'}
              />
              {unread && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.notificationTextContainer}>
              <Text style={[styles.notificationTitle, unread && styles.notificationTitleUnread]}>
                {item.title}
              </Text>
              <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          {item.message && (
            <Text style={styles.notificationMessage} numberOfLines={3}>
              {item.message}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f7f7f7']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title="התראות"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f7f7f7']} style={StyleSheet.absoluteFill} />
      
      <AppHeader
        title="התראות"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>אין התראות חדשות</Text>
          <Text style={styles.emptySubtext}>ההתראות יופיעו כאן כשיש עדכונים חדשים</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_BLUE]}
              tintColor={PRIMARY_BLUE}
            />
          }
        />
      )}

      <NotificationModal
        visible={notificationModalVisible}
        notification={selectedNotification}
        onClose={() => {
          setNotificationModalVisible(false)
          setSelectedNotification(null)
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  notificationItemUnread: {
    borderLeftColor: PRIMARY_BLUE,
    backgroundColor: '#f0f7ff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIconContainer: {
    marginRight: 12,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'right',
  },
  notificationTitleUnread: {
    fontWeight: '700',
    color: DEEP_BLUE,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
})

