import React from 'react'
import { View, Text, StyleSheet, Modal, Pressable, Dimensions, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Linking } from 'react-native'

const PRIMARY_BLUE = '#1e3a8a'
const DEEP_BLUE = '#0b1b3a'
const GOLD = '#FFD700'
const GOLD_DARK = '#f59e0b'
const BG = '#FFFFFF'

const { width } = Dimensions.get('window')

export default function NotificationModal({ visible, notification, onClose }) {
  if (!notification) return null

  const handleLinkPress = () => {
    if (notification.link) {
      Linking.openURL(notification.link).catch(() => {
        // Handle error silently or show alert if needed
      })
    }
    onClose()
  }

  const handleLinkTextPress = () => {
    if (notification.link) {
      Linking.openURL(notification.link).catch(() => {
        // Handle error silently or show alert if needed
      })
    }
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Gold line at top */}
          <View style={styles.goldLine} />
          {/* Close X button */}
          <TouchableOpacity
            style={styles.closeXButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="סגור"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {/* Modal content */}
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{notification.title}</Text>
            
            {notification.message && (
              <Text style={styles.modalMessage}>{notification.message}</Text>
            )}
            
            {notification.link && (
              <Pressable 
                onPress={handleLinkTextPress}
                style={styles.linkContainer}
              >
                <View style={styles.linkContent}>
                  <Ionicons name="link-outline" size={18} color={GOLD} />
                  <Text style={styles.linkText}>
                    לחץ כאן לפתיחת הקישור
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Close/Link button */}
          <Pressable
            style={styles.closeButton}
            onPress={notification.link ? handleLinkPress : onClose}
          >
            <LinearGradient
              colors={[GOLD, GOLD_DARK]}
              style={styles.closeButtonGradient}
            >
              <Text style={styles.closeButtonText}>
                {notification.link ? 'פתח קישור' : 'סגור'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: GOLD,
  },
  goldLine: {
    height: 4,
    backgroundColor: GOLD,
    width: '100%',
  },
  closeXButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Heebo_700Bold',
    color: '#FFFFFF',
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 32,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: 12,
  },
  linkContainer: {
    marginTop: 12,
    paddingVertical: 8,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  linkText: {
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
    color: GOLD,
    textAlign: 'right',
    textDecorationLine: 'underline',
  },
  closeButton: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    color: '#FFFFFF',
  },
})

