/**
 * Sefaria API Service
 * שירות לשליפת תוכן מ-Sefaria API
 * 
 * API Documentation: https://www.sefaria.org/api
 */

// Sefaria API base URL - supports both v3 and regular API
const SEFARIA_BASE_URL = 'https://www.sefaria.org/api/v3'
const SEFARIA_LEGACY_URL = 'https://www.sefaria.org/api'

/**
 * Base function to make API requests to Sefaria
 */
async function sefariaRequest(endpoint, options = {}) {
  try {
    const url = `${SEFARIA_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Sefaria API request failed:', error)
    throw error
  }
}

/**
 * Get text content by reference (tref)
 * @param {string} tref - Text reference (e.g., "Genesis.1.1", "Rashi on Genesis.1.1")
 * @param {object} options - Additional options
 * @param {string} options.lang - Language ('he' or 'en')
 * @param {string} options.version - Version title
 * @param {boolean} options.commentary - Include commentary
 */
export async function getText(tref, options = {}) {
  const params = new URLSearchParams()
  
  if (options.lang) params.append('lang', options.lang)
  if (options.version) params.append('version', options.version)
  if (options.commentary !== undefined) params.append('commentary', options.commentary)
  
  const queryString = params.toString()
  const endpoint = `/texts/${encodeURIComponent(tref)}${queryString ? `?${queryString}` : ''}`
  
  return sefariaRequest(endpoint)
}

/**
 * Get text content with multiple versions
 */
export async function getTextWithVersions(tref, versions = []) {
  const params = new URLSearchParams()
  versions.forEach(version => params.append('version', version))
  
  const queryString = params.toString()
  const endpoint = `/texts/${encodeURIComponent(tref)}${queryString ? `?${queryString}` : ''}`
  
  return sefariaRequest(endpoint)
}

/**
 * Search texts
 * @param {string} query - Search query
 * @param {object} options - Search options
 */
export async function searchTexts(query, options = {}) {
  const params = new URLSearchParams({ q: query })
  
  if (options.lang) params.append('lang', options.lang)
  if (options.category) params.append('category', options.category)
  
  const endpoint = `/texts/search?${params.toString()}`
  return sefariaRequest(endpoint)
}

/**
 * Get index information (metadata about a text)
 * @param {string} tref - Text reference
 */
export async function getIndex(tref) {
  const endpoint = `/index/${encodeURIComponent(tref)}`
  return sefariaRequest(endpoint)
}

/**
 * Get all available texts/categories
 */
export async function getTextsList() {
  const endpoint = '/texts'
  return sefariaRequest(endpoint)
}

/**
 * Get weekly Torah portion (פרשת השבוע)
 * @param {Date} date - Optional date, defaults to current week
 */
export async function getWeeklyTorahPortion(date = new Date()) {
  // Calculate the Hebrew date and get the parsha
  // This is a simplified version - you may need to adjust based on Sefaria's API
  const endpoint = '/calendars/weekly-torah-portion'
  return sefariaRequest(endpoint)
}

/**
 * Get specific parsha content
 * @param {string} parshaName - Name of the parsha (e.g., "Bereshit", "Noach")
 */
export async function getParsha(parshaName) {
  const tref = `Tanakh/Torah/${parshaName}`
  return getText(tref, { lang: 'he' })
}

/**
 * Get Rashi commentary on a text
 * @param {string} tref - Text reference
 */
export async function getRashi(tref) {
  const rashiTref = `Rashi on ${tref}`
  return getText(rashiTref, { lang: 'he' })
}

/**
 * Get multiple commentaries on a text
 * @param {string} tref - Text reference
 * @param {string[]} commentaries - Array of commentary names (e.g., ['Rashi', 'Ibn Ezra'])
 */
export async function getCommentaries(tref, commentaries = ['Rashi']) {
  const results = {}
  
  for (const commentary of commentaries) {
    try {
      const commentaryTref = `${commentary} on ${tref}`
      results[commentary] = await getText(commentaryTref, { lang: 'he' })
    } catch (error) {
      console.warn(`Failed to get ${commentary} commentary:`, error)
      results[commentary] = null
    }
  }
  
  return results
}

/**
 * Helper function to format text response for display
 * @param {object} textData - Response from getText
 */
export function formatTextForDisplay(textData) {
  if (!textData || !textData.text) {
    return { title: '', content: '', hebrew: '', english: '' }
  }

  const title = textData.title || textData.ref || ''
  const content = textData.text || ''
  
  // Handle different response structures
  let hebrew = ''
  let english = ''
  
  if (Array.isArray(content)) {
    // If content is an array, join it
    hebrew = content.join('\n')
  } else if (typeof content === 'string') {
    hebrew = content
  } else if (content.he) {
    hebrew = Array.isArray(content.he) ? content.he.join('\n') : content.he
    english = Array.isArray(content.en) ? content.en.join('\n') : content.en || ''
  }

  return {
    title,
    content: hebrew,
    hebrew,
    english,
    ref: textData.ref,
    version: textData.version,
  }
}

/**
 * Cache helper - you can implement caching using AsyncStorage if needed
 */
let textCache = {}

export function clearCache() {
  textCache = {}
}

export function getCachedText(tref) {
  return textCache[tref] || null
}

export function setCachedText(tref, data) {
  textCache[tref] = {
    data,
    timestamp: Date.now(),
  }
}

/**
 * Get text with caching (1 hour cache)
 */
export async function getTextCached(tref, options = {}) {
  const cacheKey = `${tref}_${JSON.stringify(options)}`
  const cached = getCachedText(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
    return cached.data
  }
  
  const data = await getText(tref, options)
  setCachedText(cacheKey, data)
  return data
}
