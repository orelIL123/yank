import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, TextInput, Platform, KeyboardAvoidingView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import { auth } from '../config/firebase'
import db from '../services/database'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { sendLocalNotification } from '../utils/notifications'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

const PRAYER_TYPES = [
  { key: 'marriage', title: 'זיווג', icon: 'heart', color: '#e91e63', prayerTitle: 'תפילה לזיווג' },
  { key: 'health', title: 'רפואה', icon: 'medical', color: '#4caf50', prayerTitle: 'תפילה לרפואה' },
  { key: 'childbirth', title: 'ילודה', icon: 'happy', color: '#ff9800', prayerTitle: 'תפילה לילודה' }
]

export default function PrayerCommitmentScreen({ navigation }) {
  const [commitments, setCommitments] = useState([]) // ההתחייבויות שלי (על מי אני מתפלל)
  const [prayingForMe, setPrayingForMe] = useState(null) // מי מתפלל עליי (רק אחד)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    userName: '',
    prayerType: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [prayers, setPrayers] = useState([])

  useEffect(() => {
    loadCommitments()
    loadPrayingForMe()
    loadPrayers()
  }, [])

  const loadPrayers = async () => {
    try {
      const prayersData = await db.getCollection('prayers', {
        orderBy: { field: 'createdAt', direction: 'desc' }
      })
      setPrayers(prayersData)
    } catch (error) {
      console.error('Error loading prayers:', error)
    }
  }

  const loadCommitments = async () => {
    try {
      if (!auth.currentUser) {
        setLoading(false)
        return
      }

      // טעינת ההתחייבויות שלי (על מי אני מתפלל)
      const commitmentsData = await db.getCollection('prayerCommitments', {
        where: [['userId', '==', auth.currentUser.uid]],
        orderBy: { field: 'createdAt', direction: 'desc' }
      })
      setCommitments(commitmentsData)
    } catch (error) {
      console.error('Error loading commitments:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את ההתחייבויות')
    } finally {
      setLoading(false)
    }
  }

  const loadPrayingForMe = async () => {
    try {
      if (!auth.currentUser) return

      // טעינת מי מתפלל עליי - רק את הראשון
      const prayingData = await db.getCollection('prayerCommitments', {
        where: [
          ['prayingForUserId', '==', auth.currentUser.uid],
          ['status', '==', 'active']
        ],
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: 1
      })

      if (prayingData && prayingData.length > 0) {
        setPrayingForMe(prayingData[0])
      } else {
        setPrayingForMe(null)
      }
    } catch (error) {
      console.error('Error loading praying for me:', error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.userName.trim()) {
      Alert.alert('שגיאה', 'אנא הזן את השם המלא')
      return
    }
    if (!formData.prayerType) {
      Alert.alert('שגיאה', 'אנא בחר סוג תפילה')
      return
    }

    if (!auth.currentUser) {
      Alert.alert('נדרש התחברות', 'עליך להתחבר כדי ליצור התחייבות')
      navigation.navigate('Login')
      return
    }

    setSubmitting(true)
    try {
      const startDate = new Date().toISOString()
      // Calculate endDate (7 days from now)
      const endDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()

      // מצא מישהו אחר שצריך אותה ישועה (אוטומטי)
      let assignedTo = null
      
      // נסה למצוא מישהו שצריך אותה ישועה
      try {
        // Get all active commitments with the same prayer type
        const allCommitments = await db.getCollection('prayerCommitments', {
          where: [
            ['prayerType', '==', formData.prayerType],
            ['status', '==', 'active']
          ],
          limit: 50
        })
        
        // מצא מישהו שאין עליו עוד מתפללים (או הכי פחות)
        let bestMatch = null
        let minPrayingCount = Infinity
        
        for (const matchData of allCommitments) {
          // סנן את עצמו
          if (matchData.userId === auth.currentUser.uid) {
            continue
          }
          
          // ספור כמה אנשים מתפללים עליו
          const prayingForHim = await db.getCollection('prayerCommitments', {
            where: [
              ['prayerType', '==', formData.prayerType],
              ['status', '==', 'active'],
              ['prayingForUserId', '==', matchData.userId]
            ]
          })
          const prayingCount = prayingForHim.length
          
          // בחר את האדם עם הכי פחות מתפללים
          if (prayingCount < minPrayingCount) {
            minPrayingCount = prayingCount
            bestMatch = {
              userId: matchData.userId,
              userName: matchData.userName
            }
          }
        }
        
        assignedTo = bestMatch
        
        // שליחת התראה למישהו שמתפלל עליו (אם מצאנו מישהו)
        if (assignedTo) {
          try {
            const prayerTypeLabel = PRAYER_TYPES.find(t => t.key === formData.prayerType)?.title || 'תפילה'
            await sendLocalNotification({
              title: '🤲 מישהו מתפלל עליך!',
              body: `${formData.userName.trim()} מתפלל עבורך ל${prayerTypeLabel}`,
              data: {
                type: 'prayer_commitment',
                prayerType: formData.prayerType
              }
            })
          } catch (notifError) {
            console.error('Error sending notification:', notifError)
          }
        }
      } catch (matchError) {
        console.error('Error finding match:', matchError)
      }

      // יצירת התחייבות חדשה - האדם מתפלל על האדם שנמצא
      await db.addDocument('prayerCommitments', {
        userId: auth.currentUser.uid,
        userName: formData.userName.trim(),
        prayerType: formData.prayerType,
        status: 'active',
        startDate,
        endDate,
        prayingForUserId: assignedTo?.userId || null,
        prayingForUserName: assignedTo?.userName || null,
        dailyProgress: {
          day1: { completed: false, date: null },
          day2: { completed: false, date: null },
          day3: { completed: false, date: null },
          day4: { completed: false, date: null },
          day5: { completed: false, date: null },
          day6: { completed: false, date: null },
          day7: { completed: false, date: null }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // רענון הרשימות
      await loadCommitments()
      await loadPrayingForMe()
      
      Alert.alert(
        'הצלחה! 🤲',
        assignedTo 
          ? `התחייבת להתפלל עבור ${assignedTo.userName} במשך שבוע. תזכורת יומית תישלח אליך.`
          : 'התחייבותך נרשמה. מישהו אחר יתפלל עבורך במשך השבוע.',
        [{ text: 'אישור', onPress: () => {
          setShowForm(false)
          setFormData({ userName: '', prayerType: '' })
        }}]
      )
    } catch (error) {
      console.error('Error creating commitment:', error)
      Alert.alert('שגיאה', 'לא ניתן ליצור התחייבות. אנא נסה שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  const markDayComplete = async (commitmentId, day) => {
    try {
      // Get current commitment
      const commitment = await db.getDocument('prayerCommitments', commitmentId)
      
      // Update daily progress
      const updatedProgress = {
        ...commitment.dailyProgress,
        [day]: {
          completed: true,
          date: new Date().toISOString()
        }
      }
      
      // Update document
      await db.updateDocument('prayerCommitments', commitmentId, {
        dailyProgress: updatedProgress,
        updatedAt: new Date().toISOString()
      })
      
      loadCommitments()
    } catch (error) {
      console.error('Error updating progress:', error)
      Alert.alert('שגיאה', 'לא ניתן לעדכן את ההתקדמות')
    }
  }

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0
    // Handle both Date objects and ISO strings
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  const getProgress = (commitment) => {
    const days = Object.values(commitment.dailyProgress || {})
    const completed = days.filter(d => d.completed).length
    return { completed, total: 7 }
  }

  const downloadPrayer = async (prayerType) => {
    if (!auth.currentUser) {
      Alert.alert('נדרש התחברות', 'עליך להתחבר כדי להוריד תפילות')
      navigation.navigate('Login')
      return
    }

    try {
      const prayerTypeData = PRAYER_TYPES.find(t => t.key === prayerType)
      const prayer = prayers.find(p => 
        p.title?.includes(prayerTypeData?.prayerTitle) || 
        p.category === prayerTypeData?.title
      )

      if (!prayer) {
        Alert.alert('שגיאה', 'תפילה לא נמצאה')
        return
      }

      if (prayer.pdfUrl) {
        // Download PDF
        Alert.alert('מוריד...', 'הקובץ יורד כעת')
        const fileUri = FileSystem.documentDirectory + `${prayer.title.replace(/\s/g, '_')}.pdf`
        const downloadResult = await FileSystem.downloadAsync(prayer.pdfUrl, fileUri)
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri)
        } else {
          Alert.alert('הורדה הושלמה', `הקובץ נשמר ב: ${fileUri}`)
        }
      } else if (prayer.content) {
        // Create text file
        const fileName = `${prayer.title.replace(/\s/g, '_')}.txt`
        const fileUri = FileSystem.documentDirectory + fileName
        await FileSystem.writeAsStringAsync(fileUri, `${prayer.title}\n\n${prayer.content}`)
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri)
        } else {
          Alert.alert('הורדה הושלמה', `הקובץ נשמר ב: ${fileUri}`)
        }
      } else {
        Alert.alert('שגיאה', 'לא ניתן להוריד תפילה זו')
      }
    } catch (error) {
      console.error('Error downloading prayer:', error)
      Alert.alert('שגיאה', 'לא ניתן להוריד את התפילה')
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
          </Pressable>
          <Text style={styles.headerTitle}>התחייבות תפילה</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
        </Pressable>
        <Text style={styles.headerTitle}>התחייבות תפילה</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color={PRIMARY_BLUE} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>איך זה עובד?</Text>
            <Text style={styles.infoText}>
              רשום את שמך ובחר סוג תפילה. מישהו אחר יתפלל עבורך במשך שבוע, ואתה תתפלל עבור מישהו אחר. כל יום סמן שהתפללת.
            </Text>
          </View>
        </View>

        {!auth.currentUser ? (
          <View style={styles.loginPrompt}>
            <LinearGradient
              colors={[PRIMARY_BLUE, '#1e40af']}
              style={styles.loginPromptGradient}
            >
              <Ionicons name="lock-closed" size={64} color="#fff" style={{ opacity: 0.9 }} />
              <Text style={styles.loginPromptTitle}>נדרש התחברות</Text>
              <Text style={styles.loginPromptText}>
                עליך להתחבר כדי ליצור התחייבות ולהוריד תפילות
              </Text>
              <Pressable
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginButtonText}>התחבר עכשיו</Text>
              </Pressable>
            </LinearGradient>
          </View>
        ) : (
          <>
            {!showForm ? (
              <Pressable
                style={styles.addButton}
                onPress={() => setShowForm(true)}
              >
                <LinearGradient
                  colors={[PRIMARY_BLUE, '#1e40af']}
                  style={styles.addButtonGradient}
                >
                  <Ionicons name="add-circle" size={28} color="#fff" />
                  <Text style={styles.addButtonText}>התחייבות חדשה</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>רישום התחייבות חדשה</Text>
                  <Pressable
                    onPress={() => {
                      setShowForm(false)
                      setFormData({ userName: '', prayerType: '' })
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#6b7280" />
                  </Pressable>
                </View>
                
                <Text style={styles.label}>שם מלא (לדוגמה: אוראל בן סיגל)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.userName}
                  onChangeText={(text) => setFormData({ ...formData, userName: text })}
                  placeholder="הזן שם מלא"
                  placeholderTextColor="#9ca3af"
                  textAlign="right"
                />

                <Text style={styles.label}>סוג תפילה</Text>
                <View style={styles.typeButtons}>
                  {PRAYER_TYPES.map((type) => (
                    <Pressable
                      key={type.key}
                      style={[
                        styles.typeButton,
                        formData.prayerType === type.key && styles.typeButtonActive
                      ]}
                      onPress={() => setFormData({ ...formData, prayerType: type.key })}
                    >
                      {formData.prayerType === type.key && (
                        <LinearGradient
                          colors={[type.color, type.color + 'DD']}
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                      )}
                      <Ionicons 
                        name={type.icon} 
                        size={22} 
                        color={formData.prayerType === type.key ? '#fff' : type.color} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        formData.prayerType === type.key && styles.typeButtonTextActive
                      ]}>
                        {type.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.formActions}>
                  <Pressable
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => {
                      setShowForm(false)
                      setFormData({ userName: '', prayerType: '' })
                    }}
                  >
                    <Text style={styles.cancelButtonText}>ביטול</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.formButton, styles.submitButton]}
                    onPress={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.submitButtonText}>אישור</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* מי מתפלל עליי */}
            {prayingForMe && (
              <View style={styles.prayingForMeCard}>
                <LinearGradient
                  colors={['#fef3c7', '#fde68a']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.prayingForMeContent}>
                  <Ionicons name="heart" size={32} color="#f59e0b" />
                  <Text style={styles.prayingForMeTitle}>מישהו מתפלל עליך! 🤲</Text>
                  <Text style={styles.prayingForMeName}>{prayingForMe.userName}</Text>
                  <Text style={styles.prayingForMeText}>
                    {PRAYER_TYPES.find(t => t.key === prayingForMe.prayerType)?.title || 'תפילה'}
                  </Text>
                </View>
              </View>
            )}

            {commitments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                <Text style={styles.emptyText}>אין התחייבויות פעילות</Text>
                <Text style={styles.emptySubtext}>צור התחייבות חדשה כדי להתחיל</Text>
              </View>
            ) : (
              commitments.map((commitment) => {
                const progress = getProgress(commitment)
                const daysRemaining = getDaysRemaining(commitment.endDate)
                const prayerType = PRAYER_TYPES.find(t => t.key === commitment.prayerType)
                const isCompleted = progress.completed === 7
                const isExpired = daysRemaining === 0 && !isCompleted

                return (
                  <View key={commitment.id} style={styles.commitmentCard}>
                    <View style={styles.commitmentHeader}>
                      <View style={[styles.typeBadge, { backgroundColor: prayerType?.color + '20' }]}>
                        <Ionicons name={prayerType?.icon} size={18} color={prayerType?.color} />
                        <Text style={[styles.typeBadgeText, { color: prayerType?.color }]}>
                          {prayerType?.title}
                        </Text>
                      </View>
                      {isCompleted ? (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                          <Text style={styles.completedBadgeText}>הושלם</Text>
                        </View>
                      ) : daysRemaining > 0 ? (
                        <Text style={styles.daysRemaining}>{daysRemaining} ימים נותרים</Text>
                      ) : (
                        <Text style={styles.expiredBadge}>פג תוקף</Text>
                      )}
                    </View>

                    <Text style={styles.commitmentName}>{commitment.userName}</Text>
                    
                    {commitment.prayingForUserName ? (
                      <View style={styles.assignedSection}>
                        <View style={styles.assignedHeader}>
                          <Ionicons name="heart" size={16} color={PRIMARY_BLUE} />
                          <Text style={styles.assignedLabel}>מתפלל עבור:</Text>
                        </View>
                        <Text style={styles.assignedName}>{commitment.prayingForUserName}</Text>
                      </View>
                    ) : (
                      <View style={styles.waitingSection}>
                        <Ionicons name="hourglass-outline" size={20} color="#ff9800" />
                        <Text style={styles.waitingText}>ממתין להתאמה...</Text>
                      </View>
                    )}

                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>התקדמות: {progress.completed}/7 ימים</Text>
                        <Pressable
                          style={styles.downloadButton}
                          onPress={() => downloadPrayer(commitment.prayerType)}
                        >
                          <Ionicons name="download-outline" size={18} color={PRIMARY_BLUE} />
                          <Text style={styles.downloadButtonText}>הורד תפילה</Text>
                        </Pressable>
                      </View>
                      <View style={styles.progressBar}>
                        <LinearGradient
                          colors={[PRIMARY_BLUE, '#1e40af']}
                          style={[
                            styles.progressFill, 
                            { width: `${(progress.completed / 7) * 100}%` }
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                      </View>
                    </View>

                    <View style={styles.daysGrid}>
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const dayData = commitment.dailyProgress[`day${day}`]
                        const isCompleted = dayData?.completed
                        return (
                          <Pressable
                            key={day}
                            style={[
                              styles.dayButton,
                              isCompleted && styles.dayButtonCompleted
                            ]}
                            onPress={() => {
                              if (!isCompleted && daysRemaining > 0) {
                                markDayComplete(commitment.id, `day${day}`)
                              }
                            }}
                            disabled={isCompleted || daysRemaining === 0}
                          >
                            {isCompleted ? (
                              <LinearGradient
                                colors={[PRIMARY_BLUE, '#1e40af']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                              />
                            ) : null}
                            <Text style={[
                              styles.dayButtonText,
                              isCompleted && styles.dayButtonTextCompleted
                            ]}>
                              {day}
                            </Text>
                            {isCompleted && (
                              <Ionicons name="checkmark" size={14} color="#fff" style={{ marginTop: 2 }} />
                            )}
                          </Pressable>
                        )
                      })}
                    </View>
                  </View>
                )
              })
            )}
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,58,138,0.12)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,58,138,0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 6,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#4b5563',
    lineHeight: 20,
    textAlign: 'right',
  },
  loginPrompt: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
  },
  loginPromptGradient: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPromptTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    color: PRIMARY_BLUE,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    marginBottom: 20,
    textAlign: 'right',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  typeButtonActive: {
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  submitButton: {
    backgroundColor: PRIMARY_BLUE,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Poppins_400Regular',
  },
  commitmentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  commitmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  daysRemaining: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76,175,80,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4caf50',
  },
  expiredBadge: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#dc2626',
  },
  commitmentName: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 12,
    textAlign: 'right',
  },
  assignedSection: {
    backgroundColor: 'rgba(30,58,138,0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  assignedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  assignedLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
    textAlign: 'right',
  },
  assignedName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
    textAlign: 'right',
  },
  waitingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  waitingText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#ff9800',
    textAlign: 'right',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  downloadButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  dayButtonCompleted: {
    borderColor: PRIMARY_BLUE,
  },
  dayButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
  },
  dayButtonTextCompleted: {
    color: '#fff',
  },
  prayingForMeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  prayingForMeContent: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  prayingForMeTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#92400e',
    marginTop: 8,
  },
  prayingForMeName: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#78350f',
    marginTop: 4,
  },
  prayingForMeText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#92400e',
    marginTop: 4,
  },
})

