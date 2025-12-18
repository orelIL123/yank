import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, Image, ActivityIndicator, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
// DocumentPicker will be imported dynamically when needed
import { collection, addDoc, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import { pickImage, uploadImageToStorage, generateCardImagePath, generateNewsImagePath, pickPDF, uploadPDFToStorage, generatePrayerPDFPath } from '../utils/storage'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

const TABS = [
  { id: 'cards', label: 'כרטיסיות', icon: 'grid-outline' },
  { id: 'books', label: 'ספרים', icon: 'book-outline' },
  { id: 'prayers', label: 'תפילות', icon: 'heart-outline' },
  { id: 'newsletters', label: 'עלונים', icon: 'document-text-outline' },
  { id: 'dailyLearning', label: 'לימוד יומי', icon: 'school-outline' },
  { id: 'chidushim', label: 'חידושים', icon: 'bulb-outline' },
  { id: 'yeshiva', label: 'בית המדרש', icon: 'business-outline' },
  { id: 'tzadikim', label: 'צדיקים', icon: 'people-outline' },
  { id: 'music', label: 'ניגונים', icon: 'musical-notes-outline' },
  { id: 'notifications', label: 'התראות', icon: 'notifications-outline' },
]

export default function AdminScreen({ navigation, route }) {
  // Check if initialTab was passed from navigation
  const initialTab = route?.params?.initialTab || 'books';
  const [activeTab, setActiveTab] = useState(initialTab);

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
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
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
                color={activeTab === tab.id ? PRIMARY_BLUE : '#6b7280'}
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
        {activeTab === 'cards' && <CardsForm />}
        {activeTab === 'books' && <BooksForm />}
        {activeTab === 'prayers' && <PrayersForm />}
        {activeTab === 'newsletters' && <NewslettersForm />}
        {activeTab === 'dailyLearning' && <DailyLearningForm />}
        {activeTab === 'chidushim' && <ChidushimForm />}
        {activeTab === 'yeshiva' && <YeshivaForm />}
        {activeTab === 'tzadikim' && <TzadikimForm />}
        {activeTab === 'music' && <MusicForm />}
        {activeTab === 'notifications' && <NotificationsForm />}
      </ScrollView>
    </SafeAreaView>
  )
}

// ========== CARDS FORM ==========
function CardsForm() {
  const [form, setForm] = useState({
    key: '',
    title: '',
    desc: '',
    icon: 'grid-outline',
    locked: false,
    order: 0,
    imageUri: null,
    imageUrl: null,
  })
  const [uploading, setUploading] = useState(false)

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9] })
    if (image) {
      setForm({ ...form, imageUri: image.uri })
    }
  }

  const handleUploadImage = async () => {
    if (!form.imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const path = generateCardImagePath(form.key, 'card-image.jpg')
      const url = await uploadImageToStorage(form.imageUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, imageUrl: url })
      Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.key || !form.title) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות הנדרשים')
      return
    }

    if (form.imageUri && !form.imageUrl) {
      Alert.alert('שים לב', 'אנא העלה את התמונה לפני השמירה')
      return
    }

    setSaving(true)
    try {
      // Save to Firestore
      const cardRef = doc(db, 'homeCards', form.key)
      await setDoc(cardRef, {
        key: form.key,
        title: form.title,
        desc: form.desc,
        icon: form.icon,
        imageUrl: form.imageUrl || '',
        locked: form.locked,
        order: form.order || 0,
        isActive: true,
        route: form.key, // Navigation route
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true })

      Alert.alert(
        'הצלחה! 🎴',
        'הכרטיסייה נשמרה בהצלחה ותופיע במסך הבית',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({
                key: '',
                title: '',
                desc: '',
                icon: 'grid-outline',
                locked: false,
                order: 0,
                imageUri: null,
                imageUrl: '',
              })
            }
          }
        ]
      )
      console.log('Card saved successfully:', form.key)
    } catch (error) {
      console.error('Error saving card:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הכרטיסייה. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>🎴 עריכת כרטיסיות ראשיות</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>מזהה כרטיס (Key) *</Text>
        <TextInput
          style={styles.input}
          value={form.key}
          onChangeText={text => setForm({ ...form, key: text.replace(/\s/g, '-').toLowerCase() })}
          placeholder="לדוגמה: daily-insight"
          autoCapitalize="none"
        />
        <Text style={styles.helpText}>המזהה צריך להיות ייחודי (ללא רווחים, באנגלית)</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת הכרטיס</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="ערך יומי"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.desc}
          onChangeText={text => setForm({ ...form, desc: text })}
          placeholder="תובנה מעוררת השראה ליום שלך"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>אייקון (Ionicons name)</Text>
        <TextInput
          style={styles.input}
          value={form.icon}
          onChangeText={text => setForm({ ...form, icon: text })}
          placeholder="bulb-outline"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Pressable
          style={styles.checkbox}
          onPress={() => setForm({ ...form, locked: !form.locked })}
        >
          <View style={[styles.checkboxBox, form.locked && styles.checkboxBoxChecked]}>
            {form.locked && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>🔒 כרטיס נעול (רק למשתמשים רשומים)</Text>
        </Pressable>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונת רקע</Text>
        {form.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {form.imageUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.imageUri ? 'בחר תמונה אחרת' : 'בחר תמונת רקע'}
            </Text>
          </Pressable>
          {form.imageUri && !form.imageUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.separator} />

      <Text style={styles.sectionSubtitle}>כותרת ראשית מעל הכרטיסיות</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>סדר (Order) *</Text>
        <TextInput
          style={styles.input}
          value={form.order?.toString() || '0'}
          onChangeText={text => setForm({ ...form, order: parseInt(text) || 0 })}
          placeholder="0"
          keyboardType="numeric"
        />
        <Text style={styles.helpText}>מספר קטן יותר = יופיע ראשון</Text>
      </View>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        <Ionicons name="save" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>שמור שינויים</Text>
      </Pressable>

      <Text style={styles.note}>
        💡 שינויים יופיעו מיידית לאחר שמירה ב-Firestore. התמונות יועלו ל-Firebase Storage.
      </Text>
    </View>
  )
}

// ========== BOOKS FORM ==========
function BooksForm() {
  const [form, setForm] = useState({
    title: '',
    note: '',
    price: '',
    link: '',
    imageUri: null,
    imageUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9] })
    if (image) {
      setForm({ ...form, imageUri: image.uri })
    }
  }

  const handleUploadImage = async () => {
    if (!form.imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const path = `books/${timestamp}/image.jpg`
      const url = await uploadImageToStorage(form.imageUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, imageUrl: url })
      Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title) {
      Alert.alert('שגיאה', 'אנא הזן כותרת הספר')
      return
    }

    if (form.imageUri && !form.imageUrl) {
      Alert.alert('שים לב', 'אנא העלה את התמונה לפני השמירה')
      return
    }

    try {
      setSaving(true)
      await addDoc(collection(db, 'books'), {
        title: form.title,
        note: form.note || '',
        price: form.price || '',
        link: form.link || '',
        imageUrl: form.imageUrl || '',
        createdAt: serverTimestamp(),
      })

      Alert.alert(
        'הצלחה! 📚',
        'הספר נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({
                title: '',
                note: '',
                price: '',
                link: '',
                imageUri: null,
                imageUrl: '',
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving book:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הספר. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📚 הוספת ספר</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת הספר *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: ליקוטי מוהר״ן"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור/הערה</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.note}
          onChangeText={text => setForm({ ...form, note: text })}
          placeholder="תיאור קצר על הספר..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>מחיר (אופציונלי)</Text>
          <TextInput
            style={styles.input}
            value={form.price}
            onChangeText={text => setForm({ ...form, price: text })}
            placeholder="₪99"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור לרכישה (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.link}
          onChangeText={text => setForm({ ...form, link: text })}
          placeholder="https://..."
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונת הספר (אופציונלי)</Text>
        {form.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {form.imageUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.imageUri ? 'בחר תמונה אחרת' : 'בחר תמונה'}
            </Text>
          </Pressable>
          {form.imageUri && !form.imageUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, (saving || uploading) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving || uploading}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="book" size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? 'שומר...' : 'הוסף ספר'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 הספר יישמר ב-Firestore ויופיע באפליקציה במסך "ספרים".
      </Text>
    </View>
  )
}

// ========== NEWSLETTERS FORM ==========
function NewslettersForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'פרשת השבוע',
    fileType: 'pdf',
    fileUri: null,
    fileUrl: null,
  })
  const [uploading, setUploading] = useState(false)

  const handlePickFile = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker')
      const result = await DocumentPicker.getDocumentAsync({
        type: form.fileType === 'pdf' ? 'application/pdf' : 'image/*',
        copyToCacheDirectory: true,
      })

      if (result.type === 'success' || !result.canceled) {
        const file = result.assets ? result.assets[0] : result
        setForm({ ...form, fileUri: file.uri })
      }
    } catch (error) {
      console.error('Error picking file:', error)
      Alert.alert('שגיאה', 'לא ניתן לבחור קובץ')
    }
  }

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [3, 4] })
    if (image) {
      setForm({ ...form, fileUri: image.uri, fileType: 'image' })
    }
  }

  const handleUploadFile = async () => {
    if (!form.fileUri) {
      Alert.alert('שגיאה', 'אנא בחר קובץ תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const extension = form.fileType === 'pdf' ? 'pdf' : 'jpg'
      const path = `newsletters/${timestamp}/newsletter.${extension}`

      const url = await uploadImageToStorage(form.fileUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })

      setForm({ ...form, fileUrl: url })
      Alert.alert('הצלחה!', 'הקובץ הועלה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את הקובץ')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title) {
      Alert.alert('שגיאה', 'אנא הזן כותרת')
      return
    }

    if (form.fileUri && !form.fileUrl) {
      Alert.alert('שים לב', 'אנא העלה את הקובץ לפני השמירה')
      return
    }

    try {
      setUploading(true)

      // Save to Firestore
      await addDoc(collection(db, 'newsletters'), {
        title: form.title,
        description: form.description,
        category: form.category,
        fileType: form.fileType,
        fileUrl: form.fileUrl || '',
        thumbnailUrl: form.fileType === 'image' ? form.fileUrl : '',
        publishDate: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      Alert.alert(
        'הצלחה! 📰',
        'העלון נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              // Reset form
              setForm({
                title: '',
                description: '',
                category: 'פרשת השבוע',
                fileType: 'pdf',
                fileUri: null,
                fileUrl: null,
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving newsletter:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את העלון. אנא נסה שנית.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📰 הוספת עלון חדש</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת העלון</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: פרשת בראשית"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור (אופציונלי)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={text => setForm({ ...form, description: text })}
          placeholder="תיאור קצר של העלון..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <View style={styles.radioGroup}>
          {['פרשת השבוע', 'חגים ומועדים', 'הלכה', 'כללי'].map(cat => (
            <Pressable
              key={cat}
              style={[styles.radioButton, form.category === cat && styles.radioButtonActive]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Text style={[styles.radioText, form.category === cat && styles.radioTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>סוג קובץ</Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'pdf', label: '📄 PDF' },
            { value: 'image', label: '🖼️ תמונה' }
          ].map(option => (
            <Pressable
              key={option.value}
              style={[styles.radioButton, form.fileType === option.value && styles.radioButtonActive]}
              onPress={() => setForm({ ...form, fileType: option.value, fileUri: null, fileUrl: null })}
            >
              <Text style={[styles.radioText, form.fileType === option.value && styles.radioTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קובץ העלון</Text>
        {form.fileUri && (
          <View style={styles.imagePreview}>
            {form.fileType === 'image' ? (
              <Image source={{ uri: form.fileUri }} style={styles.previewImage} />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' }}>
                <Ionicons name="document-text" size={60} color={PRIMARY_BLUE} />
                <Text style={{ marginTop: 8, color: PRIMARY_BLUE, fontFamily: 'Poppins_500Medium' }}>PDF נבחר</Text>
              </View>
            )}
            {form.fileUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={form.fileType === 'pdf' ? handlePickFile : handlePickImage}
            disabled={uploading}
          >
            <Ionicons name={form.fileType === 'pdf' ? 'document-outline' : 'image-outline'} size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.fileUri ? 'בחר קובץ אחר' : `בחר ${form.fileType === 'pdf' ? 'PDF' : 'תמונה'}`}
            </Text>
          </Pressable>
          {form.fileUri && !form.fileUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadFile}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה קובץ'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>הוסף עלון</Text>
      </Pressable>

      <Text style={styles.note}>
        💡 העלון יישמר ב-Firestore ויהיה זמין לצפייה והורדה באפליקציה.
      </Text>
    </View>
  )
}

// ========== MUSIC FORM ==========
function MusicForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    youtubeId: '',
    category: 'ניגונים',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title || !form.youtubeId) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות הנדרשים')
      return
    }

    try {
      setSaving(true)

      // Save to Firestore
      await addDoc(collection(db, 'music'), {
        title: form.title,
        description: form.description,
        youtubeId: form.youtubeId,
        category: form.category,
        imageUrl: `https://i.ytimg.com/vi/${form.youtubeId}/hqdefault.jpg`,
        createdAt: serverTimestamp(),
      })

      Alert.alert(
        'הצלחה! 🎵',
        'הניגון נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              // Reset form
              setForm({
                title: '',
                description: '',
                youtubeId: '',
                category: 'ניגונים',
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving music:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הניגון. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>🎵 הוספת ניגון חדש</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת הניגון</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder='לדוגמה: "שרו של ים"'
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור (אופציונלי)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={text => setForm({ ...form, description: text })}
          placeholder="תיאור קצר של הניגון..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>YouTube Video ID</Text>
        <TextInput
          style={styles.input}
          value={form.youtubeId}
          onChangeText={text => setForm({ ...form, youtubeId: text })}
          placeholder="cB4tvSWyeMg"
          autoCapitalize="none"
        />
        <Text style={styles.note}>
          💡 העתק את ה-ID מהקישור של YouTube. לדוגמה: מהקישור https://www.youtube.com/watch?v=cB4tvSWyeMg העתק רק את cB4tvSWyeMg
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <TextInput
          style={styles.input}
          value={form.category}
          onChangeText={text => setForm({ ...form, category: text })}
          placeholder="ניגונים"
        />
      </View>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        <Ionicons name="musical-notes" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>הוסף ניגון</Text>
      </Pressable>

      <Text style={styles.note}>
        💡 הניגון יישמר ב-Firestore ויהיה זמין לנגינה ישירות מ-YouTube באפליקציה.
      </Text>
    </View>
  )
}

// ========== DAILY LEARNING FORM ==========
function DailyLearningForm() {
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'תפילה',
    author: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
    audioUri: null,
    audioUrl: '',
    imageUri: null,
    imageUrl: '',
    youtubeId: '',
    videoUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handlePickAudio = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker')
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      })

      if (result.type === 'success' || !result.canceled) {
        const file = result.assets ? result.assets[0] : result
        setForm({ ...form, audioUri: file.uri })
      }
    } catch (error) {
      console.error('Error picking audio:', error)
      Alert.alert('שגיאה', 'לא ניתן לבחור קובץ אודיו')
    }
  }

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9] })
    if (image) {
      setForm({ ...form, imageUri: image.uri })
    }
  }

  const handleUploadAudio = async () => {
    if (!form.audioUri) {
      Alert.alert('שגיאה', 'אנא בחר קובץ אודיו תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const path = `dailyLearning/audio/${timestamp}/audio.mp3`
      const url = await uploadImageToStorage(form.audioUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, audioUrl: url })
      Alert.alert('הצלחה!', 'הקובץ האודיו הועלה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את קובץ האודיו')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadImage = async () => {
    if (!form.imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const path = `dailyLearning/images/${timestamp}/image.jpg`
      const url = await uploadImageToStorage(form.imageUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, imageUrl: url })
      Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title) {
      Alert.alert('שגיאה', 'אנא הזן כותרת')
      return
    }

    if ((form.audioUri && !form.audioUrl) || (form.imageUri && !form.imageUrl)) {
      Alert.alert('שים לב', 'אנא העלה את הקבצים לפני השמירה')
      return
    }

    try {
      setSaving(true)

      // Convert date string to Firestore Timestamp
      let learningDate
      if (form.date) {
        learningDate = new Date(form.date)
        learningDate.setHours(8, 0, 0, 0) // Set to 8:00 AM
      } else {
        learningDate = new Date()
        learningDate.setHours(8, 0, 0, 0)
      }

      // Save to Firestore
      await addDoc(collection(db, 'dailyLearning'), {
        title: form.title,
        content: form.content || '',
        category: form.category,
        author: form.author || 'הרב שלמה יהודה בארי',
        date: Timestamp.fromDate(learningDate),
        audioUrl: form.audioUrl || '',
        imageUrl: form.imageUrl || '',
        youtubeId: form.youtubeId || '',
        videoUrl: form.videoUrl || '',
        viewCount: 0,
        playCount: 0,
        soulElevations: 0,
        isActive: true,
        createdAt: serverTimestamp(),
      })

      Alert.alert(
        'הצלחה! 📚',
        'הלימוד היומי נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              // Reset form
              setForm({
                title: '',
                content: '',
                category: 'תפילה',
                author: '',
                date: new Date().toISOString().split('T')[0],
                audioUri: null,
                audioUrl: '',
                imageUri: null,
                imageUrl: '',
                youtubeId: '',
                videoUrl: '',
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving daily learning:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הלימוד. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📚 הוספת לימוד יומי</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת הלימוד *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: חשיבות התפילה"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תוכן הלימוד</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.content}
          onChangeText={text => setForm({ ...form, content: text })}
          placeholder="כתוב את תוכן הלימוד כאן..."
          multiline
          numberOfLines={8}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <View style={styles.radioGroup}>
          {['תפילה', 'תורה', 'חיזוק', 'הלכה', 'מוסר', 'כללי'].map(cat => (
            <Pressable
              key={cat}
              style={[styles.radioButton, form.category === cat && styles.radioButtonActive]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Text style={[styles.radioText, form.category === cat && styles.radioTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>שם הכותב</Text>
        <TextInput
          style={styles.input}
          value={form.author}
          onChangeText={text => setForm({ ...form, author: text })}
          placeholder="הרב שלמה יהודה בארי"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תאריך הלימוד</Text>
        <TextInput
          style={styles.input}
          value={form.date}
          onChangeText={text => setForm({ ...form, date: text })}
          placeholder="YYYY-MM-DD"
        />
        <Text style={styles.note}>
          💡 פורמט: YYYY-MM-DD (לדוגמה: 2025-11-29)
        </Text>
      </View>

      {/* Audio Upload */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>הקלטה (אופציונלי)</Text>
        {form.audioUri && (
          <View style={styles.audioPreview}>
            <Ionicons name="musical-notes" size={40} color={PRIMARY_BLUE} />
            <Text style={styles.audioPreviewText}>קובץ אודיו נבחר</Text>
            {form.audioUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickAudio}
            disabled={uploading}
          >
            <Ionicons name="musical-notes-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.audioUri ? 'בחר קובץ אחר' : 'בחר קובץ אודיו'}
            </Text>
          </Pressable>
          {form.audioUri && !form.audioUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadAudio}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה אודיו'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Image Upload */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונה (אופציונלי)</Text>
        {form.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {form.imageUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.imageUri ? 'בחר תמונה אחרת' : 'בחר תמונה'}
            </Text>
          </Pressable>
          {form.imageUri && !form.imageUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* YouTube Video */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>YouTube Video ID (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.youtubeId}
          onChangeText={text => setForm({ ...form, youtubeId: text })}
          placeholder="cB4tvSWyeMg"
          autoCapitalize="none"
        />
        <Text style={styles.note}>
          💡 העתק את ה-ID מהקישור של YouTube. לדוגמה: מהקישור https://www.youtube.com/watch?v=cB4tvSWyeMg העתק רק את cB4tvSWyeMg
        </Text>
      </View>

      {/* Video URL */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור לסרטון (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.videoUrl}
          onChangeText={text => setForm({ ...form, videoUrl: text })}
          placeholder="https://..."
          autoCapitalize="none"
        />
        <Text style={styles.note}>
          💡 אם אין YouTube ID, ניתן להזין קישור ישיר לסרטון
        </Text>
      </View>

      <Pressable
        style={[styles.submitButton, (saving || uploading) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving || uploading}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="book" size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? 'שומר...' : 'הוסף לימוד יומי'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 הלימוד יישמר ב-Firestore ויופיע באפליקציה. ניתן להוסיף הקלטה, תמונה או סרטון.
      </Text>
    </View>
  )
}

// ========== PRAYERS FORM ==========
function PrayersForm() {
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'תפילה',
    imageUri: null,
    imageUrl: '',
    pdfUri: null,
    pdfUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadingPDF, setUploadingPDF] = useState(false)
  const [saving, setSaving] = useState(false)

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9] })
    if (image) {
      setForm({ ...form, imageUri: image.uri })
    }
  }

  const handleUploadImage = async () => {
    if (!form.imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const path = `prayers/${timestamp}/image.jpg`
      const url = await uploadImageToStorage(form.imageUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, imageUrl: url })
      Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handlePickPDF = async () => {
    const pdf = await pickPDF()
    if (pdf) {
      setForm({ ...form, pdfUri: pdf.uri, pdfName: pdf.name })
    }
  }

  const handleUploadPDF = async () => {
    if (!form.pdfUri) {
      Alert.alert('שגיאה', 'אנא בחר קובץ PDF תחילה')
      return
    }

    setUploadingPDF(true)
    try {
      const timestamp = Date.now()
      const filename = form.pdfName || `prayer_${timestamp}.pdf`
      const path = generatePrayerPDFPath(timestamp.toString(), filename)
      const url = await uploadPDFToStorage(form.pdfUri, path, (progress) => {
        console.log(`PDF upload progress: ${progress}%`)
      })
      setForm({ ...form, pdfUrl: url })
      Alert.alert('הצלחה!', 'קובץ ה-PDF הועלה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את קובץ ה-PDF')
      console.error(error)
    } finally {
      setUploadingPDF(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      Alert.alert('שגיאה', 'אנא מלא כותרת ותוכן')
      return
    }

    if (form.imageUri && !form.imageUrl) {
      Alert.alert('שים לב', 'אנא העלה את התמונה לפני השמירה')
      return
    }

    if (form.pdfUri && !form.pdfUrl) {
      Alert.alert('שים לב', 'אנא העלה את קובץ ה-PDF לפני השמירה')
      return
    }

    try {
      setSaving(true)
      await addDoc(collection(db, 'prayers'), {
        title: form.title,
        content: form.content,
        category: form.category,
        imageUrl: form.imageUrl || '',
        pdfUrl: form.pdfUrl || '',
        createdAt: serverTimestamp(),
      })

      Alert.alert(
        'הצלחה! 💜',
        'התפילה נוספה בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({
                title: '',
                content: '',
                category: 'תפילה',
                imageUri: null,
                imageUrl: '',
                pdfUri: null,
                pdfUrl: '',
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving prayer:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את התפילה. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>💜 הוספת תפילה</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת התפילה *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: תפילה לשלום עם ישראל"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תוכן התפילה *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.content}
          onChangeText={text => setForm({ ...form, content: text })}
          placeholder="כתוב את תוכן התפילה כאן..."
          multiline
          numberOfLines={10}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <View style={styles.radioGroup}>
          {['תפילה', 'סגולה', 'ברכה', 'כללי'].map(cat => (
            <Pressable
              key={cat}
              style={[styles.radioButton, form.category === cat && styles.radioButtonActive]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Text style={[styles.radioText, form.category === cat && styles.radioTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונה (אופציונלי)</Text>
        {form.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {form.imageUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading || uploadingPDF}
          >
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.imageUri ? 'בחר תמונה אחרת' : 'בחר תמונה'}
            </Text>
          </Pressable>
          {form.imageUri && !form.imageUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadImage}
              disabled={uploading || uploadingPDF}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קובץ PDF (אופציונלי)</Text>
        {form.pdfUri && (
          <View style={styles.pdfPreview}>
            <Ionicons name="document-text" size={48} color={PRIMARY_BLUE} />
            <Text style={styles.pdfName} numberOfLines={1}>
              {form.pdfName || 'קובץ PDF'}
            </Text>
            {form.pdfUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickPDF}
            disabled={uploading || uploadingPDF}
          >
            <Ionicons name="document-text-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.pdfUri ? 'בחר PDF אחר' : 'בחר קובץ PDF'}
            </Text>
          </Pressable>
          {form.pdfUri && !form.pdfUrl && (
            <Pressable
              style={[styles.uploadButton, uploadingPDF && styles.uploadButtonDisabled]}
              onPress={handleUploadPDF}
              disabled={uploading || uploadingPDF}
            >
              {uploadingPDF ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploadingPDF ? 'מעלה...' : 'העלה PDF'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, (saving || uploading || uploadingPDF) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving || uploading || uploadingPDF}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="heart" size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? 'שומר...' : 'הוסף תפילה'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 התפילה תישמר ב-Firestore ויופיע באפליקציה. PDFs יועלו ל-Firebase Storage.
      </Text>
    </View>
  )
}

// ========== CHIDUSHIM FORM ==========
function ChidushimForm() {
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'תורה',
    imageUri: null,
    imageUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9] })
    if (image) {
      setForm({ ...form, imageUri: image.uri })
    }
  }

  const handleUploadImage = async () => {
    if (!form.imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const path = `chidushim/${timestamp}/image.jpg`
      const url = await uploadImageToStorage(form.imageUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, imageUrl: url })
      Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      Alert.alert('שגיאה', 'אנא מלא כותרת ותוכן')
      return
    }

    if (form.imageUri && !form.imageUrl) {
      Alert.alert('שים לב', 'אנא העלה את התמונה לפני השמירה')
      return
    }

    try {
      setSaving(true)
      await addDoc(collection(db, 'chidushim'), {
        title: form.title,
        content: form.content,
        category: form.category,
        imageUrl: form.imageUrl || '',
        createdAt: serverTimestamp(),
      })

      Alert.alert(
        'הצלחה! 💡',
        'החידוש נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({
                title: '',
                content: '',
                category: 'תורה',
                imageUri: null,
                imageUrl: '',
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving chidush:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את החידוש. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>💡 הוספת חידוש</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת החידוש *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: חידוש על פרשת השבוע"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תוכן החידוש *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.content}
          onChangeText={text => setForm({ ...form, content: text })}
          placeholder="כתוב את תוכן החידוש כאן..."
          multiline
          numberOfLines={10}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <View style={styles.radioGroup}>
          {['תורה', 'הלכה', 'אגדה', 'מוסר', 'כללי'].map(cat => (
            <Pressable
              key={cat}
              style={[styles.radioButton, form.category === cat && styles.radioButtonActive]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Text style={[styles.radioText, form.category === cat && styles.radioTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונה (אופציונלי)</Text>
        {form.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {form.imageUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.imageUri ? 'בחר תמונה אחרת' : 'בחר תמונה'}
            </Text>
          </Pressable>
          {form.imageUri && !form.imageUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, (saving || uploading) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving || uploading}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="bulb" size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? 'שומר...' : 'הוסף חידוש'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 החידוש יישמר ב-Firestore ויופיע באפליקציה.
      </Text>
    </View>
  )
}

// ========== YESHIVA FORM (בית המדרש - חדשות) ==========
function YeshivaForm() {
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'כללי',
    imageUri: null,
    imageUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Short lesson form state
  const [shortLessonForm, setShortLessonForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    category: '',
  })
  const [savingShortLesson, setSavingShortLesson] = useState(false)

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9] })
    if (image) {
      setForm({ ...form, imageUri: image.uri })
    }
  }

  const handleUploadImage = async () => {
    if (!form.imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const path = `news/${timestamp}/image.jpg`
      const url = await uploadImageToStorage(form.imageUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, imageUrl: url })
      Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      Alert.alert('שגיאה', 'אנא מלא כותרת ותוכן')
      return
    }

    if (form.imageUri && !form.imageUrl) {
      Alert.alert('שים לב', 'אנא העלה את התמונה לפני השמירה')
      return
    }

    try {
      setSaving(true)
      await addDoc(collection(db, 'news'), {
        title: form.title,
        content: form.content,
        category: form.category,
        imageUrl: form.imageUrl || '',
        isPublished: true,
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      Alert.alert(
        'הצלחה! 📢',
        'החדשה מבית המדרש נוספה בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({
                title: '',
                content: '',
                category: 'כללי',
                imageUri: null,
                imageUrl: '',
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving news:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את החדשה. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      {/* Short Lessons Section - First! */}
      <Text style={styles.formTitle}>🎬 הוספת שיעור קצר</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת השיעור הקצר *</Text>
        <TextInput
          style={styles.input}
          value={shortLessonForm.title}
          onChangeText={text => setShortLessonForm({ ...shortLessonForm, title: text })}
          placeholder="הכנס כותרת השיעור"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={shortLessonForm.description}
          onChangeText={text => setShortLessonForm({ ...shortLessonForm, description: text })}
          placeholder="הכנס תיאור (אופציונלי)"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור YouTube *</Text>
        <TextInput
          style={styles.input}
          value={shortLessonForm.youtubeUrl}
          onChangeText={text => setShortLessonForm({ ...shortLessonForm, youtubeUrl: text })}
          placeholder="https://www.youtube.com/watch?v=..."
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.helpText}>
          העתק את הקישור המלא מ-YouTube (לדוגמה: https://www.youtube.com/watch?v=VIDEO_ID)
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <TextInput
          style={styles.input}
          value={shortLessonForm.category}
          onChangeText={text => setShortLessonForm({ ...shortLessonForm, category: text })}
          placeholder="הכנס קטגוריה (אופציונלי)"
        />
      </View>

      <Pressable
        style={[styles.submitButton, savingShortLesson && styles.submitButtonDisabled]}
        onPress={async () => {
          if (!shortLessonForm.title.trim() || !shortLessonForm.youtubeUrl.trim()) {
            Alert.alert('שגיאה', 'יש למלא כותרת וקישור YouTube')
            return
          }

          // Extract YouTube ID
          const youtubeIdPattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
          const match = shortLessonForm.youtubeUrl.match(youtubeIdPattern)
          if (!match || !match[1]) {
            Alert.alert('שגיאה', 'קישור YouTube לא תקין. אנא השתמש בקישור מלא מ-YouTube')
            return
          }

          setSavingShortLesson(true)
          try {
            await addDoc(collection(db, 'shortLessons'), {
              title: shortLessonForm.title.trim(),
              description: shortLessonForm.description.trim() || '',
              youtubeUrl: shortLessonForm.youtubeUrl.trim(),
              category: shortLessonForm.category.trim() || '',
              isActive: true,
              createdAt: serverTimestamp(),
              order: 0
            })

            Alert.alert(
              'הצלחה! 🎬',
              'השיעור הקצר נוסף בהצלחה ויופיע באפליקציה',
              [
                {
                  text: 'אישור',
                  onPress: () => {
                    setShortLessonForm({ title: '', description: '', youtubeUrl: '', category: '' })
                  }
                }
              ]
            )
          } catch (error) {
            console.error('Error saving short lesson:', error)
            const errorMessage = error.code === 'permission-denied' 
              ? 'אין הרשאה להוסיף שיעור. ודא שאתה מחובר כמנהל.'
              : error.message || 'לא ניתן להוסיף את השיעור. אנא נסה שנית.'
            Alert.alert('שגיאה', errorMessage)
          } finally {
            setSavingShortLesson(false)
          }
        }}
        disabled={savingShortLesson}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {savingShortLesson ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>הוסף שיעור קצר</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.note}>
        💡 השיעור הקצר יישמר ב-Firestore ויופיע באפליקציה במסך "שיעורים קצרים".
      </Text>

      <View style={styles.separator} />

      {/* News Section */}
      <Text style={styles.formTitle}>📢 הוספת חדשה מבית המדרש</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת החדשה *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: שיעור חדש בבית המדרש"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תוכן החדשה *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.content}
          onChangeText={text => setForm({ ...form, content: text })}
          placeholder="כתוב את תוכן החדשה כאן..."
          multiline
          numberOfLines={8}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <View style={styles.radioGroup}>
          {['כללי', 'שיעור', 'אירוע', 'לימוד', 'הודעות'].map(cat => (
            <Pressable
              key={cat}
              style={[styles.radioButton, form.category === cat && styles.radioButtonActive]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Text style={[styles.radioText, form.category === cat && styles.radioTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונה (אופציונלי)</Text>
        {form.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {form.imageUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.imageUri ? 'בחר תמונה אחרת' : 'בחר תמונה'}
            </Text>
          </Pressable>
          {form.imageUri && !form.imageUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, (saving || uploading) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving || uploading}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="business" size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? 'שומר...' : 'הוסף חדשה'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 החדשה תישמר ב-Firestore ב-collection 'news' ויופיע באפליקציה במסך "מהנעשה בבית המדרש".
      </Text>

    </View>
  )
}

// ========== TZADIKIM FORM ==========
function TzadikimForm() {
  const [form, setForm] = useState({
    name: '',
    title: '',
    biography: '',
    location: '',
    birthDate: '',
    deathDate: '',
    period: '',
    imageUri: null,
    imageUrl: '',
    books: '',
    sourceUrl: '',
    wikiUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    setCurrentUser(user);
  }, []);

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [3, 4] })
    if (image) {
      setForm({ ...form, imageUri: image.uri })
    }
  }

  const handleUploadImage = async () => {
    if (!form.imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const path = `tzadikim/${timestamp}/image.jpg`
      console.log('Starting image upload:', { uri: form.imageUri, path })
      
      const url = await uploadImageToStorage(form.imageUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      
      console.log('Upload successful! URL:', url)
      setForm({ ...form, imageUrl: url })
      Alert.alert('הצלחה!', `התמונה הועלתה בהצלחה\n${url.substring(0, 50)}...`)
    } catch (error) {
      console.error('Upload error:', error)
      Alert.alert('שגיאה', `לא ניתן להעלות את התמונה\n${error.message || error}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.name) {
      Alert.alert('שגיאה', 'אנא הזן שם של הצדיק')
      return
    }

    if (form.imageUri && !form.imageUrl) {
      Alert.alert('שים לב', 'אנא העלה את התמונה לפני השמירה')
      return
    }

    try {
      setSaving(true)
      
      const booksArray = form.books ? form.books.split(',').map(b => b.trim()).filter(b => b) : []
      
      const tzadikData = {
        name: form.name,
        title: form.title || '',
        biography: form.biography || '',
        location: form.location || '',
        birthDate: form.birthDate ? Timestamp.fromDate(new Date(form.birthDate)) : null,
        deathDate: form.deathDate ? Timestamp.fromDate(new Date(form.deathDate)) : null,
        period: form.period || '',
        imageUrl: form.imageUrl || '',
        books: booksArray,
        sourceUrl: form.sourceUrl || '',
        wikiUrl: form.wikiUrl || '',
        viewCount: 0,
        createdAt: serverTimestamp(),
      }
      
      console.log('Saving tzadik with data:', { ...tzadikData, imageUrl: form.imageUrl })
      
      const docRef = await addDoc(collection(db, 'tzadikim'), tzadikData)
      console.log('Tzadik saved with ID:', docRef.id, 'imageUrl:', form.imageUrl)

      Alert.alert(
        'הצלחה! 👥',
        'הצדיק נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({
                name: '',
                title: '',
                biography: '',
                location: '',
                birthDate: '',
                deathDate: '',
                period: '',
                imageUri: null,
                imageUrl: '',
                books: '',
                sourceUrl: '',
                wikiUrl: '',
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving tzadik:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הצדיק. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <View style={{ padding: 10, backgroundColor: '#f0f9ff', marginBottom: 15, borderRadius: 8, borderWidth: 1, borderColor: '#dbeafe' }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 16, color: '#1e3a8a', textAlign: 'right' }}>ℹ️ מידע משתמש</Text>
        <Text style={{textAlign: 'right'}}>
          <Text style={{ fontWeight: 'bold' }}>אימייל מחובר:</Text> {currentUser ? currentUser.email : '⚠️ לא מחובר'}
        </Text>
        <Text style={{textAlign: 'right'}}>
          <Text style={{ fontWeight: 'bold' }}>UID:</Text> {currentUser ? currentUser.uid : 'N/A'}
        </Text>
      </View>
      <Text style={styles.formTitle}>👥 הוספת צדיק</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>שם הצדיק *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={text => setForm({ ...form, name: text })}
          placeholder="לדוגמה: רבי נחמן מברסלב"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תואר (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: האדמו״ר, הרב, הגאון"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תולדות חיים</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.biography}
          onChangeText={text => setForm({ ...form, biography: text })}
          placeholder="כתוב את תולדות חייו של הצדיק..."
          multiline
          numberOfLines={8}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>מיקום</Text>
        <TextInput
          style={styles.input}
          value={form.location}
          onChangeText={text => setForm({ ...form, location: text })}
          placeholder="לדוגמה: ברסלב, אוקראינה"
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>תאריך לידה (אופציונלי)</Text>
          <TextInput
            style={styles.input}
            value={form.birthDate}
            onChangeText={text => setForm({ ...form, birthDate: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>תאריך פטירה (אופציונלי)</Text>
          <TextInput
            style={styles.input}
            value={form.deathDate}
            onChangeText={text => setForm({ ...form, deathDate: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תקופה (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.period}
          onChangeText={text => setForm({ ...form, period: text })}
          placeholder="לדוגמה: המאה ה-18"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>ספרים (מופרדים בפסיק)</Text>
        <TextInput
          style={styles.input}
          value={form.books}
          onChangeText={text => setForm({ ...form, books: text })}
          placeholder="לדוגמה: ליקוטי מוהר״ן, סיפורי מעשיות"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור למקור (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.sourceUrl}
          onChangeText={text => setForm({ ...form, sourceUrl: text })}
          placeholder="https://..."
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור לויקיפדיה (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.wikiUrl}
          onChangeText={text => setForm({ ...form, wikiUrl: text })}
          placeholder="https://he.wikipedia.org/..."
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונה של הצדיק *</Text>
        {form.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {form.imageUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.imageUri ? 'בחר תמונה אחרת' : 'בחר תמונה'}
            </Text>
          </Pressable>
          {form.imageUri && !form.imageUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, (saving || uploading) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving || uploading}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="people" size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? 'שומר...' : 'הוסף צדיק'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 הצדיק יישמר ב-Firestore ויופיע באפליקציה במסך "ספר תולדות אדם". התמונה היא חובה.
      </Text>
    </View>
  )
}

// ========== NOTIFICATIONS FORM ==========
function NotificationsForm() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    icon: 'notifications',
    priority: 'medium',
    link: '',
  })
  const [saving, setSaving] = useState(false)

  const iconOptions = [
    { value: 'notifications', label: 'התראה כללית', icon: 'notifications' },
    { value: 'information-circle', label: 'מידע', icon: 'information-circle' },
    { value: 'warning', label: 'אזהרה', icon: 'warning' },
    { value: 'checkmark-circle', label: 'הצלחה', icon: 'checkmark-circle' },
    { value: 'calendar', label: 'אירוע', icon: 'calendar' },
    { value: 'musical-notes', label: 'ניגון', icon: 'musical-notes' },
    { value: 'book', label: 'תורה', icon: 'book' },
    { value: 'heart', label: 'תפילה', icon: 'heart' },
  ]

  const priorityOptions = [
    { value: 'low', label: 'נמוכה' },
    { value: 'medium', label: 'בינונית' },
    { value: 'high', label: 'גבוהה' },
  ]

  const handleSubmit = async () => {
    if (!form.title || !form.message) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות הנדרשים')
      return
    }

    if (form.message.length > 500) {
      Alert.alert('שגיאה', 'ההודעה ארוכה מדי (מקסימום 500 תווים)')
      return
    }

    try {
      setSaving(true)

      await addDoc(collection(db, 'notifications'), {
        title: form.title,
        message: form.message,
        icon: form.icon,
        priority: form.priority,
        link: form.link || null,
        isActive: true,
        readBy: [],
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'admin',
      })

      Alert.alert(
        'הצלחה! 🔔',
        'ההתראה נשלחה בהצלחה ותופיע לכל המשתמשים',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({
                title: '',
                message: '',
                icon: 'notifications',
                priority: 'medium',
                link: '',
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving notification:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את ההתראה. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>🔔 שליחת התראה חדשה</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת ההתראה *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder='לדוגמה: "עדכון חשוב"'
          maxLength={100}
        />
        <Text style={styles.charCount}>{form.title.length}/100</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>הודעה *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.message}
          onChangeText={text => setForm({ ...form, message: text })}
          placeholder="כתוב את תוכן ההתראה..."
          multiline
          numberOfLines={6}
          maxLength={500}
        />
        <Text style={styles.charCount}>{form.message.length}/500</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>אייקון</Text>
        <View style={styles.radioGroup}>
          {iconOptions.map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.radioButton,
                form.icon === option.value && styles.radioButtonActive
              ]}
              onPress={() => setForm({ ...form, icon: option.value })}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={form.icon === option.value ? PRIMARY_BLUE : '#6b7280'}
              />
              <Text
                style={[
                  styles.radioText,
                  form.icon === option.value && styles.radioTextActive
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>עדיפות</Text>
        <View style={styles.radioGroup}>
          {priorityOptions.map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.radioButton,
                form.priority === option.value && styles.radioButtonActive
              ]}
              onPress={() => setForm({ ...form, priority: option.value })}
            >
              <Text
                style={[
                  styles.radioText,
                  form.priority === option.value && styles.radioTextActive
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.link}
          onChangeText={text => setForm({ ...form, link: text })}
          placeholder="https://..."
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.note}>
          💡 אם תרצה שההתראה תפתח מסך מסוים, תוכל להוסיף קישור כאן (אופציונלי)
        </Text>
      </View>

      <Pressable
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="send" size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? 'שולח...' : 'שלח התראה'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 ההתראה תישלח לכל המשתמשים ותופיע במסך ההתראות. משתמשים יוכלו לראות אותה כשלוחצים על אייקון הפעמון.
      </Text>
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
    color: PRIMARY_BLUE,
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
    borderColor: PRIMARY_BLUE,
  },
  radioText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  radioTextActive: {
    color: PRIMARY_BLUE,
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
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
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
    borderColor: PRIMARY_BLUE,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  uploadButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(11,27,58,0.12)',
    marginVertical: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 4,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.2)',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  uploadedText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#16a34a',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  audioPreview: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  audioPreviewText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
  },
  pdfPreview: {
    width: '100%',
    minHeight: 100,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  pdfName: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
    textAlign: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  addShortLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
    minHeight: 56,
    position: 'relative',
  },
  addShortLessonButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,27,58,0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(11,27,58,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
    paddingVertical: 14,
    textAlign: 'center',
  },
})
