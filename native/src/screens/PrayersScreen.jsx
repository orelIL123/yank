import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function PrayersScreen({ navigation, userRole }) {
  const [prayers, setPrayers] = useState([])
  const [loading, setLoading] = useState(true)
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    loadPrayers()
  }, [])

  const loadPrayers = async () => {
    try {
      const q = query(collection(db, 'prayers'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const prayersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPrayers(prayersData)
    } catch (error) {
      console.error('Error loading prayers:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את התפילות')
    } finally {
      setLoading(false)
    }
  }

  const handlePrayerPress = (prayer) => {
    navigation.navigate('PrayerDetail', { prayer })
  }

  const handleEditPrayer = (prayer) => {
    navigation.navigate('EditPrayer', { prayer })
  }

  const handleDeletePrayer = (prayer) => {
    Alert.alert(
      'מחיקת תפילה',
      `האם אתה בטוח שברצונך למחוק את התפילה "${prayer.title}"?`,
      [
        {
          text: 'ביטול',
          style: 'cancel'
        },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'prayers', prayer.id))
              Alert.alert('הצלחה', 'התפילה נמחקה בהצלחה')
              loadPrayers() // Reload prayers
            } catch (error) {
              console.error('Error deleting prayer:', error)
              Alert.alert('שגיאה', 'לא ניתן למחוק את התפילה')
            }
          }
        }
      ]
    )
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
            accessibilityLabel="חזרה"
          >
            <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
          </Pressable>
          <Text style={styles.headerTitle}>תפילות הינוקא</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען תפילות...</Text>
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
          accessibilityLabel="חזרה"
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
        </Pressable>
        <Text style={styles.headerTitle}>תפילות הינוקא</Text>
        {isAdmin ? (
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate('AddPrayer')}
            accessibilityRole="button"
            accessibilityLabel="הוסף תפילה"
          >
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>תפילות מיוחדות וסגולות</Text>

        {/* Prayer Commitment Button */}
        <Pressable
          style={styles.commitmentButton}
          onPress={() => navigation.navigate('PrayerCommitment')}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[PRIMARY_BLUE, '#1e40af']}
            style={styles.commitmentButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="heart" size={24} color="#fff" />
            <View style={styles.commitmentButtonTextContainer}>
              <Text style={styles.commitmentButtonTitle}>התחייבות תפילה שבועית</Text>
              <Text style={styles.commitmentButtonDesc}>התחייב להתפלל עבור מישהו אחר</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>

        {prayers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>אין תפילות זמינות כרגע</Text>
            <Text style={styles.emptySubtext}>התפילות יתווספו בקרוב</Text>
          </View>
        ) : (
          prayers.map((prayer, idx) => (
            <View key={prayer.id} style={[styles.prayerCard, idx === 0 && styles.prayerCardFirst]}>
              <Pressable
                style={styles.prayerContentPressable}
                onPress={() => handlePrayerPress(prayer)}
                accessibilityRole="button"
                accessibilityLabel={`תפילה ${prayer.title}`}
              >
                <View style={styles.prayerContent}>
                  <View style={styles.prayerIcon}>
                    <Ionicons name="document-text-outline" size={32} color={PRIMARY_BLUE} />
                  </View>
                  <View style={styles.prayerTextBlock}>
                    <Text style={styles.prayerTitle}>{prayer.title}</Text>
                    <Text style={styles.prayerDesc}>{prayer.description || 'תפילה מיוחדת'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={PRIMARY_BLUE} />
                </View>
              </Pressable>
              {isAdmin && (
                <View style={styles.adminActions}>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => handleEditPrayer(prayer)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="create-outline" size={20} color={PRIMARY_BLUE} />
                    <Text style={styles.editButtonText}>ערוך</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeletePrayer(prayer)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>מחק</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}

        <View style={styles.footerCard}>
          <Ionicons name="heart-outline" size={32} color={PRIMARY_BLUE} />
          <View style={styles.footerTextBlock}>
            <Text style={styles.footerTitle}>תפילות נוספות</Text>
            <Text style={styles.footerDesc}>
              תפילות נוספות יופיעו כאן בקרוב.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 18,
  },
  subtitle: {
    alignSelf: 'flex-end',
    color: DEEP_BLUE,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_500Medium',
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
  prayerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  prayerContentPressable: {
    flex: 1,
  },
  adminActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(11,27,58,0.1)',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderWidth: 1,
    borderColor: PRIMARY_BLUE,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ef4444',
  },
  prayerCardFirst: {
    marginTop: 6,
  },
  prayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  prayerIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  prayerTitle: {
    color: DEEP_BLUE,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'right',
  },
  prayerDesc: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
  },
  footerCard: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  footerTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  footerTitle: {
    color: DEEP_BLUE,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  footerDesc: {
    color: '#4b5563',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
  commitmentButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 8,
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  commitmentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  commitmentButtonTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  commitmentButtonTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
    textAlign: 'right',
  },
  commitmentButtonDesc: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
})
