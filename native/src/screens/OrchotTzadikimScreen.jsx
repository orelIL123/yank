import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Modal, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import AppHeader from '../components/AppHeader'
import db from '../services/database'
import { auth } from '../config/firebase'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// Get Hebrew date
function getHebrewDate() {
  const date = new Date()
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'hebrew'
  })
}

export default function OrchotTzadikimScreen({ navigation, userRole }) {
  const [loading, setLoading] = useState(true)
  const [dailyContent, setDailyContent] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAdmin()
    loadDailyContent()
  }, [userRole])

  const checkAdmin = () => {
    setIsAdmin(userRole === 'admin' || userRole === 'superadmin')
  }

  const loadDailyContent = async () => {
    try {
      setLoading(true)
      // Load today's Orchot Tzadikim content from database
      const content = await db.getDocument('dailyOrchotTzadikim', 'current')

      if (content) {
        setDailyContent(content)
        setEditTitle(content.title || '')
        setEditContent(content.content || '')
        setEditImageUrl(content.imageUrl || '')
      } else {
        // Initialize with default
        const hebrewDate = getHebrewDate()
        setDailyContent({
          title: `אורחות צדיקים - ${hebrewDate}`,
          content: '',
          imageUrl: '',
          updatedAt: new Date().toISOString()
        })
        setEditTitle(`אורחות צדיקים - ${hebrewDate}`)
      }
    } catch (error) {
      console.error('Error loading daily Orchot Tzadikim:', error)
      // Initialize with default
      const hebrewDate = getHebrewDate()
      setDailyContent({
        title: `אורחות צדיקים - ${hebrewDate}`,
        content: '',
        imageUrl: '',
        updatedAt: new Date().toISOString()
      })
      setEditTitle(`אורחות צדיקים - ${hebrewDate}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editTitle.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת')
      return
    }

    setSaving(true)
    try {
      const updatedContent = {
        title: editTitle.trim(),
        content: editContent.trim(),
        imageUrl: editImageUrl.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid,
      }

      await db.updateDocument('dailyOrchotTzadikim', 'current', updatedContent)

      setDailyContent(updatedContent)
      setEditModalVisible(false)
      Alert.alert('הצלחה', 'אורחות צדיקים עודכן בהצלחה')
    } catch (error) {
      console.error('Error saving daily Orchot Tzadikim:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את התוכן')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'מחיקת תוכן',
      'האם אתה בטוח שברצונך למחוק את התוכן?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.updateDocument('dailyOrchotTzadikim', 'current', {
                title: '',
                content: '',
                imageUrl: '',
                updatedAt: new Date().toISOString(),
              })

              setDailyContent({
                title: '',
                content: '',
                imageUrl: '',
                updatedAt: new Date().toISOString()
              })
              setEditTitle('')
              setEditContent('')
              setEditImageUrl('')
              setEditModalVisible(false)
              Alert.alert('הצלחה', 'התוכן נמחק')
            } catch (error) {
              Alert.alert('שגיאה', 'לא ניתן למחוק')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title="אורחות צדיקים"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען אורחות צדיקים...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="אורחות צדיקים"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIcon={isAdmin ? "create-outline" : undefined}
        onRightIconPress={isAdmin ? () => setEditModalVisible(true) : undefined}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="star" size={48} color={PRIMARY_BLUE} />
          </View>
          <Text style={styles.mainTitle}>אורחות צדיקים</Text>
          <Text style={styles.subtitle}>קטע יומי מספר המוסר המפורסם</Text>
          <Text style={styles.hebrewDate}>{getHebrewDate()}</Text>
        </View>

        {/* Daily Content Card */}
        {dailyContent && (dailyContent.title || dailyContent.content || dailyContent.imageUrl) ? (
          <View style={styles.contentCard}>
            {dailyContent.title && (
              <Text style={styles.contentTitle}>{dailyContent.title}</Text>
            )}

            {dailyContent.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: dailyContent.imageUrl }}
                  style={styles.contentImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {dailyContent.content && (
              <View style={styles.contentContainer}>
                <Text style={styles.contentText}>{dailyContent.content}</Text>
              </View>
            )}

            {dailyContent.updatedAt && (
              <Text style={styles.updateTime}>
                עודכן לאחרונה: {new Date(dailyContent.updatedAt).toLocaleString('he-IL')}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>אין תוכן זמין להיום</Text>
            {isAdmin && (
              <Pressable
                style={styles.addButton}
                onPress={() => setEditModalVisible(true)}
              >
                <Text style={styles.addButtonText}>הוסף תוכן</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={PRIMARY_BLUE} />
          <Text style={styles.infoText}>
            תוכן זה מתעדכן יומית על ידי האדמין ומציג קטע רלוונטי מספר אורחות צדיקים
          </Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={DEEP_BLUE} />
              </Pressable>
              <Text style={styles.modalTitle}>עריכת אורחות צדיקים</Text>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
              <View style={styles.formGroup}>
                <Text style={styles.label}>כותרת</Text>
                <TextInput
                  style={styles.input}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="אורחות צדיקים - תאריך עברי"
                  textAlign="right"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>תוכן (קטע מהספר)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder="הזן את הקטע הרלוונטי..."
                  multiline
                  numberOfLines={8}
                  textAlign="right"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>קישור לתמונה</Text>
                <TextInput
                  style={styles.input}
                  value={editImageUrl}
                  onChangeText={setEditImageUrl}
                  placeholder="https://example.com/image.jpg"
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>

              {editImageUrl ? (
                <View style={styles.imagePreview}>
                  <Text style={styles.label}>תצוגה מקדימה:</Text>
                  <Image
                    source={{ uri: editImageUrl }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.modalButtonText}>מחק</Text>
              </Pressable>

              <View style={styles.modalButtonGroup}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>ביטול</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>שמור</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  hebrewDate: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
    textAlign: 'center',
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  contentTitle: {
    fontSize: 22,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 16,
  },
  imageContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentImage: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    backgroundColor: 'rgba(139,92,246,0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  contentText: {
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 32,
  },
  updateTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_500Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    flex: 1,
    marginRight: 16,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  imagePreview: {
    marginTop: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    backgroundColor: DEEP_BLUE,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
  },
  cancelButtonText: {
    color: DEEP_BLUE,
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
  },
})
