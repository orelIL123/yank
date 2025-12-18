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
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64) {
  // Simple base64 decoder for React Native
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let output = ''
  
  base64 = base64.replace(/[^A-Za-z0-9\+\/\=]/g, '')
  
  for (let i = 0; i < base64.length; i += 4) {
    const enc1 = chars.indexOf(base64.charAt(i))
    const enc2 = chars.indexOf(base64.charAt(i + 1))
    const enc3 = chars.indexOf(base64.charAt(i + 2))
    const enc4 = chars.indexOf(base64.charAt(i + 3))
    
    const chr1 = (enc1 << 2) | (enc2 >> 4)
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
    const chr3 = ((enc3 & 3) << 6) | enc4
    
    output += String.fromCharCode(chr1)
    
    if (enc3 !== 64) {
      output += String.fromCharCode(chr2)
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3)
    }
  }
  
  const bytes = new Uint8Array(output.length)
  for (let i = 0; i < output.length; i++) {
    bytes[i] = output.charCodeAt(i)
  }
  
  return bytes
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

