import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage, auth, db } from '../config/firebase'
import { doc, getDoc } from 'firebase/firestore'

/**
 * Request permissions for image picker
 */
export async function requestImagePermissions() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') {
    Alert.alert('הרשאה נדרשת', 'אנחנו צריכים גישה לגלריית התמונות כדי להעלות תמונות')
    return false
  }
  return true
}

/**
 * Pick an image from the library
 */
export async function pickImage(options = {}) {
  const hasPermission = await requestImagePermissions()
  if (!hasPermission) return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: options.aspect || [16, 9],
    quality: options.quality || 0.8,
    ...options,
  })

  if (result.canceled) return null

  return {
    uri: result.assets[0].uri,
    width: result.assets[0].width,
    height: result.assets[0].height,
    type: result.assets[0].type,
  }
}

/**
 * Convert base64 string to Uint8Array using atob
 * More efficient for React Native
 */
function base64ToUint8Array(base64) {
  try {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  } catch (error) {
    console.error('Error converting base64:', error)
    throw new Error('שגיאה בהמרת הקובץ')
  }
}

/**
 * Upload image to Firebase Storage
 * Converts base64 to Uint8Array for React Native compatibility
 */
export async function uploadImageToStorage(uri, path, onProgress) {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('יש להתחבר כדי להעלות קבצים');
    }

    console.log('Starting upload:', path);

    // Report 5% progress - starting
    if (onProgress) onProgress(5);

    // Read the file as base64 using legacy API
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Report 15% progress - file read
    if (onProgress) onProgress(15);

    // Convert base64 to Blob for React Native compatibility
    const dataUri = `data:image/jpeg;base64,${base64}`;
    const response = await fetch(dataUri);
    const blob = await response.blob();

    // Report 25% progress - blob created
    if (onProgress) onProgress(25);
    
    // Create a reference to the file location in Storage
    const storageRef = ref(storage, path)

    // Upload using uploadBytesResumable for better React Native support
    const uploadTask = uploadBytesResumable(storageRef, blob);

    // Return a promise that resolves when upload completes
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress: 25% already reported, so map 0-100% upload to 25-100%
          const uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const totalProgress = 25 + (uploadProgress * 0.75);
          if (onProgress) {
            onProgress(Math.round(totalProgress));
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(new Error(`שגיאה בהעלאה: ${error.message}`));
        },
        async () => {
          try {
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(new Error('שגיאה בקבלת כתובת הקובץ'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(error.message || 'שגיאה בהעלאת תמונה');
  }
}

/**
 * Generate a unique file path for storage
 */
export function generateStoragePath(folder, filename) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const extension = filename.split('.').pop() || 'jpg'
  return `${folder}/${timestamp}_${random}.${extension}`
}

/**
 * Generate storage path for cards
 */
export function generateCardImagePath(cardKey, filename) {
  return generateStoragePath(`cards/${cardKey}`, filename)
}

/**
 * Generate storage path for news
 */
export function generateNewsImagePath(newsId, filename) {
  return generateStoragePath(`news/${newsId}`, filename)
}

/**
 * Pick a PDF file from the device
 */
export async function pickPDF() {
  try {
    // Dynamic import to avoid loading the module if not needed
    const DocumentPicker = await import('expo-document-picker')
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    })
    
    if (result.canceled) return null
    
    return {
      uri: result.assets[0].uri,
      name: result.assets[0].name,
      size: result.assets[0].size,
      mimeType: result.assets[0].mimeType,
    }
  } catch (error) {
    console.error('Error picking PDF:', error)
    Alert.alert('שגיאה', 'לא ניתן לבחור קובץ PDF')
    return null
  }
}

/**
 * Pick a video from the device
 */
export async function pickVideo() {
  try {
    const hasPermission = await requestImagePermissions()
    if (!hasPermission) return null

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    })

    if (result.canceled) return null

    return {
      uri: result.assets[0].uri,
      width: result.assets[0].width,
      height: result.assets[0].height,
      duration: result.assets[0].duration,
      type: result.assets[0].type,
      mimeType: result.assets[0].mimeType,
    }
  } catch (error) {
    console.error('Error picking video:', error)
    Alert.alert('שגיאה', 'לא ניתן לבחור סרטון')
    return null
  }
}

/**
 * Upload PDF to Firebase Storage
 * Similar to uploadImageToStorage but for PDFs
 */
export async function uploadPDFToStorage(uri, path, onProgress) {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('יש להתחבר כדי להעלות קבצים');
    }

    console.log('Starting PDF upload:', path);

    // Report 5% progress - starting
    if (onProgress) onProgress(5);

    // Read the file as base64 using legacy API
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Report 15% progress - file read
    if (onProgress) onProgress(15);

    // Convert base64 to Blob for React Native compatibility
    const dataUri = `data:application/pdf;base64,${base64}`;
    const response = await fetch(dataUri);
    const blob = await response.blob();

    // Report 25% progress - blob created
    if (onProgress) onProgress(25);
    console.log('About to upload to path:', path);
    console.log('Storage bucket:', storage.app.options.storageBucket);
    
    // Create a reference to the file location in Storage
    const storageRef = ref(storage, path)
    
    // Upload using uploadBytesResumable for better React Native support
    // Note: The auth token is automatically included in the request
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: 'application/pdf',
    });
    
    // Return a promise that resolves when upload completes
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress: 25% already reported, so map 0-100% upload to 25-100%
          const uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const totalProgress = 25 + (uploadProgress * 0.75);
          if (onProgress) {
            onProgress(Math.round(totalProgress));
          }
        },
        (error) => {
          console.error('PDF upload error:', error);
          reject(new Error(`שגיאה בהעלאת PDF: ${error.message}`));
        },
        async () => {
          try {
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(new Error('שגיאה בקבלת כתובת הקובץ'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw new Error(error.message || 'שגיאה בהעלאת PDF');
  }
}

/**
 * Generate storage path for prayers PDFs
 */
export function generatePrayerPDFPath(prayerId, filename) {
  return generateStoragePath(`prayers/${prayerId}`, filename || 'prayer.pdf')
}

/**
 * Upload file to Supabase Storage
 * Creates bucket if it doesn't exist
 */
export async function uploadFileToSupabaseStorage(uri, bucket, path, onProgress) {
  try {
    const { supabase } = await import('../config/supabase')
    const FileSystem = await import('expo-file-system/legacy')
    const preferredBucket = bucket
    let effectiveBucket = bucket
    let effectivePath = path
    
    // Check buckets list (used for fallback if the requested bucket doesn't exist)
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    const knownBuckets = !listError ? (buckets || []) : []
    const requestedBucketExists = knownBuckets.some(b => b.name === preferredBucket)
    const pickFallbackBucket = () => {
      if (!knownBuckets.length) return null
      // For videos, prefer 'videos' bucket, otherwise use common buckets
      const videoBuckets = ['videos', 'daily-videos', 'video-uploads']
      const videoBucket = videoBuckets.map(n => knownBuckets.find(b => b.name === n)).find(Boolean)
      if (videoBucket) return videoBucket.name
      
      // For videos, prefer 'newsletters' bucket as fallback (it exists)
      if (preferredBucket === 'daily-videos' || preferredBucket === 'videos') {
        const newslettersBucket = knownBuckets.find(b => b.name === 'newsletters')
        if (newslettersBucket) return 'newsletters'
      }
      
      const preferredNames = ['public', 'uploads', 'files', 'assets']
      const byName = preferredNames.map(n => knownBuckets.find(b => b.name === n)).find(Boolean)
      return (byName || knownBuckets[0])?.name || null
    }
    
      // Determine folder prefix based on bucket type
    const getFolderPrefix = (bucketName) => {
      if (bucketName === 'daily-videos' || bucketName === 'videos') {
        return 'daily-videos/'
      }
      if (bucketName.includes('newsletter')) {
        return '' // Don't add prefix for newsletters bucket
      }
      return ''
    }
    
    // Read file as base64
    let bytes
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Convert base64 to Uint8Array
      bytes = base64ToUint8Array(base64)
    } catch (error) {
      console.error('Error reading file:', error)
      throw new Error('לא ניתן לקרוא את הקובץ. ודא שהקובץ קיים ושיש לך הרשאות לקרוא אותו.')
    }

    // Determine content type from file extension
    const extension = path.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    if (extension === 'pdf') {
      contentType = 'application/pdf'
    } else if (['jpg', 'jpeg'].includes(extension)) {
      contentType = 'image/jpeg'
    } else if (extension === 'png') {
      contentType = 'image/png'
    } else if (extension === 'gif') {
      contentType = 'image/gif'
    } else if (extension === 'mp4') {
      contentType = 'video/mp4'
    } else if (extension === 'mov') {
      contentType = 'video/quicktime'
    } else if (extension === 'avi') {
      contentType = 'video/x-msvideo'
    } else if (extension === 'webm') {
      contentType = 'video/webm'
    }

    // Upload to Supabase Storage
    // Note: Supabase doesn't support progress callbacks in the JS client
    // We'll simulate progress for better UX
    let uploadStartTime = Date.now()
    const simulateProgress = () => {
      if (onProgress) {
        // Simulate progress: 0-90% during upload, 100% when done
        const elapsed = Date.now() - uploadStartTime
        const estimatedTotal = 5000 // 5 seconds estimate
        const simulatedProgress = Math.min(90, (elapsed / estimatedTotal) * 90)
        onProgress(simulatedProgress)
      }
    }
    
    // Start progress simulation
    const progressInterval = setInterval(simulateProgress, 100)
    
    let uploadResult = await supabase.storage
      .from(effectiveBucket)
      .upload(effectivePath, bytes, {
        contentType,
        upsert: false,
        cacheControl: '3600', // Cache for 1 hour
      })
    
    // Clear progress interval
    clearInterval(progressInterval)
    
    // Set to 100% when done
    if (onProgress) {
      onProgress(100)
    }

    // If bucket doesn't exist, try to create it first
    if (uploadResult.error && (uploadResult.error.message?.includes('Bucket not found') || uploadResult.error.message?.includes('not found'))) {
      // If the bucket doesn't exist but we have other buckets, fallback to one of them
      if (!requestedBucketExists) {
        const fallback = pickFallbackBucket()
        if (fallback) {
          const folderPrefix = getFolderPrefix(preferredBucket)
          console.warn(`Bucket '${preferredBucket}' not found. Falling back to bucket '${fallback}' with folder prefix '${folderPrefix}'.`)
          effectiveBucket = fallback
          effectivePath = folderPrefix ? `${folderPrefix}${path}` : path
          
          // Restart progress simulation for retry
          uploadStartTime = Date.now()
          const retryProgressInterval = setInterval(() => {
            if (onProgress) {
              const elapsed = Date.now() - uploadStartTime
              const estimatedTotal = 5000
              const simulatedProgress = Math.min(90, (elapsed / estimatedTotal) * 90)
              onProgress(simulatedProgress)
            }
          }, 100)
          
          uploadResult = await supabase.storage
            .from(effectiveBucket)
            .upload(effectivePath, bytes, {
              contentType,
              upsert: false,
              cacheControl: '3600',
            })
          
          clearInterval(retryProgressInterval)
          if (onProgress) {
            onProgress(100)
          }
        }
      }

      // If still failing and we can’t fallback, try to create bucket (will usually fail with anon key)
      if (uploadResult.error && (uploadResult.error.message?.includes('Bucket not found') || uploadResult.error.message?.includes('not found'))) {
        console.log(`Bucket '${preferredBucket}' not found, attempting to create...`)
      
        // Try to create bucket (this requires admin/service role permissions)
        const { error: createError } = await supabase.storage.createBucket(preferredBucket, {
          public: true,
          allowedMimeTypes: null, // Allow all types
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
        })
      
        if (createError) {
          // If we can't create it, provide helpful error
          console.error('Could not create bucket:', createError)
          throw new Error(`Bucket '${preferredBucket}' לא קיים ב-Supabase Storage. אנא צור אותו ב-Supabase Dashboard תחת Storage > Buckets.`)
        } else {
          console.log(`Bucket '${preferredBucket}' created successfully, retrying upload...`)
          effectiveBucket = preferredBucket
          effectivePath = path
          
          // Restart progress simulation for retry after bucket creation
          uploadStartTime = Date.now()
          const bucketCreateProgressInterval = setInterval(() => {
            if (onProgress) {
              const elapsed = Date.now() - uploadStartTime
              const estimatedTotal = 5000
              const simulatedProgress = Math.min(90, (elapsed / estimatedTotal) * 90)
              onProgress(simulatedProgress)
            }
          }, 100)
          
          uploadResult = await supabase.storage
            .from(effectiveBucket)
            .upload(effectivePath, bytes, {
              contentType,
              upsert: false,
              cacheControl: '3600',
            })
          
          clearInterval(bucketCreateProgressInterval)
          if (onProgress) {
            onProgress(100)
          }
        }
      }
    }

    if (uploadResult.error) {
      console.error('Supabase Storage upload error:', uploadResult.error)
      // Provide helpful error message for bucket not found
      if (uploadResult.error.message?.includes('Bucket not found') || uploadResult.error.message?.includes('not found')) {
        throw new Error(`Bucket '${preferredBucket}' לא קיים ב-Supabase Storage. אנא צור אותו ב-Supabase Dashboard תחת Storage > Buckets.`)
      }
      // RLS policy missing (common when using anon key without storage policies)
      if (
        uploadResult.error.message?.includes('row-level security') ||
        uploadResult.error.message?.includes('violates row-level security') ||
        uploadResult.error.message?.includes('RLS')
      ) {
        throw new Error(
          `חסרה הרשאת העלאה ב-Supabase Storage (RLS).\n` +
          `צריך להוסיף Policy ל-storage.objects עבור bucket '${preferredBucket}'.`
        )
      }
      throw uploadResult.error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(effectiveBucket)
      .getPublicUrl(effectivePath)

    if (onProgress) {
      onProgress(100)
    }

    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading file to Supabase Storage:', error)
    throw error
  }
}