import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import db from '../services/database'
import { uploadFileToSupabaseStorage } from '../utils/storage'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

const LANGUAGES = [
  { key: 'hebrew', label: 'עברית' },
  { key: 'french', label: 'Français' },
  { key: 'russian', label: 'Русский' },
  { key: 'english', label: 'English' },
]

export default function AddNewsletterScreen({ navigation, route }) {
  const newsletter = route?.params?.newsletter
  const isEditing = !!newsletter

  const [title, setTitle] = useState(newsletter?.title || '')
  const [description, setDescription] = useState(newsletter?.description || '')
  const [category, setCategory] = useState(newsletter?.category || '')
  const [parsha, setParsha] = useState(newsletter?.parsha || '')
  const [holiday, setHoliday] = useState(newsletter?.holiday || '')
  const [selectedLanguage, setSelectedLanguage] = useState(newsletter?.language || 'hebrew')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      })

      console.log('Document picker result:', result)

      if (result.canceled) {
        console.log('User canceled document picker')
        return
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0]
        console.log('Selected file:', { name: file.name, uri: file.uri, mimeType: file.mimeType })
        setSelectedFile(file)
        Alert.alert('הצלחה', `הקובץ ${file.name} נבחר בהצלחה`)
      } else if (result.type === 'success') {
        // Old API format (expo-document-picker < v11)
        console.log('Selected file (legacy):', { name: result.name, uri: result.uri })
        setSelectedFile(result)
        Alert.alert('הצלחה', `הקובץ ${result.name} נבחר בהצלחה`)
      }
    } catch (error) {
      console.error('Error picking file:', error)
      Alert.alert('שגיאה', 'לא ניתן לבחור קובץ: ' + error.message)
    }
  }

  const uploadFile = async (file) => {
    try {
      console.log('Starting file upload:', { name: file.name, uri: file.uri })

      // Verify file URI exists
      if (!file.uri) {
        throw new Error('URI של הקובץ לא נמצא')
      }

      // Generate file path (without bucket name in path)
      const fileExtension = file.name.split('.').pop() || 'pdf'
      const timestamp = Date.now()
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${timestamp}_${cleanName}`

      console.log('Uploading file:', fileName)

      // Prefer dedicated bucket; helper will fallback if missing
      const url = await uploadFileToSupabaseStorage(file.uri, 'newsletters', fileName, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })

      console.log('File uploaded successfully:', url)
      return url
    } catch (error) {
      console.error('Error uploading file:', error)

      // Provide helpful error messages
      if (error.message?.includes('Bucket') || error.message?.includes('bucket')) {
        throw new Error('שגיאה בהעלאת הקובץ: הבאקט לא קיים. אנא צור bucket בשם "newsletters" ב-Supabase Dashboard.')
      }

      if (error.message?.includes('קרוא')) {
        throw new Error('לא ניתן לקרוא את הקובץ. נסה לבחור קובץ אחר.')
      }

      throw new Error('שגיאה בהעלאת הקובץ: ' + (error.message || 'שגיאה לא ידועה'))
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('שגיאה', 'נא להזין כותרת')
      return
    }

    if (!isEditing && !selectedFile) {
      Alert.alert('שגיאה', 'נא לבחור קובץ')
      return
    }

    try {
      setUploading(true)

      let fileUrl = newsletter?.fileUrl || ''
      let fileType = newsletter?.fileType || 'pdf'

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile)
        fileType = selectedFile.mimeType?.includes('pdf') ? 'pdf' : 'image'
      }

      const newsletterData = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        parsha: parsha.trim() || null,
        holiday: holiday.trim() || null,
        language: selectedLanguage,
        fileUrl,
        fileType,
        publishDate: newsletter?.publishDate || new Date().toISOString(),
        createdAt: newsletter?.createdAt || new Date().toISOString(),
      }

      if (isEditing && newsletter?.id) {
        // Update existing newsletter
        await db.updateDocument('newsletters', newsletter.id, newsletterData)
        Alert.alert('הצלחה', 'העלון עודכן בהצלחה', [
          {
            text: 'אישור',
            onPress: () => navigation.goBack()
          }
        ])
      } else {
        // Create new newsletter
        await db.addDocument('newsletters', newsletterData)
        Alert.alert('הצלחה', 'העלון נוסף בהצלחה', [
          {
            text: 'אישור',
            onPress: () => navigation.goBack()
          }
        ])
      }

    } catch (error) {
      console.error('Error saving newsletter:', error)
      const errorMessage = error.message?.includes('Bucket') 
        ? 'Bucket לא קיים ב-Supabase Storage. אנא צור bucket בשם "newsletters" ב-Supabase Dashboard.'
        : 'לא ניתן לשמור את העלון'
      Alert.alert('שגיאה', errorMessage)
    } finally {
      setUploading(false)
    }
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
        <Text style={styles.headerTitle}>{isEditing ? 'ערוך עלון' : 'הוסף עלון'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View style={styles.formCard}>
          <Text style={styles.label}>כותרת *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="כותרת העלון"
            placeholderTextColor="#9ca3af"
            textAlign="right"
          />

          <Text style={styles.label}>תיאור</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="תיאור קצר"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlign="right"
          />

          <Text style={styles.label}>קטגוריה</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="כללי / פרשת השבוע / חגים"
            placeholderTextColor="#9ca3af"
            textAlign="right"
          />

          <Text style={styles.label}>פרשת השבוע (אופציונלי)</Text>
          <TextInput
            style={styles.input}
            value={parsha}
            onChangeText={setParsha}
            placeholder="שם הפרשה לסינון"
            placeholderTextColor="#9ca3af"
            textAlign="right"
          />

          <Text style={styles.label}>חג (אופציונלי)</Text>
          <TextInput
            style={styles.input}
            value={holiday}
            onChangeText={setHoliday}
            placeholder="שם החג לסינון"
            placeholderTextColor="#9ca3af"
            textAlign="right"
          />

          <Text style={styles.label}>שפה *</Text>
          <View style={styles.languageGrid}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.key}
                style={[
                  styles.languageOption,
                  selectedLanguage === lang.key && styles.languageOptionActive
                ]}
                onPress={() => setSelectedLanguage(lang.key)}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.languageOptionText,
                  selectedLanguage === lang.key && styles.languageOptionTextActive
                ]}>
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>קובץ *</Text>
          <Pressable
            style={styles.filePickerButton}
            onPress={handlePickFile}
            accessibilityRole="button"
          >
            <Ionicons name="document-attach-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.filePickerText}>
              {selectedFile ? selectedFile.name : 'בחר PDF או תמונה'}
            </Text>
          </Pressable>

          {selectedFile && (
            <View style={styles.selectedFileInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.selectedFileText}>{selectedFile.name}</Text>
            </View>
          )}
        </View>

        <Pressable
          style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={uploading}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={uploading ? ['#9ca3af', '#6b7280'] : [PRIMARY_BLUE, '#1e40af']}
            style={styles.submitGradient}
          >
            {uploading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitText}>מעלה...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
                <Text style={styles.submitText}>{isEditing ? 'עדכן עלון' : 'העלה עלון'}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
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
    paddingBottom: 120,
    gap: 18,
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
  label: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: -8,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderWidth: 1,
    borderColor: PRIMARY_BLUE,
  },
  languageOptionActive: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  languageOptionText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  languageOptionTextActive: {
    color: '#fff',
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY_BLUE,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(30,58,138,0.05)',
  },
  filePickerText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  selectedFileText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#059669',
    flex: 1,
    textAlign: 'right',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
  },
})
