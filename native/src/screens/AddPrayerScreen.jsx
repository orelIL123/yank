import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Image, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import db from '../services/database'
import { pickImage, uploadImageToStorage, pickPDF, uploadPDFToStorage, generatePrayerPDFPath, uploadFileToSupabaseStorage } from '../utils/storage'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function AddPrayerScreen({ navigation, route }) {
  const { prayer } = route.params || {}
  const isEditing = !!prayer

  const [form, setForm] = useState({
    title: prayer?.title || '',
    content: prayer?.content || '',
    description: prayer?.description || '',
    category: prayer?.category || 'תפילה',
  })
  const [images, setImages] = useState(() => {
    // Initialize with existing images if editing
    if (prayer?.imageUrls && Array.isArray(prayer.imageUrls)) {
      return prayer.imageUrls.map(url => ({ uri: null, url, uploading: false }))
    } else if (prayer?.imageUrl) {
      return [{ uri: null, url: prayer.imageUrl, uploading: false }]
    }
    return []
  })
  const [pdf, setPdf] = useState(() => {
    // Initialize with existing PDF if editing
    if (prayer?.pdfUrl) {
      return { uri: null, url: prayer.pdfUrl, uploading: false, name: 'קובץ PDF קיים' }
    }
    return null
  })
  const [saving, setSaving] = useState(false)

  const handlePickImage = async () => {
    try {
      const image = await pickImage({ aspect: [16, 9] })
      if (image) {
        setImages([...images, { uri: image.uri, url: null, uploading: false, progress: 0 }])
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('שגיאה', `לא ניתן לבחור תמונה: ${error.message}`)
    }
  }

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
  }

  const handleUploadImage = async (index) => {
    const image = images[index]
    if (!image.uri) {
      Alert.alert('שגיאה', 'אין תמונה להעלאה')
      return
    }

    // Mark as uploading
    const newImages = [...images]
    newImages[index].uploading = true
    newImages[index].progress = 0
    setImages(newImages)

    try {
      const timestamp = Date.now()
      const imageIndex = index + 1
      const path = `prayers/${timestamp}/image_${imageIndex}.jpg`

      let url;
      try {
        url = await uploadImageToStorage(image.uri, path, (progress) => {
          console.log(`Upload progress for image ${imageIndex}: ${progress}%`)
          // Update progress in real-time
          const updatedImages = [...images]
          updatedImages[index].progress = Math.round(progress)
          setImages(updatedImages)
        })
      } catch (firebaseErr) {
        console.warn('Firebase upload failed, trying Supabase:', firebaseErr?.message)
        url = await uploadFileToSupabaseStorage(image.uri, 'newsletters', path, (progress) => {
          console.log(`Supabase upload progress for image ${imageIndex}: ${progress}%`)
          // Update progress in real-time
          const updatedImages = [...images]
          updatedImages[index].progress = Math.round(progress)
          setImages(updatedImages)
        })
      }

      newImages[index].url = url
      newImages[index].uploading = false
      newImages[index].progress = 100
      setImages(newImages)
    } catch (error) {
      console.error('Error uploading image:', error)
      newImages[index].uploading = false
      newImages[index].progress = 0
      setImages(newImages)
      Alert.alert('שגיאה', `לא ניתן להעלות תמונה ${index + 1}: ${error.message}`)
    }
  }

  const handleUploadAllImages = async () => {
    const imagesToUpload = images.filter(img => img.uri && !img.url)
    
    if (imagesToUpload.length === 0) {
      Alert.alert('שים לב', 'כל התמונות כבר הועלו')
      return
    }

    // Upload all images that haven't been uploaded yet
    for (let i = 0; i < images.length; i++) {
      if (images[i].uri && !images[i].url && !images[i].uploading) {
        await handleUploadImage(i)
      }
    }
  }

  const handlePickPDF = async () => {
    try {
      const pdfFile = await pickPDF()
      if (pdfFile) {
        setPdf({ uri: pdfFile.uri, url: null, uploading: false, name: pdfFile.name, progress: 0 })
      }
    } catch (error) {
      console.error('Error picking PDF:', error)
      Alert.alert('שגיאה', `לא ניתן לבחור PDF: ${error.message}`)
    }
  }

  const handleRemovePDF = () => {
    setPdf(null)
  }

  const handleUploadPDF = async () => {
    if (!pdf || !pdf.uri) {
      Alert.alert('שגיאה', 'אין קובץ PDF להעלאה')
      return
    }

    setPdf({ ...pdf, uploading: true, progress: 0 })

    try {
      const timestamp = Date.now()
      const filename = pdf.name || `prayer_${timestamp}.pdf`
      const path = generatePrayerPDFPath(timestamp.toString(), filename)

      let url;
      try {
        url = await uploadPDFToStorage(pdf.uri, path, (progress) => {
          console.log(`PDF upload progress: ${progress}%`)
          setPdf(prev => ({ ...prev, progress: Math.round(progress) }))
        })
      } catch (firebaseErr) {
        console.warn('Firebase PDF upload failed, trying Supabase:', firebaseErr?.message)
        url = await uploadFileToSupabaseStorage(pdf.uri, 'newsletters', path, (progress) => {
          console.log(`Supabase PDF upload progress: ${progress}%`)
          setPdf(prev => ({ ...prev, progress: Math.round(progress) }))
        })
      }

      setPdf({ ...pdf, url, uploading: false, progress: 100 })
    } catch (error) {
      console.error('Error uploading PDF:', error)
      setPdf({ ...pdf, uploading: false, progress: 0 })
      Alert.alert('שגיאה', `לא ניתן להעלות את קובץ ה-PDF: ${error.message}`)
    }
  }

  const handleSubmit = async () => {
    // Trim and check if title is not empty
    const trimmedTitle = form.title?.trim() || ''
    const trimmedContent = form.content?.trim() || ''

    if (!trimmedTitle) {
      Alert.alert('שגיאה', 'אנא מלא כותרת')
      return
    }

    // Check if at least one content type exists (PDF or images)
    const hasImages = images.some(img => img.url)
    const hasPDF = pdf && pdf.url

    if (!hasImages && !hasPDF) {
      Alert.alert('שגיאה', 'אנא העלה לפחות תמונה אחת או קובץ PDF')
      return
    }

    // Check if all new images are uploaded (existing images with url but no uri are OK)
    const unuploadedImages = images.filter(img => img.uri && !img.url)
    if (unuploadedImages.length > 0) {
      Alert.alert('שים לב', 'אנא העלה את כל התמונות החדשות לפני השמירה')
      return
    }

    // Check if new PDF is uploaded (existing PDF with url but no uri is OK)
    if (pdf && pdf.uri && !pdf.url) {
      Alert.alert('שים לב', 'אנא העלה את קובץ ה-PDF החדש לפני השמירה')
      return
    }

    try {
      setSaving(true)
      
      // Collect all image URLs
      const imageUrls = images
        .filter(img => img.url)
        .map(img => img.url)

      if (isEditing) {
        // Update existing prayer
        await db.updateDocument('prayers', prayer.id, {
          title: trimmedTitle,
          content: trimmedContent,
          description: form.description?.trim() || '',
          category: form.category,
          imageUrl: imageUrls.length > 0 ? imageUrls[0] : '', // First image as main
          imageUrls: imageUrls, // All images array
          pdfUrl: pdf?.url || '', // PDF URL if exists
          updatedAt: new Date().toISOString(),
        })

        Alert.alert(
          'הצלחה! 💜',
          'התפילה עודכנה בהצלחה',
          [
            {
              text: 'אישור',
              onPress: () => {
                navigation.goBack()
              }
            }
          ]
        )
      } else {
        // Create new prayer
        await db.addDocument('prayers', {
          title: trimmedTitle,
          content: trimmedContent,
          description: form.description?.trim() || '',
          category: form.category,
          imageUrl: imageUrls.length > 0 ? imageUrls[0] : '', // First image as main
          imageUrls: imageUrls, // All images array
          pdfUrl: pdf?.url || '', // PDF URL if exists
          createdAt: new Date().toISOString(),
        })

        Alert.alert(
          'הצלחה! 💜',
          'התפילה נוספה בהצלחה ויופיע באפליקציה',
          [
            {
              text: 'אישור',
              onPress: () => {
                navigation.goBack()
              }
            }
          ]
        )
      }
    } catch (error) {
      console.error('Error saving prayer:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את התפילה. אנא נסה שנית.')
    } finally {
      setSaving(false)
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
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEditing ? 'עריכת תפילה' : 'הוספת תפילה חדשה'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={PRIMARY_BLUE} />
          <Text style={styles.infoText}>
            יש להעלות לפחות תמונה אחת או קובץ PDF. התפילה תוצג למשתמשים כ-PDF/תמונות בלבד.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>כותרת התפילה *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={text => setForm({ ...form, title: text })}
            placeholder="לדוגמה: תפילה לשלום עם ישראל"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>תיאור קצר (אופציונלי)</Text>
          <TextInput
            style={styles.input}
            value={form.description}
            onChangeText={text => setForm({ ...form, description: text })}
            placeholder="תיאור קצר של התפילה..."
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>תוכן התפילה (אופציונלי)</Text>
            <Text style={styles.labelHint}>לצורך פנימי בלבד - לא יוצג למשתמשים</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.content}
            onChangeText={text => setForm({ ...form, content: text })}
            placeholder="תוכן התפילה (לא חובה - המשתמשים יראו רק PDF/תמונות)"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
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
          <View style={styles.labelRow}>
            <Text style={styles.label}>תמונות (אופציונלי)</Text>
            <Text style={styles.labelHint}>ניתן להוסיף כמה תמונות</Text>
          </View>
          
          {/* Image Grid */}
          {images.length > 0 && (
            <View style={styles.imagesGrid}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageItem}>
                  {(image.uri || image.url) ? (
                    <Image 
                      source={image.uri ? { uri: image.uri } : { uri: image.url }} 
                      style={styles.previewImage} 
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                    </View>
                  )}
                  {image.url ? (
                    <View style={styles.uploadedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                      <Text style={styles.uploadedText}>הועלה</Text>
                    </View>
                  ) : image.uploading ? (
                    <View style={styles.uploadingBadge}>
                      <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                      <Text style={styles.uploadingText}>
                        {image.progress ? `${image.progress}%` : 'מעלה...'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.notUploadedBadge}>
                      <Ionicons name="cloud-upload-outline" size={20} color="#f59e0b" />
                      <Text style={styles.notUploadedText}>לא הועלה</Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.uploadSection}>
            <Pressable
              style={styles.uploadButton}
              onPress={handlePickImage}
              disabled={saving}
            >
              <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
              <Text style={styles.uploadButtonText}>
                {images.length === 0 ? 'הוסף תמונה' : 'הוסף תמונה נוספת'}
              </Text>
            </Pressable>
            
            {images.length > 0 && (
              <Pressable
                style={[styles.uploadAllButton, saving && styles.uploadButtonDisabled]}
                onPress={handleUploadAllImages}
                disabled={saving}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
                <Text style={styles.uploadButtonText}>העלה את כל התמונות</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>קובץ PDF (אופציונלי)</Text>
          
          {pdf && (
            <View style={styles.pdfPreview}>
              <Ionicons name="document-text" size={48} color={PRIMARY_BLUE} />
              <Text style={styles.pdfName} numberOfLines={1}>
                {pdf.name || 'קובץ PDF'}
              </Text>
              {pdf.url ? (
                <View style={styles.uploadedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.uploadedText}>הועלה</Text>
                </View>
              ) : pdf.uploading ? (
                <View style={styles.uploadingBadge}>
                  <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                  <Text style={styles.uploadingText}>
                    {pdf.progress ? `${pdf.progress}%` : 'מעלה...'}
                  </Text>
                </View>
              ) : (
                <View style={styles.notUploadedBadge}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#f59e0b" />
                  <Text style={styles.notUploadedText}>לא הועלה</Text>
                </View>
              )}
              <Pressable
                style={styles.removePdfButton}
                onPress={handleRemovePDF}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </Pressable>
            </View>
          )}

          <View style={styles.uploadSection}>
            <Pressable
              style={styles.uploadButton}
              onPress={handlePickPDF}
              disabled={saving || pdf?.uploading}
            >
              <Ionicons name="document-text-outline" size={24} color={PRIMARY_BLUE} />
              <Text style={styles.uploadButtonText}>
                {pdf ? 'בחר PDF אחר' : 'בחר קובץ PDF מהקבצים'}
              </Text>
            </Pressable>
            
            {pdf && pdf.uri && !pdf.url && !pdf.uploading && (
              <Pressable
                style={[styles.uploadAllButton, saving && styles.uploadButtonDisabled]}
                onPress={handleUploadPDF}
                disabled={saving}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
                <Text style={styles.uploadButtonText}>העלה PDF</Text>
              </Pressable>
            )}
          </View>
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
            <Ionicons name="heart" size={20} color="#fff" />
          )}
          <Text style={styles.submitButtonText}>
            {saving ? 'שומר...' : (isEditing ? 'עדכן תפילה' : 'שמור תפילה')}
          </Text>
        </Pressable>

        <Text style={styles.note}>
          💡 התפילה תישמר ב-Firestore והתמונות יועלו ל-Firebase Storage בתיקיית prayers/.
        </Text>
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
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 20,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelHint: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(11,27,58,0.2)',
    backgroundColor: '#ffffff',
  },
  radioButtonActive: {
    borderColor: PRIMARY_BLUE,
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  radioText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  radioTextActive: {
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_600SemiBold',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  imageItem: {
    width: '47%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(30,58,138,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  uploadedText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#16a34a',
  },
  uploadingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  uploadingText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
  },
  notUploadedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notUploadedText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#f59e0b',
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
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
  removePdfButton: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  uploadSection: {
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY_BLUE,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(30,58,138,0.05)',
  },
  uploadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY_BLUE,
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
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
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  submitButtonDisabled: {
    opacity: 0.6,
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

