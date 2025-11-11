import React, { useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { sendLocalNotification, formatAlertForPush } from '../utils/notifications'

const GOLD = '#E63946'
const BG = '#FFFFFF'
const DEEP_BLUE = '#2D6A4F'

const TABS = [
  { id: 'alerts', label: 'התראות', icon: 'notifications-outline' },
  { id: 'courses', label: 'קורסים', icon: 'school-outline' },
  { id: 'recommendations', label: 'המלצות', icon: 'sparkles-outline' },
  { id: 'news', label: 'חדשות', icon: 'newspaper-outline' },
]

export default function AdminScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('alerts')

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f7f7f7']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={styles.headerTitle}>🔐 פאנל אדמין</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map(tab => (
            <Pressable
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? GOLD : '#6b7280'}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'alerts' && <AlertsForm />}
        {activeTab === 'courses' && <CoursesForm />}
        {activeTab === 'recommendations' && <RecommendationsForm />}
        {activeTab === 'news' && <NewsForm />}
      </ScrollView>
    </SafeAreaView>
  )
}

// ========== ALERTS FORM ==========
function AlertsForm() {
  const [form, setForm] = useState({
    symbol: 'AAPL',
    title: 'Apple Inc.',
    type: 'buy',
    price: '$182.45',
    change: '+2.4%',
    message: 'פריצה מעל רמת התנגדות קריטית ב-$180. מומנטום חיובי.',
    priority: 'high',
    targetAudience: ['premium', 'vip']
  })

  const handleSubmit = () => {
    // Mock: שליחת התראה מקומית לבדיקה
    const notification = formatAlertForPush({
      id: Date.now().toString(),
      ...form
    })

    sendLocalNotification(notification)

    Alert.alert(
      'התראה נשלחה! 🎉',
      `סימבול: ${form.symbol}\nסוג: ${form.type}\nמחיר: ${form.price}\n\nבגרסה הסופית, זה יישמר ב-Firestore וישלח Push לכל המשתמשים.`
    )
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📱 יצירת התראה חדשה</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>סימבול מנייה</Text>
        <TextInput
          style={styles.input}
          value={form.symbol}
          onChangeText={text => setForm({...form, symbol: text})}
          placeholder="AAPL"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>שם מלא</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({...form, title: text})}
          placeholder="Apple Inc."
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>סוג התראה</Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'buy', label: '📈 קנייה', color: '#16a34a' },
            { value: 'sell', label: '📉 מכירה', color: '#dc2626' },
            { value: 'watch', label: '👁️ מעקב', color: '#f59e0b' }
          ].map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.radioButton,
                form.type === option.value && { backgroundColor: `${option.color}15`, borderColor: option.color }
              ]}
              onPress={() => setForm({...form, type: option.value})}
            >
              <Text style={[styles.radioText, form.type === option.value && { color: option.color }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>מחיר</Text>
          <TextInput
            style={styles.input}
            value={form.price}
            onChangeText={text => setForm({...form, price: text})}
            placeholder="$182.45"
          />
        </View>

        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>שינוי</Text>
          <TextInput
            style={styles.input}
            value={form.change}
            onChangeText={text => setForm({...form, change: text})}
            placeholder="+2.4%"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>הודעה (80-120 תווים)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.message}
          onChangeText={text => setForm({...form, message: text})}
          placeholder="הודעה קצרה על ההתראה..."
          multiline
          numberOfLines={3}
          maxLength={120}
        />
        <Text style={styles.charCount}>{form.message.length}/120</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>עדיפות</Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'high', label: '🔥 דחוף', color: '#dc2626' },
            { value: 'medium', label: '⚡ בינוני', color: '#f59e0b' },
            { value: 'low', label: '💡 נמוך', color: '#6b7280' }
          ].map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.radioButton,
                form.priority === option.value && { backgroundColor: `${option.color}15`, borderColor: option.color }
              ]}
              onPress={() => setForm({...form, priority: option.value})}
            >
              <Text style={[styles.radioText, form.priority === option.value && { color: option.color }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קהל יעד</Text>
        <View style={styles.checkboxGroup}>
          {[
            { value: 'free', label: 'משתמשים חינמיים' },
            { value: 'premium', label: 'Premium' },
            { value: 'vip', label: 'VIP בלבד' }
          ].map(option => (
            <Pressable
              key={option.value}
              style={styles.checkbox}
              onPress={() => {
                if (form.targetAudience.includes(option.value)) {
                  setForm({...form, targetAudience: form.targetAudience.filter(a => a !== option.value)})
                } else {
                  setForm({...form, targetAudience: [...form.targetAudience, option.value]})
                }
              }}
            >
              <View style={[styles.checkboxBox, form.targetAudience.includes(option.value) && styles.checkboxBoxChecked]}>
                {form.targetAudience.includes(option.value) && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient colors={[GOLD, '#c49b2e']} style={StyleSheet.absoluteFill} />
        <Ionicons name="send" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>שלח התראה + Push</Text>
      </Pressable>

      <Text style={styles.note}>
        💡 כרגע זה שולח התראה מקומית לבדיקה. בגרסה הסופית, זה יישמר ב-Firestore וישלח Push לכל המשתמשים.
      </Text>
    </View>
  )
}

// ========== COURSES FORM ==========
function CoursesForm() {
  const [form, setForm] = useState({
    title: 'Foundations of Trading',
    level: 'Beginner',
    duration: '6 פרקים • 3.5 שעות',
    description: 'מבוא למסחר ממושמע — הגדרת מטרות, ניהול סיכונים ובניית שגרה יומית.',
    isPremium: false
  })

  const handleSubmit = () => {
    Alert.alert(
      'קורס יתווסף! 📚',
      `כותרת: ${form.title}\nרמה: ${form.level}\n\nבגרסה הסופית:\n• העלאת וידאו ל-Firebase Storage\n• שמירת metadata ל-Firestore\n• העלאת תמונת cover`
    )
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📚 הוספת קורס חדש</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת הקורס</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({...form, title: text})}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>רמת קושי</Text>
        <View style={styles.radioGroup}>
          {['Beginner', 'Intermediate', 'Advanced', 'Mindset'].map(level => (
            <Pressable
              key={level}
              style={[styles.radioButton, form.level === level && styles.radioButtonActive]}
              onPress={() => setForm({...form, level})}
            >
              <Text style={[styles.radioText, form.level === level && styles.radioTextActive]}>
                {level}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>משך הקורס</Text>
        <TextInput
          style={styles.input}
          value={form.duration}
          onChangeText={text => setForm({...form, duration: text})}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={text => setForm({...form, description: text})}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Pressable
          style={styles.checkbox}
          onPress={() => setForm({...form, isPremium: !form.isPremium})}
        >
          <View style={[styles.checkboxBox, form.isPremium && styles.checkboxBoxChecked]}>
            {form.isPremium && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>🔒 קורס פרימיום (נעול למשתמשים רגילים)</Text>
        </Pressable>
      </View>

      <View style={styles.uploadSection}>
        <Pressable style={styles.uploadButton}>
          <Ionicons name="cloud-upload-outline" size={24} color={GOLD} />
          <Text style={styles.uploadButtonText}>העלה קובץ וידאו</Text>
        </Pressable>
        <Pressable style={styles.uploadButton}>
          <Ionicons name="image-outline" size={24} color={GOLD} />
          <Text style={styles.uploadButtonText}>העלה תמונת Cover</Text>
        </Pressable>
      </View>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient colors={[GOLD, '#c49b2e']} style={StyleSheet.absoluteFill} />
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>הוסף קורס</Text>
      </Pressable>
    </View>
  )
}

// ========== RECOMMENDATIONS FORM ==========
function RecommendationsForm() {
  const [form, setForm] = useState({
    title: 'למה אני לא משתמש ב-Stop Loss',
    type: 'video',
    description: 'הסבר מפורט למה זה יכול להזיק למסחר שלך',
    url: 'https://youtube.com/watch?v=...'
  })

  const handleSubmit = () => {
    Alert.alert(
      'המלצה תתווסף! ⭐',
      `כותרת: ${form.title}\nסוג: ${form.type}\n\nיופיע בבאנר "טל ממליץ לראות" במסך הבית`
    )
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>⭐ טל ממליץ לראות</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>סוג תוכן</Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'video', label: '🎥 וידאו' },
            { value: 'article', label: '📰 מאמר' },
            { value: 'podcast', label: '🎙️ פודקאסט' }
          ].map(option => (
            <Pressable
              key={option.value}
              style={[styles.radioButton, form.type === option.value && styles.radioButtonActive]}
              onPress={() => setForm({...form, type: option.value})}
            >
              <Text style={[styles.radioText, form.type === option.value && styles.radioTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({...form, title: text})}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור קצר</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={text => setForm({...form, description: text})}
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור (URL)</Text>
        <TextInput
          style={styles.input}
          value={form.url}
          onChangeText={text => setForm({...form, url: text})}
          placeholder="https://..."
          autoCapitalize="none"
        />
      </View>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient colors={[GOLD, '#c49b2e']} style={StyleSheet.absoluteFill} />
        <Ionicons name="star" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>פרסם המלצה</Text>
      </Pressable>
    </View>
  )
}

// ========== NEWS FORM ==========
function NewsForm() {
  const [form, setForm] = useState({
    title: 'השוק בתנודתיות גבוהה',
    category: 'market',
    content: 'המדדים הראשיים נסחרים בתנודתיות גבוהה...',
  })

  const handleSubmit = () => {
    Alert.alert('חדשה תתפרסם! 📰', `כותרת: ${form.title}\nקטגוריה: ${form.category}`)
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📰 פרסום חדשה</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'market', label: '📊 שוק' },
            { value: 'crypto', label: '₿ קריפטו' },
            { value: 'education', label: '📚 לימוד' }
          ].map(option => (
            <Pressable
              key={option.value}
              style={[styles.radioButton, form.category === option.value && styles.radioButtonActive]}
              onPress={() => setForm({...form, category: option.value})}
            >
              <Text style={[styles.radioText, form.category === option.value && styles.radioTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({...form, title: text})}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תוכן</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.content}
          onChangeText={text => setForm({...form, content: text})}
          multiline
          numberOfLines={6}
        />
      </View>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient colors={[GOLD, '#c49b2e']} style={StyleSheet.absoluteFill} />
        <Ionicons name="newspaper" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>פרסם חדשה</Text>
      </Pressable>
    </View>
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
    paddingTop: Platform.select({ ios: 12, android: 12, default: 12 }),
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  tabsContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.08)',
  },
  tabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(11,27,58,0.04)',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  tabTextActive: {
    color: GOLD,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    gap: 20,
  },
  formTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 8,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
    textAlign: 'left',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(11,27,58,0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: GOLD,
  },
  radioText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  radioTextActive: {
    color: GOLD,
  },
  checkboxGroup: {
    gap: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
  },
  uploadSection: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GOLD,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  uploadButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: GOLD,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  note: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    lineHeight: 18,
    backgroundColor: 'rgba(212,175,55,0.08)',
    padding: 12,
    borderRadius: 10,
  },
})
