import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function ContactRabbiScreen({ navigation }) {
  const [form, setForm] = useState({
    email: '',
    phone: '',
    title: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Validate form
    if (!form.email || !form.phone || !form.title || !form.message) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      Alert.alert('שגיאה', 'אנא הכנס כתובת אימייל תקינה')
      return
    }

    // Validate phone format (basic)
    const phoneRegex = /^[0-9]{9,10}$/
    if (!phoneRegex.test(form.phone.replace(/\D/g, ''))) {
      Alert.alert('שגיאה', 'אנא הכנס מספר טלפון תקין')
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      Alert.alert(
        'נשלח בהצלחה! ✅',
        'ההודעה שלך נשלחה לרבי יהודה בארי. תקבל תשובה בהקדם האפשרי.',
        [
          {
            text: 'אישור',
            onPress: () => {
              // Reset form
              setForm({ email: '', phone: '', title: '', message: '' })
              navigation.goBack()
            },
          },
        ]
      )
    } catch (error) {
      Alert.alert('שגיאה', 'אירעה שגיאה בשליחת ההודעה. אנא נסה שוב.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="חזרה"
          >
            <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
          </Pressable>
          <Text style={styles.headerTitle}>כתוב פיתקא</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introCard}>
            <Ionicons name="mail-outline" size={32} color={PRIMARY_BLUE} />
            <Text style={styles.introTitle}>כתוב קוויטלעך</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>כתובת אימייל *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={PRIMARY_BLUE} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#9ca3af"
                  value={form.email}
                  onChangeText={(text) => setForm({ ...form, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>מספר טלפון *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={PRIMARY_BLUE} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="050-1234567"
                  placeholderTextColor="#9ca3af"
                  value={form.phone}
                  onChangeText={(text) => setForm({ ...form, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>כותרת *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={20} color={PRIMARY_BLUE} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="נושא ההודעה"
                  placeholderTextColor="#9ca3af"
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>הודעה *</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="כתוב כאן את ההודעה שלך..."
                  placeholderTextColor="#9ca3af"
                  value={form.message}
                  onChangeText={(text) => setForm({ ...form, message: text })}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <Pressable
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[PRIMARY_BLUE, '#1e40af']}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <Text style={styles.submitButtonText}>שולח...</Text>
                ) : (
                  <>
                    <Ionicons name="send-outline" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>שלח פיתקא</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.footerCard}>
            <Ionicons name="information-circle-outline" size={24} color={PRIMARY_BLUE} />
            <View style={styles.footerTextBlock}>
              <Text style={styles.footerTitle}>הערה חשובה</Text>
              <Text style={styles.footerDesc}>
                ההודעה תישלח לרבי יהודה בארי. תקבל תשובה בהקדם האפשרי. בהמשך נחבר את זה באופן אמיתי.
              </Text>
            </View>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.1)',
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
  },
  introCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  introTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginTop: 12,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
    paddingHorizontal: 12,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    paddingVertical: 12,
  },
  textAreaContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
    minHeight: 150,
    padding: 12,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 22,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(30,58,138,0.08)',
    borderRadius: 14,
    padding: 16,
  },
  footerTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  footerTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  footerDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    lineHeight: 18,
  },
})


