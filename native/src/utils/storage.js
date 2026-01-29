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
    // Wait for auth to be ready
    const { onAuthStateChanged } = await import('firebase/auth');
    let currentUser = auth.currentUser;
    
    // If no current user, wait a bit for auth to initialize
    if (!currentUser) {
      console.log('No current user, waiting for auth state...');
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          currentUser = user;
          unsubscribe();
          resolve();
        });
        // Timeout after 2 seconds
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 2000);
      });
    }
    
    console.log('=== UPLOAD DEBUG ===');
    console.log('Starting upload:', { uri, path });
    console.log('Current user:', currentUser ? { uid: currentUser.uid, email: currentUser.email } : 'NOT LOGGED IN');
    
    if (!currentUser) {
      throw new Error('User not authenticated. Please log in again.');
    }
    
    // Get fresh auth token - this is important for Storage rules
    try {
      const token = await currentUser.getIdToken(true); // Force refresh
      console.log('Auth token obtained, length:', token.length);
    } catch (tokenError) {
      console.error('Error getting auth token:', tokenError);
      // Don't throw here, but log it
    }
    
    // Verify user role in Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User document found:', { uid: currentUser.uid, role: userData.role, email: userData.email });
        if (userData.role !== 'admin') {
          console.warn('WARNING: User is not admin! Role:', userData.role);
          throw new Error('User is not an admin. Only admins can upload images.');
        }
      } else {
        console.error('ERROR: User document NOT found in Firestore for UID:', currentUser.uid);
        throw new Error('User document not found in Firestore. Please contact support.');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      throw error;
    }
    
    // Read the file as base64 using legacy API
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    
    console.log('File read, base64 length:', base64.length);
    
    // Convert base64 to Blob for React Native compatibility
    // Create a data URI and fetch it to get a blob
    const dataUri = `data:image/jpeg;base64,${base64}`;
    const response = await fetch(dataUri);
    const blob = await response.blob();
    
    console.log('Converted to Blob, size:', blob.size);
    
    // Create a reference to the file location in Storage
    const storageRef = ref(storage, path)
    
    // Upload using uploadBytesResumable for better React Native support
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    // Return a promise that resolves when upload completes
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress.toFixed(0) + '%');
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            console.log('Upload completed, getting download URL...');
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Upload complete. Download URL:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
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
    // Wait for auth to be ready
    const { onAuthStateChanged } = await import('firebase/auth');
    let currentUser = auth.currentUser;
    
    // If no current user, wait a bit for auth to initialize
    if (!currentUser) {
      console.log('No current user, waiting for auth state...');
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          currentUser = user;
          unsubscribe();
          resolve();
        });
        // Timeout after 2 seconds
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 2000);
      });
    }
    
    console.log('=== PDF UPLOAD DEBUG ===');
    console.log('Starting PDF upload:', { uri, path });
    console.log('Current user:', currentUser ? { uid: currentUser.uid, email: currentUser.email } : 'NOT LOGGED IN');
    
    if (!currentUser) {
      throw new Error('User not authenticated. Please log in again.');
    }
    
    // Verify user role in Firestore FIRST (before getting token)
    let userRole = null
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userRole = userData.role
        console.log('User document found:', { uid: currentUser.uid, role: userData.role, email: userData.email });
        if (userData.role !== 'admin') {
          console.warn('WARNING: User is not admin! Role:', userData.role);
          throw new Error('User is not an admin. Only admins can upload PDFs.');
        }
      } else {
        console.error('ERROR: User document NOT found in Firestore for UID:', currentUser.uid);
        throw new Error('User document not found in Firestore. Please contact support.');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      throw error;
    }
    
    // Get fresh auth token AFTER verifying role - this is important for Storage rules
    // The token needs to be fresh so Storage rules can verify the user is admin
    let authToken = null
    try {
      authToken = await currentUser.getIdToken(true); // Force refresh
      console.log('Auth token obtained, length:', authToken.length);
      console.log('Token will be used for Storage upload with admin role:', userRole);
    } catch (tokenError) {
      console.error('Error getting auth token:', tokenError);
      throw new Error('Failed to get authentication token. Please try again.');
    }
    
    // Read the file as base64 using legacy API
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    
    console.log('PDF file read, base64 length:', base64.length);
    
    // Convert base64 to Blob for React Native compatibility
    const dataUri = `data:application/pdf;base64,${base64}`;
    const response = await fetch(dataUri);
    const blob = await response.blob();
    
    console.log('Converted to Blob, size:', blob.size);
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
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('PDF upload progress:', progress.toFixed(0) + '%');
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('PDF upload error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Storage path:', path);
          console.error('User UID:', currentUser?.uid);
          console.error('User email:', currentUser?.email);
          reject(error);
        },
        async () => {
          try {
            console.log('PDF upload completed, getting download URL...');
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('PDF upload complete. Download URL:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
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
        return 'daily-videos/' // Use daily-videos folder inside newsletters bucket
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