import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Image, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import db from '../services/database'
import { pickImage, uploadFileToSupabaseStorage } from '../utils/storage'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

function normalizeFilenameFromUri(uri) {
  const raw = (uri || '').split('/').pop() || 'image.jpg'
  if (raw.includes('.')) return raw
  return `${raw}.jpg`
}

export default function AddNewsScreen({ navigation, route, userRole }) {
  const article = route?.params?.article
  const isEditing = !!article?.id

  const canManage = userRole === 'admin'

  const [title, setTitle] = useState(article?.title || '')
  const [summary, setSummary] = useState(article?.summary || '')
  const [content, setContent] = useState(article?.content || '')
  const [selectedImage, setSelectedImage] = useState(null)
  const [saving, setSaving] = useState(false)

  const headerTitle = useMemo(() => (isEditing ? 'עריכת כתבה' : 'הוספת כתבה'), [isEditing])

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9], quality: 0.85 })
    if (!image?.uri) return
    setSelectedImage(image)
  }

  const handleSubmit = async () => {
    if (!canManage) {
      Alert.alert('אין הרשאה', 'רק אדמין יכול להוסיף/לערוך כתבות')
      return
    }

    if (!title.trim()) {
      Alert.alert('שגיאה', 'נא להזין כותרת')
      return
    }
    if (!summary.trim() && !content.trim()) {
      Alert.alert('שגיאה', 'נא להזין תקציר או תוכן')
      return
    }

    try {
      setSaving(true)

      const nowIso = new Date().toISOString()
      const baseData = {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        date: article?.date || nowIso,
        updatedAt: nowIso,
      }

      let saved = null
      if (isEditing) {
        await db.updateDocument('news', article.id, baseData)
        saved = { ...article, ...baseData }
      } else {
        saved = await db.addDocument('news', {
          ...baseData,
          createdAt: nowIso,
          imageUrl: '',
        })
      }

      // Upload image (optional)
      if (selectedImage?.uri) {
        const filename = normalizeFilenameFromUri(selectedImage.uri)
        const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
        const path = `${saved.id}/${Date.now()}_${safeName}`

        const imageUrl = await uploadFileToSupabaseStorage(selectedImage.uri, 'news', path, (p) => {
          console.log(`News image upload progress: ${p}%`)
        })

        await db.updateDocument('news', saved.id, { imageUrl, updatedAt: new Date().toISOString() })
      }

      Alert.alert('הצלחה', isEditing ? 'הכתבה עודכנה בהצלחה' : 'הכתבה נוספה בהצלחה', [
        { text: 'אישור', onPress: () => navigation.goBack() },
      ])
    } catch (e) {
      console.error('Error saving news:', e)
      const msg = e?.message?.includes('Bucket')
        ? 'Bucket לא קיים ב-Supabase Storage. אנא צור bucket בשם "news" ב-Supabase Dashboard.'
        : 'לא ניתן לשמור את הכתבה'
      Alert.alert('שגיאה', msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
        </Pressable>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.label}>כותרת *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="כותרת הכתבה"
            placeholderTextColor="#9ca3af"
            textAlign="right"
          />

          <Text style={styles.label}>תקציר</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={summary}
            onChangeText={setSummary}
            placeholder="תקציר קצר (אופציונלי)"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlign="right"
          />

          <Text style={styles.label}>תוכן</Text>
          <TextInput
            style={[styles.input, styles.textAreaLg]}
            value={content}
            onChangeText={setContent}
            placeholder="תוכן הכתבה"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={8}
            textAlign="right"
          />

          <Text style={styles.label}>תמונה (אופציונלי)</Text>
          <Pressable style={styles.imageBtn} onPress={handlePickImage} accessibilityRole="button">
            <Ionicons name="image-outline" size={22} color={PRIMARY_BLUE} />
            <Text style={styles.imageBtnText}>{selectedImage ? 'החלף תמונה' : 'בחר תמונה'}</Text>
          </Pressable>

          {(selectedImage?.uri || article?.imageUrl) && (
            <Image
              source={{ uri: selectedImage?.uri || article?.imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          )}
        </View>

        <Pressable
          style={[styles.submitButton, (saving || !canManage) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving || !canManage}
          accessibilityRole="button"
        >
          <LinearGradient colors={[PRIMARY_BLUE, '#2563eb']} style={styles.submitGradient}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>{isEditing ? 'שמור שינויים' : 'פרסם כתבה'}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {!canManage && (
          <Text style={styles.noPermText}>רק אדמין יכול להוסיף/לערוך כתבות.</Text>
        )}
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
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 16,
  },
  formCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 10,
  },
  label: {
    alignSelf: 'flex-end',
    color: DEEP_BLUE,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontFamily: 'Poppins_500Medium',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  textAreaLg: {
    minHeight: 180,
    textAlignVertical: 'top',
  },
  imageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(30,58,138,0.12)',
  },
  imageBtnText: {
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_600SemiBold',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    marginTop: 6,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  noPermText: {
    marginTop: 6,
    textAlign: 'center',
    color: '#6b7280',
    fontFamily: 'Poppins_500Medium',
  },
})



