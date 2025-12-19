import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { collection, getDocs, query, orderBy, addDoc, Timestamp, where } from 'firebase/firestore'
import { db } from '../config/firebase'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function PidyonNefeshScreen({ navigation }) {
  const [pidyonList, setPidyonList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [motherName, setMotherName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadPidyonList()
  }, [])

  const loadPidyonList = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const q = query(
        collection(db, 'pidyonNefesh'),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const pidyonData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPidyonList(pidyonData)
    } catch (error) {
      console.error('Error loading pidyon nefesh list:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את רשימת הפדיון נפש')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !motherName.trim()) {
      Alert.alert('שגיאה', 'נא למלא שם ושם האם')
      return
    }

    if (description.length > 50) {
      Alert.alert('שגיאה', 'התיאור צריך להיות עד 50 תווים')
      return
    }

    try {
      setSubmitting(true)

      await addDoc(collection(db, 'pidyonNefesh'), {
        name: name.trim(),
        motherName: motherName.trim(),
        description: description.trim(),
        createdAt: Timestamp.now(),
      })

      Alert.alert('הצלחה', 'הפדיון נפש נוסף בהצלחה')
      setName('')
      setMotherName('')
      setDescription('')
      setShowForm(false)
      loadPidyonList()
    } catch (error) {
      console.error('Error adding pidyon nefesh:', error)
      Alert.alert('שגיאה', 'לא ניתן להוסיף פדיון נפש')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
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
          <Text style={styles.headerTitle}>פדיון נפש</Text>
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
        <Text style={styles.headerTitle}>פדיון נפש</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
          accessibilityRole="button"
        >
          <Ionicons name={showForm ? "close" : "add"} size={28} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>שמות לברכה ורפואה שלמה</Text>

        {/* Add Form */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>הוסף שם לפדיון נפש</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>שם *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="שם פרטי"
                placeholderTextColor="#9ca3af"
                textAlign="right"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>שם האם *</Text>
              <TextInput
                style={styles.input}
                value={motherName}
                onChangeText={setMotherName}
                placeholder="שם האם"
                placeholderTextColor="#9ca3af"
                textAlign="right"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>תיאור קצר (עד 50 תווים)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={(text) => {
                  if (text.length <= 50) {
                    setDescription(text)
                  }
                }}
                placeholder="לרפואה / לזיווג / לפרנסה..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={50}
                textAlign="right"
              />
              <Text style={styles.charCount}>{description.length}/50</Text>
            </View>

            <Pressable
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={submitting ? ['#9ca3af', '#6b7280'] : [PRIMARY_BLUE, '#1e40af']}
                style={styles.submitGradient}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.submitText}>שולח...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="heart" size={20} color="#fff" />
                    <Text style={styles.submitText}>שלח</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Pidyon List */}
        {pidyonList.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>אין שמות לפדיון נפש כרגע</Text>
            <Text style={styles.emptySubtext}>תוכל להוסיף שם חדש</Text>
          </View>
        ) : (
          pidyonList.map((pidyon, idx) => (
            <View key={pidyon.id} style={[styles.pidyonCard, idx === 0 && styles.pidyonCardFirst]}>
              <View style={styles.pidyonContent}>
                <View style={styles.pidyonIcon}>
                  <Ionicons name="heart" size={28} color={PRIMARY_BLUE} />
                </View>
                <View style={styles.pidyonTextBlock}>
                  <Text style={styles.pidyonName}>
                    {pidyon.name} בן/בת {pidyon.motherName}
                  </Text>
                  {pidyon.description && (
                    <Text style={styles.pidyonDesc}>{pidyon.description}</Text>
                  )}
                  <Text style={styles.pidyonDate}>{formatDate(pidyon.createdAt)}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.footerCard}>
          <Ionicons name="heart-outline" size={32} color={PRIMARY_BLUE} />
          <View style={styles.footerTextBlock}>
            <Text style={styles.footerTitle}>פדיון נפש</Text>
            <Text style={styles.footerDesc}>
              הרב יתפלל על כל השמות שנמצאים ברשימה
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
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
    gap: 16,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 8,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'left',
    fontFamily: 'Poppins_400Regular',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  pidyonCard: {
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
  pidyonCardFirst: {
    marginTop: 6,
  },
  pidyonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  pidyonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(30,58,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pidyonTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  pidyonName: {
    color: DEEP_BLUE,
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'right',
  },
  pidyonDesc: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
  },
  pidyonDate: {
    color: '#9ca3af',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    marginTop: 4,
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
