/**
 * Permission management utilities
 * Handles role-based access control for the app
 */

// Define available permissions
export const PERMISSIONS = {
  // Admin has all permissions
  ADMIN: 'admin',
  
  // Content management permissions
  PRAYERS: 'prayers_manager',        // Can manage prayers
  VIDEOS: 'videos_manager',          // Can manage "מבית רבנו" videos
  MUSIC: 'music_manager',            // Can manage music/nigunimם
  BOOKS: 'books_manager',            // Can manage books (תולדות אדם)
  LEARNING: 'learning_manager',      // Can manage learning library (short & long videos)
  
  // Future permissions
  NEWSLETTERS: 'newsletters_manager',
  TZADIKIM: 'tzadikim_manager',
  NOTIFICATIONS: 'notifications_manager',
}

// Define permission labels in Hebrew
export const PERMISSION_LABELS = {
  [PERMISSIONS.ADMIN]: 'מנהל ראשי',
  [PERMISSIONS.PRAYERS]: 'אחראי תפילות',
  [PERMISSIONS.VIDEOS]: 'אחראי מבית רבנו',
  [PERMISSIONS.MUSIC]: 'אחראי ניגונים',
  [PERMISSIONS.BOOKS]: 'אחראי ספרים',
  [PERMISSIONS.LEARNING]: 'אחראי ספריית לימוד',
  [PERMISSIONS.NEWSLETTERS]: 'אחראי עלונים',
  [PERMISSIONS.TZADIKIM]: 'אחראי צדיקים',
  [PERMISSIONS.NOTIFICATIONS]: 'אחראי התראות',
}

/**
 * Check if user has a specific permission
 * @param {string|null} userRole - User's role (admin, user, etc.)
 * @param {string[]} userPermissions - Array of user's permissions
 * @param {string} requiredPermission - The permission to check
 * @returns {boolean}
 */
export function hasPermission(userRole, userPermissions = [], requiredPermission) {
  // Admin has all permissions
  if (userRole === 'admin') {
    return true
  }
  
  // Check if user has the specific permission
  return Array.isArray(userPermissions) && userPermissions.includes(requiredPermission)
}

/**
 * Check if user can manage prayers
 */
export function canManagePrayers(userRole, userPermissions) {
  return hasPermission(userRole, userPermissions, PERMISSIONS.PRAYERS)
}

/**
 * Check if user can manage videos (מבית רבנו)
 */
export function canManageVideos(userRole, userPermissions) {
  return hasPermission(userRole, userPermissions, PERMISSIONS.VIDEOS)
}

/**
 * Check if user can manage music
 */
export function canManageMusic(userRole, userPermissions) {
  return hasPermission(userRole, userPermissions, PERMISSIONS.MUSIC)
}

/**
 * Check if user can manage books
 */
export function canManageBooks(userRole, userPermissions) {
  return hasPermission(userRole, userPermissions, PERMISSIONS.BOOKS)
}

/**
 * Check if user can manage learning library
 */
export function canManageLearning(userRole, userPermissions) {
  return hasPermission(userRole, userPermissions, PERMISSIONS.LEARNING)
}

/**
 * Check if user can manage newsletters
 */
export function canManageNewsletters(userRole, userPermissions) {
  return hasPermission(userRole, userPermissions, PERMISSIONS.NEWSLETTERS)
}

/**
 * Check if user can manage tzadikim
 */
export function canManageTzadikim(userRole, userPermissions) {
  return hasPermission(userRole, userPermissions, PERMISSIONS.TZADIKIM)
}

/**
 * Check if user can manage notifications
 */
export function canManageNotifications(userRole, userPermissions) {
  return hasPermission(userRole, userPermissions, PERMISSIONS.NOTIFICATIONS)
}

/**
 * Check if user is admin (full access)
 */
export function isAdmin(userRole) {
  return userRole === 'admin'
}

/**
 * Get user's permission names in Hebrew
 */
export function getUserPermissionLabels(userRole, userPermissions = []) {
  if (userRole === 'admin') {
    return [PERMISSION_LABELS[PERMISSIONS.ADMIN]]
  }
  
  if (!Array.isArray(userPermissions)) {
    return []
  }
  
  return userPermissions
    .filter(perm => PERMISSION_LABELS[perm])
    .map(perm => PERMISSION_LABELS[perm])
}
