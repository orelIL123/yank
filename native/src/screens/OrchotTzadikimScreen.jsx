import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Modal, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import AppHeader from '../components/AppHeader'
import db from '../services/database'
import { auth } from '../config/firebase'
import orhotData from '../data/orhot_tzadikim_data.json'

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

// RTL paragraphs to prevent text direction flip on long Hebrew content
function renderRtlParagraphs(text, textStyle) {
  if (!text || typeof text !== 'string') return null
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim())
  if (paragraphs.length === 0) {
    return <Text style={[textStyle, { writingDirection: 'rtl' }]}>{text}</Text>
  }
  return paragraphs.map((paragraph, index) => (
    <Text
      key={index}
      style={[textStyle, { writingDirection: 'rtl', marginBottom: index < paragraphs.length - 1 ? 20 : 0 }]}
    >
      {paragraph.trim()}
    </Text>
  ))
}

// Get Hebrew day numeric (1-30)
function getHebrewDayNumeric() {
  const date = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    calendar: 'hebrew',
    day: 'numeric'
  })
  return parseInt(formatter.format(date), 10)
}

export default function OrchotTzadikimScreen({ navigation, userRole }) {
  const [loading, setLoading] = useState(true)
  const [dailyContent, setDailyContent] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  
  // Content Editing State
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  
  // Cycle Management State
  const [cycleOffset, setCycleOffset] = useState(0)
  const [effectiveDay, setEffectiveDay] = useState(1)
  const [saving, setSaving] = useState(false)
  const [showIntroModal, setShowIntroModal] = useState(false)
  const introContent = orhotData.find(item => item.day === 1) || null

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
      
      const hebrewDay = getHebrewDayNumeric()
      const hebrewDateStr = getHebrewDate()
      
      // 1. Fetch Cycle Configuration (Offset)
      let currentOffset = 0
      try {
        const configDoc = await db.getDocument('dailyOrchotTzadikim', 'config')
        if (configDoc && typeof configDoc.offset === 'number') {
          currentOffset = configDoc.offset
        }
      } catch (e) {
        console.log('No cycle config found, using default.')
      }
      setCycleOffset(currentOffset)

      // 2. Calculate Effective Day
      // Formula ensures result is 1-30
      // If hebrewDay is 5 and offset is 4 (started 4 days ago), effective is 1.
      let calculatedDay = ((hebrewDay - currentOffset - 1 + 30) % 30) + 1
      setEffectiveDay(calculatedDay)

      // 3. Gates only (skip intro day 1) – day 1 of cycle = first gate
      const gates = orhotData.filter(item => item.day !== 1).sort((a, b) => a.day - b.day)
      const gateIndex = (calculatedDay - 1) % Math.max(gates.length, 1)
      const autoContent = gates[gateIndex] || gates[0]
      
      const defaultContent = {
        title: `אורחות צדיקים - ${hebrewDateStr}`,
        content: autoContent ? `${autoContent.title}\n\n${autoContent.content}` : '',
        imageUrl: '',
        updatedAt: new Date().toISOString()
      }

      // 4. Check for Manual Override in DB
      try {
        const dbContent = await db.getDocument('dailyOrchotTzadikim', 'current')
        
        // If DB has content and it seems fresh (title contains today's date)
        // OR if the admin explicitly set it to override regardless of date.
        // For simplicity, we check if the title matches today's hebrew date string.
        // But if we just reset the cycle, we want the JSON content.
        
        // We prioritize the manual override ONLY if it matches the current context or was recently updated.
        // However, the simplest logic is: Display DB content if it exists. 
        // But the user wants "Cycle" to work.
        
        // Strategy: We load the JSON content as the baseline.
        // We map the DB content to the edit fields.
        // If the DB content title matches today's date, we assume it's a manual override for TODAY.
        
        if (dbContent && dbContent.title && dbContent.title.includes(hebrewDateStr)) {
          setDailyContent(dbContent)
          setEditTitle(dbContent.title)
          setEditContent(dbContent.content)
          setEditImageUrl(dbContent.imageUrl || '')
        } else {
          // No manual override for today -> Use Automatic Content
          setDailyContent(defaultContent)
          // Pre-fill edit fields with the automatic content so admin can edit "on top" of it
          setEditTitle(defaultContent.title)
          setEditContent(defaultContent.content)
          setEditImageUrl('')
        }
      } catch (dbError) {
        setDailyContent(defaultContent)
        setEditTitle(defaultContent.title)
        setEditContent(defaultContent.content)
      }

    } catch (error) {
      console.error('Error loading daily Orchot Tzadikim:', error)
      const hebrewDate = getHebrewDate()
      setDailyContent({
        title: `אורחות צדיקים - ${hebrewDate}`,
        content: 'טוען תוכן...',
        imageUrl: '',
        updatedAt: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetCycle = async (resetToStart) => {
    setSaving(true)
    try {
      const hebrewDay = getHebrewDayNumeric()
      let newOffset = 0
      
      if (resetToStart) {
        // Set Offset so that (hebrewDay - offset) = 1
        // offset = hebrewDay - 1
        newOffset = hebrewDay - 1
      } else {
        // Reset to natural cycle (offset 0)
        newOffset = 0
      }

      await db.setDocument('dailyOrchotTzadikim', 'config', { offset: newOffset })
      
      Alert.alert('הצלחה', resetToStart ? 'הסבב אופס להתחלה' : 'הסבב סונכרן לתאריך העברי')
      
      // Reload content to reflect change
      // Also clear any manual override for "current" so the new cycle takes precedence immediately
      await db.updateDocument('dailyOrchotTzadikim', 'current', {
        title: '', // Clearing title signals "no manual override"
        content: '',
        imageUrl: '',
        updatedAt: new Date().toISOString()
      })
      
      await loadDailyContent()
      setEditModalVisible(false)

    } catch (error) {
      console.error('Error resetting cycle:', error)
      Alert.alert('שגיאה', 'לא ניתן לעדכן את הסבב')
    } finally {
      setSaving(false)
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
          {introContent ? (
            <Pressable
              style={styles.introButton}
              onPress={() => setShowIntroModal(true)}
            >
              <Ionicons name="book-outline" size={20} color={PRIMARY_BLUE} />
              <Text style={styles.introButtonText}>הצג הקדמה</Text>
            </Pressable>
          ) : null}
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
              <View style={[styles.contentContainer, styles.contentContainerRtl]}>
                {renderRtlParagraphs(dailyContent.content, styles.contentText)}
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
            תוכן זה מתחלף אוטומטית מדי יום לפי הלוח העברי (יום בחודש) ומציג שער מספר אורחות צדיקים
          </Text>
        </View>
      </ScrollView>

      {/* Intro Modal */}
      {introContent && (
        <Modal
          visible={showIntroModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowIntroModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setShowIntroModal(false)}>
                  <Ionicons name="close" size={24} color={DEEP_BLUE} />
                </Pressable>
                <Text style={styles.modalTitle}>{introContent.title}</Text>
              </View>
              <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={[styles.contentContainer, styles.contentContainerRtl]}>
                  {renderRtlParagraphs(introContent.content, styles.contentText)}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

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
              
              {/* Cycle Management Section */}
              <View style={styles.cycleSection}>
                <Text style={styles.sectionTitle}>ניהול מחזור הלימוד</Text>
                <Text style={styles.cycleInfo}>
                  היום הנוכחי במחזור: {effectiveDay} (מתוך 30)
                </Text>
                
                <View style={styles.cycleButtons}>
                  <Pressable 
                    style={[styles.cycleButton, styles.resetButton]}
                    onPress={() => handleResetCycle(true)}
                    disabled={saving}
                  >
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text style={styles.cycleButtonText}>התחל סבב מחדש מהיום</Text>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.cycleButton, styles.syncButton]}
                    onPress={() => handleResetCycle(false)}
                    disabled={saving}
                  >
                    <Ionicons name="calendar" size={18} color={DEEP_BLUE} />
                    <Text style={styles.syncButtonText}>סנכרן לתאריך העברי</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>עריכת תוכן ידנית (דריסה)</Text>

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
  introButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.25)',
  },
  introButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
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
  contentContainerRtl: {
    direction: 'rtl',
  },
  contentText: {
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 32,
    writingDirection: 'rtl',
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
  cycleSection: {
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 12,
  },
  cycleInfo: {
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
    color: '#64748b',
    textAlign: 'right',
    marginBottom: 12,
  },
  cycleButtons: {
    gap: 8,
  },
  cycleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  resetButton: {
    backgroundColor: PRIMARY_BLUE,
  },
  syncButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cycleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
  },
  syncButtonText: {
    color: DEEP_BLUE,
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 20,
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
