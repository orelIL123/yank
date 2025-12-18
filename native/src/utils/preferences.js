import AsyncStorage from '@react-native-async-storage/async-storage'

const REMEMBER_ME_KEY = '@yanuka:rememberMe'
const SAVED_EMAIL_KEY = '@yanuka:savedEmail'

/**
 * Save the "Remember Me" preference
 */
export async function setRememberMe(value) {
  try {
    await AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(value))
    console.log('Remember Me preference saved:', value)
  } catch (error) {
    console.error('Error saving Remember Me preference:', error)
  }
}

/**
 * Get the "Remember Me" preference
 */
export async function getRememberMe() {
  try {
    const value = await AsyncStorage.getItem(REMEMBER_ME_KEY)
    if (value !== null) {
      return JSON.parse(value)
    }
    return true // Default to true (remember by default)
  } catch (error) {
    console.error('Error getting Remember Me preference:', error)
    return true // Default to true on error
  }
}

/**
 * Clear the "Remember Me" preference
 */
export async function clearRememberMe() {
  try {
    await AsyncStorage.removeItem(REMEMBER_ME_KEY)
    console.log('Remember Me preference cleared')
  } catch (error) {
    console.error('Error clearing Remember Me preference:', error)
  }
}

/**
 * Save the email address (when Remember Me is enabled)
 */
export async function saveEmail(email) {
  try {
    if (email) {
      await AsyncStorage.setItem(SAVED_EMAIL_KEY, email)
      console.log('Email saved:', email)
    }
  } catch (error) {
    console.error('Error saving email:', error)
  }
}

/**
 * Get the saved email address
 */
export async function getSavedEmail() {
  try {
    const email = await AsyncStorage.getItem(SAVED_EMAIL_KEY)
    return email || ''
  } catch (error) {
    console.error('Error getting saved email:', error)
    return ''
  }
}

/**
 * Clear the saved email address
 */
export async function clearSavedEmail() {
  try {
    await AsyncStorage.removeItem(SAVED_EMAIL_KEY)
    console.log('Saved email cleared')
  } catch (error) {
    console.error('Error clearing saved email:', error)
  }
}

