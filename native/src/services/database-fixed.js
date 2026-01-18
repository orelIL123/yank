/**
 * Database Service Layer - Fixed for Regular Columns (NOT JSONB)
 * Works with Supabase tables that have normal columns
 */

import { supabase } from '../config/supabase'

// Map collection names to table names
const COLLECTION_MAP = {
  books: 'books',
  music: 'music',
  newsletters: 'newsletters',
  news: 'news',
  prayers: 'prayers',
  prayerCommitments: 'prayer_commitments',
  dailyLearning: 'daily_learning',
  dailyVideos: 'daily_videos',
  dailyInsights: 'daily_insights',
  shortLessons: 'short_lessons',
  longLessons: 'long_lessons',
  tzadikim: 'tzadikim',
  notifications: 'notifications',
  pidyonNefesh: 'pidyon_nefesh',
  homeCards: 'home_cards',
  chidushim: 'chidushim',
  rabbiStudents: 'rabbi_students',
  rabbiStudentVideos: 'rabbi_student_videos',
  beitMidrashVideos: 'beit_midrash_videos',
}

// Map camelCase to snake_case field names
const FIELD_MAP = {
  // Common fields
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  imageUrl: 'image_url',
  youtubeUrl: 'youtube_url',
  pdfUrl: 'pdf_url',
  audioUrl: 'audio_url',
  videoUrl: 'video_url',
  hebrewTitle: 'hebrew_title',
  hebrewName: 'hebrew_name',
  hebrewDate: 'hebrew_date',
  isActive: 'active',
  orderIndex: 'order_index',

  // Specific fields
  userName: 'user_name',
  userEmail: 'user_email',
  userId: 'user_id',
  prayerId: 'prayer_id',
  categoryId: 'category_id',
  motherName: 'mother_name',
  requestText: 'request_text',
  prayerType: 'prayer_type',
  commitmentText: 'commitment_text',
  birthDate: 'birth_date',
  deathDate: 'death_date',
  burialPlace: 'burial_place',
  episodeNumber: 'episode_number',
  readBy: 'read_by',
}

const toSnakeCase = (str) => {
  // Check if we have a mapping first
  if (FIELD_MAP[str]) return FIELD_MAP[str]
  // Otherwise, convert camelCase to snake_case
  return str.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)
}

const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// Convert database row to app format (snake_case → camelCase)
const rowToDoc = (row) => {
  if (!row) return null

  const doc = {}
  for (const [key, value] of Object.entries(row)) {
    // Keep id as-is
    if (key === 'id') {
      doc.id = value
    } else {
      // Convert snake_case to camelCase
      const camelKey = toCamelCase(key)
      doc[camelKey] = value
    }
  }
  return doc
}

// Convert app data to database format (camelCase → snake_case)
const docToRow = (doc) => {
  const row = {}
  for (const [key, value] of Object.entries(doc)) {
    if (key === 'id') continue // Don't convert id
    const snakeKey = toSnakeCase(key)
    row[snakeKey] = value
  }
  return row
}

class DatabaseService {
  /**
   * Get all documents from a collection
   */
  async getCollection(collectionName, options = {}) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)

    let query = supabase.from(tableName).select('*')

    // Apply where conditions
    if (options.where) {
      options.where.forEach(([field, operator, value]) => {
        const snakeField = toSnakeCase(field)

        switch (operator) {
          case '==':
            query = query.eq(snakeField, value)
            break
          case '!=':
            query = query.neq(snakeField, value)
            break
          case '>':
            query = query.gt(snakeField, value)
            break
          case '>=':
            query = query.gte(snakeField, value)
            break
          case '<':
            query = query.lt(snakeField, value)
            break
          case '<=':
            query = query.lte(snakeField, value)
            break
          default:
            console.warn(`Unsupported operator: ${operator}`)
        }
      })
    }

    // Apply orderBy
    if (options.orderBy) {
      const { field, direction = 'desc' } = options.orderBy
      const snakeField = toSnakeCase(field)
      query = query.order(snakeField, { ascending: direction === 'asc' })
    } else {
      // Default: order by created_at DESC
      query = query.order('created_at', { ascending: false })
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Convert rows to documents
    return data.map(rowToDoc)
  }

  /**
   * Get a single document by ID
   */
  async getDocument(collectionName, docId) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', docId)
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return rowToDoc(data)
  }

  /**
   * Add a new document
   */
  async addDocument(collectionName, docData) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)
    const row = docToRow(docData)

    const { data, error } = await supabase
      .from(tableName)
      .insert([row])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return rowToDoc(data)
  }

  /**
   * Update a document
   */
  async updateDocument(collectionName, docId, updates) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)
    const row = docToRow(updates)
    row.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from(tableName)
      .update(row)
      .eq('id', docId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return rowToDoc(data)
  }

  /**
   * Delete a document
   */
  async deleteDocument(collectionName, docId) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', docId)

    if (error) {
      console.error('Database error:', error)
      throw error
    }
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToCollection(collectionName, callback) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)

    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          callback({
            type: payload.eventType,
            data: payload.new ? rowToDoc(payload.new) : null,
            old: payload.old ? rowToDoc(payload.old) : null
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  /**
   * Get subcollection (for rabbiStudents/videos)
   */
  async getSubcollection(parentCollection, parentId, subcollection, options = {}) {
    if (parentCollection === 'rabbiStudents' && subcollection === 'videos') {
      const tableName = 'rabbi_student_videos'

      let query = supabase.from(tableName).select('*').eq('category_id', parentId)

      if (options.orderBy) {
        query = query.order('created_at', { ascending: options.orderBy.direction === 'asc' })
      }

      const { data, error } = await query

      if (error) throw error

      return data.map(rowToDoc)
    }

    console.warn('Subcollection not mapped:', parentCollection, subcollection)
    return []
  }

  /**
   * Add to subcollection
   */
  async addToSubcollection(parentCollection, parentId, subcollection, docData) {
    if (parentCollection === 'rabbiStudents' && subcollection === 'videos') {
      const row = docToRow(docData)
      row.category_id = parentId

      const { data, error } = await supabase
        .from('rabbi_student_videos')
        .insert([row])
        .select()
        .single()

      if (error) throw error

      return rowToDoc(data)
    }

    throw new Error(`Subcollection not supported: ${parentCollection}/${subcollection}`)
  }

  /**
   * Increment a numeric field
   */
  async incrementField(collectionName, docId, field, value = 1) {
    const current = await this.getDocument(collectionName, docId)
    const currentValue = current[field] || 0
    const newValue = currentValue + value

    return await this.updateDocument(collectionName, docId, { [field]: newValue })
  }

  /**
   * Get collection with pagination support
   */
  async getCollectionPaginated(collectionName, options = {}) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)

    let query = supabase.from(tableName).select('*')

    // Apply where conditions
    if (options.where) {
      options.where.forEach(([field, operator, value]) => {
        const snakeField = toSnakeCase(field)
        switch (operator) {
          case '==':
            query = query.eq(snakeField, value)
            break
          case '!=':
            query = query.neq(snakeField, value)
            break
          case '>':
            query = query.gt(snakeField, value)
            break
          case '>=':
            query = query.gte(snakeField, value)
            break
          case '<':
            query = query.lt(snakeField, value)
            break
          case '<=':
            query = query.lte(snakeField, value)
            break
        }
      })
    }

    // Apply orderBy
    if (options.orderBy) {
      const { field, direction = 'desc' } = options.orderBy
      const snakeField = toSnakeCase(field)
      query = query.order(snakeField, { ascending: direction === 'asc' })
    }

    // Apply pagination with range
    if (options.startAfter !== undefined) {
      const limit = options.limit || 20
      query = query.range(options.startAfter, options.startAfter + limit - 1)
    } else if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return data.map(rowToDoc)
  }

  /**
   * Array union - add value to array field if not exists
   */
  async arrayAdd(collectionName, docId, field, value) {
    const current = await this.getDocument(collectionName, docId)
    const currentArray = current[field] || []

    if (!currentArray.includes(value)) {
      const newArray = [...currentArray, value]
      return await this.updateDocument(collectionName, docId, { [field]: newArray })
    }

    return current
  }

  /**
   * Array remove - remove value from array field
   */
  async arrayRemove(collectionName, docId, field, value) {
    const current = await this.getDocument(collectionName, docId)
    const currentArray = current[field] || []
    const newArray = currentArray.filter(v => v !== value)

    return await this.updateDocument(collectionName, docId, { [field]: newArray })
  }

  /**
   * Count documents matching criteria
   */
  async countDocuments(collectionName, options = {}) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)

    let query = supabase.from(tableName).select('*', { count: 'exact', head: true })

    // Apply where conditions
    if (options.where) {
      options.where.forEach(([field, operator, value]) => {
        const snakeField = toSnakeCase(field)
        switch (operator) {
          case '==':
            query = query.eq(snakeField, value)
            break
        }
      })
    }

    const { count, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return count
  }
}

// Export singleton
export const db = new DatabaseService()
export default db
