/**
 * Sefaria API Service
 * שירות לשליפת תוכן מ-Sefaria API
 * 
 * API Documentation: https://www.sefaria.org/api
 */

// Sefaria API base URL - supports both v3 and regular API
const SEFARIA_BASE_URL = 'https://www.sefaria.org/api/v3'
const SEFARIA_LEGACY_URL = 'https://www.sefaria.org/api'
const SEFARIA_V2_URL = 'https://www.sefaria.org/api/v2'

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
 * @param {string} tref - Text reference (e.g., "Genesis.1.1", "Rashi on Genesis.1.1", "Sefer HaMiddot, Love, Part I")
 * @param {object} options - Additional options
 * @param {string} options.lang - Language ('he' or 'en')
 * @param {string} options.version - Version title
 * @param {boolean} options.commentary - Include commentary
 */
export async function getText(tref, options = {}) {
  try {
    // Use the legacy API endpoint which works better for complex texts
    const url = `${SEFARIA_LEGACY_URL}/texts/${encodeURIComponent(tref)}`
    const params = new URLSearchParams()

    if (options.lang) params.append('lang', options.lang)
    if (options.version) params.append('version', options.version)
    if (options.commentary !== undefined) params.append('commentary', options.commentary)

    const queryString = params.toString()
    const fullUrl = `${url}${queryString ? `?${queryString}` : ''}`

    console.log(`📖 Fetching: ${fullUrl}`)

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
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
 * Get Table of Contents - all books in Sefaria
 * According to Sefaria API docs
 */
export async function getTableOfContents() {
  try {
    const response = await fetch('https://www.sefaria.org/api/index')
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Sefaria API request failed:', error)
    throw error
  }
}

/**
 * Get Index (v2) - metadata about a specific book
 * According to Sefaria API docs
 */
export async function getIndexV2(tref) {
  try {
    const response = await fetch(`https://www.sefaria.org/api/v2/index/${encodeURIComponent(tref)}`)
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Sefaria API request failed:', error)
    throw error
  }
}

/**
 * Search for a book by name
 */
export async function searchBook(bookName) {
  try {
    const toc = await getTableOfContents()
    // Search in the TOC structure
    const searchRecursive = (node, name) => {
      if (node.title && (node.title.includes(name) || node.heTitle?.includes(name))) {
        return node
      }
      if (node.nodes) {
        for (const child of node.nodes) {
          const found = searchRecursive(child, name)
          if (found) return found
        }
      }
      return null
    }
    return searchRecursive(toc, bookName)
  } catch (error) {
    console.error('Error searching for book:', error)
    throw error
  }
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

/**
 * Recursively flatten nested arrays from Sefaria API responses
 * Handles deeply nested structures like [[["text", "text"], ["text"]], ["text"]]
 * @param {any} data - The data to flatten (could be string, array, or nested arrays)
 * @param {object} options - Formatting options
 * @returns {string[]} - Array of text strings
 */
export function flattenSefariaText(data, options = {}) {
  const { 
    preserveChapters = false,
    chapterSeparator = '\n\n═══════════════\n\n',
    verseSeparator = ' ',
    paragraphSeparator = '\n\n'
  } = options

  // Base case: if it's a string, return it
  if (typeof data === 'string') {
    return data.trim() ? [data.trim()] : []
  }

  // If it's not an array, try to convert it
  if (!Array.isArray(data)) {
    return []
  }

  // Recursive case: flatten arrays
  const result = []
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    
    if (typeof item === 'string') {
      if (item.trim()) {
        result.push(item.trim())
      }
    } else if (Array.isArray(item)) {
      // Recursively flatten nested arrays
      const flattened = flattenSefariaText(item, { ...options, preserveChapters: false })
      
      if (flattened.length > 0) {
        // If we're preserving chapter structure and this is a chapter-level array
        if (preserveChapters && data.length > 1) {
          result.push(...flattened)
          // Add chapter separator between chapters (but not after the last one)
          if (i < data.length - 1) {
            result.push(chapterSeparator)
          }
        } else {
          result.push(...flattened)
        }
      }
    }
  }

  return result
}

/**
 * Format Sefaria content for optimal display
 * @param {object} textData - Response from getText
 * @param {object} options - Formatting options
 * @returns {object} - Formatted content with title, content, and metadata
 */
export function formatSefariaContent(textData, options = {}) {
  const {
    addChapterNumbers = false,
    addVerseNumbers = false,
    preserveStructure = true,
    maxLength = null,
    language = 'he' // 'he' or 'en'
  } = options

  if (!textData) {
    return {
      title: '',
      content: '',
      hebrew: '',
      english: '',
      chapters: [],
      structure: null
    }
  }

  const title = textData.ref || textData.title || ''
  
  // Get the text data based on language preference
  let rawText = null
  if (language === 'he') {
    rawText = textData.he || textData.text
  } else {
    rawText = textData.en || textData.text
  }

  if (!rawText) {
    return {
      title,
      content: '',
      hebrew: '',
      english: '',
      chapters: [],
      structure: null
    }
  }

  // Flatten the text
  const flattened = flattenSefariaText(rawText, {
    preserveChapters: preserveStructure,
    chapterSeparator: '\n\n═══════════════\n\n',
    paragraphSeparator: '\n\n'
  })

  // Build the content string
  let content = ''
  let chapterCounter = 1
  let verseCounter = 1

  for (let i = 0; i < flattened.length; i++) {
    const text = flattened[i]
    
    // Check if this is a chapter separator
    if (text.includes('═══════════════')) {
      content += text
      chapterCounter++
      verseCounter = 1
      continue
    }

    // Add chapter/verse numbers if requested
    if (addChapterNumbers && verseCounter === 1) {
      content += `\n\n[פרק ${chapterCounter}]\n\n`
    }
    
    if (addVerseNumbers) {
      content += `${verseCounter}. `
      verseCounter++
    }

    content += text

    // Add paragraph separator between verses (but not after chapter separator)
    if (i < flattened.length - 1 && !flattened[i + 1].includes('═══════════════')) {
      content += '\n\n'
    }
  }

  // Truncate if maxLength is specified
  if (maxLength && content.length > maxLength) {
    content = content.substring(0, maxLength) + '...'
  }

  // Clean up extra whitespace
  content = content.replace(/\n{3,}/g, '\n\n').trim()

  return {
    title,
    content,
    hebrew: language === 'he' ? content : '',
    english: language === 'en' ? content : '',
    chapters: flattened.filter(t => !t.includes('═══════════════')),
    structure: {
      totalVerses: flattened.filter(t => !t.includes('═══════════════')).length,
      hasChapters: Array.isArray(rawText) && rawText.length > 1
    }
  }
}
