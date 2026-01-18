/**
 * Database Service Layer - JSONB Version
 * Works with Supabase tables that store data as JSONB
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
  appConfig: 'app_config',
}

const toSnakeCase = (str) => str.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)

class DatabaseService {
  /**
   * Get all documents from a collection
   */
  async getCollection(collectionName, options = {}) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)

    let query = supabase.from(tableName).select('*')

    // Apply orderBy on created_at (default sort)
    if (options.orderBy) {
      const { field, direction = 'desc' } = options.orderBy
      const snakeField = toSnakeCase(field)

      // Order by JSONB field
      if (snakeField === 'created_at') {
        query = query.order('created_at', { ascending: direction === 'asc' })
      } else {
        // For JSONB fields, use the field name as-is (camelCase), not snake_case
        query = query.order(`data->>${field}`, { ascending: direction === 'asc' })
      }
    } else {
      // Default: order by created_at DESC
      query = query.order('created_at', { ascending: false })
    }

    // Apply where conditions on JSONB
    if (options.where) {
      options.where.forEach(([field, operator, value]) => {
        // For JSONB, use the field name as-is (camelCase), not snake_case
        // because the data is stored in camelCase in the JSONB column
        const jsonbField = field

        // Query JSONB field
        switch (operator) {
          case '==':
            // For boolean values in JSONB, -> returns text ("true"/"false")
            // So we need to compare as strings
            if (typeof value === 'boolean') {
              query = query.eq(`data->>${jsonbField}`, String(value))
            } else {
              query = query.eq(`data->>${jsonbField}`, value)
            }
            break
          case '!=':
            // For boolean values in JSONB, -> returns text ("true"/"false")
            // So we need to compare as strings
            if (typeof value === 'boolean') {
              query = query.neq(`data->>${jsonbField}`, String(value))
            } else {
              query = query.neq(`data->>${jsonbField}`, value)
            }
            break
          case '>':
            query = query.gt(`data->>${jsonbField}`, value)
            break
          case '>=':
            query = query.gte(`data->>${jsonbField}`, value)
            break
          case '<':
            query = query.lt(`data->>${jsonbField}`, value)
            break
          case '<=':
            query = query.lte(`data->>${jsonbField}`, value)
            break
          default:
            console.warn(`Unsupported operator: ${operator}`)
        }
      })
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

    // Extract data from JSONB and merge with id
    return data.map(row => ({
      id: row.id,
      ...row.data
    }))
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

    return {
      id: data.id,
      ...data.data
    }
  }

  /**
   * Add a new document
   */
  async addDocument(collectionName, docData) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)

    // Generate a simple ID (you can use uuid library if needed)
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await supabase
      .from(tableName)
      .insert([{ id, data: docData }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return {
      id: data.id,
      ...data.data
    }
  }

  /**
   * Update a document
   */
  async updateDocument(collectionName, docId, updates) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)

    // First get the current document
    const current = await this.getDocument(collectionName, docId)

    // Merge updates with current data
    const updatedData = { ...current, ...updates }
    delete updatedData.id // Remove id from data

    const { data, error } = await supabase
      .from(tableName)
      .update({ data: updatedData, updated_at: new Date().toISOString() })
      .eq('id', docId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return {
      id: data.id,
      ...data.data
    }
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
          const eventData = payload.new ? {
            id: payload.new.id,
            ...payload.new.data
          } : null

          callback({
            type: payload.eventType,
            data: eventData,
            old: payload.old ? { id: payload.old.id, ...payload.old.data } : null
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

      return data.map(row => ({
        id: row.id,
        categoryId: row.category_id,
        ...row.data
      }))
    }

    console.warn('Subcollection not mapped:', parentCollection, subcollection)
    return []
  }

  /**
   * Add to subcollection
   */
  async addToSubcollection(parentCollection, parentId, subcollection, docData) {
    if (parentCollection === 'rabbiStudents' && subcollection === 'videos') {
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const { data, error } = await supabase
        .from('rabbi_student_videos')
        .insert([{ id, category_id: parentId, data: docData }])
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        categoryId: data.category_id,
        ...data.data
      }
    }

    throw new Error(`Subcollection not supported: ${parentCollection}/${subcollection}`)
  }

  /**
   * Increment a numeric field
   */
  async incrementField(collectionName, docId, field, value = 1) {
    const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName)
    const snakeField = toSnakeCase(field)

    // Get current document
    const current = await this.getDocument(collectionName, docId)
    const currentValue = current[field] || 0
    const newValue = currentValue + value

    // Update with new value
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
        // For JSONB, use the field name as-is (camelCase), not snake_case
        const jsonbField = field
        switch (operator) {
          case '==':
            // For boolean values in JSONB, -> returns text ("true"/"false")
            // So we need to compare as strings
            if (typeof value === 'boolean') {
              query = query.eq(`data->>${jsonbField}`, String(value))
            } else {
              query = query.eq(`data->>${jsonbField}`, value)
            }
            break
          case '!=':
            if (typeof value === 'boolean') {
              query = query.neq(`data->>${jsonbField}`, String(value))
            } else {
              query = query.neq(`data->>${jsonbField}`, value)
            }
            break
          case '>':
            query = query.gt(`data->>${jsonbField}`, value)
            break
          case '>=':
            query = query.gte(`data->>${jsonbField}`, value)
            break
          case '<':
            query = query.lt(`data->>${jsonbField}`, value)
            break
          case '<=':
            query = query.lte(`data->>${jsonbField}`, value)
            break
        }
      })
    }

    // Apply orderBy
    if (options.orderBy) {
      const { field, direction = 'desc' } = options.orderBy
      const snakeField = toSnakeCase(field)
      // For JSONB fields, use the field name as-is (camelCase)
      query = query.order(snakeField === 'created_at' ? 'created_at' : `data->>${field}`, {
        ascending: direction === 'asc'
      })
    }

    // Apply pagination with offset
    if (options.startAfter) {
      // Use offset-based pagination (simple approach)
      query = query.range(options.startAfter, options.startAfter + (options.limit || 20) - 1)
    } else if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return data.map(row => ({
      id: row.id,
      ...row.data
    }))
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
        // For JSONB, use the field name as-is (camelCase), not snake_case
        const jsonbField = field
        switch (operator) {
          case '==':
            // For boolean values in JSONB, -> returns text ("true"/"false")
            // So we need to compare as strings
            if (typeof value === 'boolean') {
              query = query.eq(`data->>${jsonbField}`, String(value))
            } else {
              query = query.eq(`data->>${jsonbField}`, value)
            }
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

  /**
   * Get app config (singleton)
   */
  async getAppConfig() {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .eq('id', 'config')
      .single()

    if (error) {
      // If app_config table doesn't exist yet (common during migrations),
      // treat it as "no config" instead of spamming errors / failing the app.
      if (error.code === 'PGRST205') {
        return null
      }
      console.error('Database error:', error)
      throw error
    }

    return data
  }

  /**
   * Update app config
   */
  async updateAppConfig(updates) {
    const { data, error } = await supabase
      .from('app_config')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'config')
      .select()
      .single()

    if (error) {
      // Keep updates strict, but still don't spam a scary console error if table doesn't exist.
      if (error.code === 'PGRST205') {
        const e = new Error("app_config table is missing (PGRST205)")
        e.code = error.code
        throw e
      }
      console.error('Database error:', error)
      throw error
    }

    return data
  }
}

// Export singleton
export const db = new DatabaseService()
export default db
