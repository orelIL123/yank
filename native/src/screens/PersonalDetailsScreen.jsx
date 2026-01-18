import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, TextInput, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { auth, db as firestoreDb } from '../config/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function PersonalDetailsScreen({ navigation, user }) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [user])

  const loadUserData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setEmail(user.email || '')
      setDisplayName(user.displayName || '')

      // Load additional data from Firestore
      const userDoc = await getDoc(doc(firestoreDb, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setPhone(userData.phone || '')
        if (userData.displayName) {
          setDisplayName(userData.displayName)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את הנתונים')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Update Firestore
      const userRef = doc(firestoreDb, 'users', user.uid)
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        phone: phone.trim() || null,
      })

      Alert.alert('הצלחה', 'הפרטים עודכנו בהצלחה')
      navigation?.goBack()
    } catch (error) {
      console.error('Error saving user data:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הנתונים')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          style={styles.backButton}
          hitSlop={12}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-forward" size={28} color={DEEP_BLUE} />
        </Pressable>
        <Text style={styles.headerTitle}>פרטים אישיים</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>שם מלא</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="הכנס שם מלא"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>אימייל</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.helpText}>אימייל לא ניתן לשינוי</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>טלפון</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="הכנס מספר טלפון"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
                <Text style={styles.saveButtonText}>שמור שינויים</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingTop: Platform.select({ ios: 48, android: 34, default: 42 }),
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.08)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
    textAlign: 'right',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
})

