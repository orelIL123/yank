/**
 * דוגמת בדיקה (Test) – לא נוגע בקוד האפליקציה.
 * להרצה: npm test
 */

// פונקציה פשוטה לדוגמה – בודקים שהלוגיקה עובדת
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

describe('example tests', () => {
  it('toSnakeCase ממיר camelCase ל-snake_case', () => {
    expect(toSnakeCase('createdAt')).toBe('created_at')
    expect(toSnakeCase('dailyLearning')).toBe('daily_learning')
  })

  it('חישוב פשוט', () => {
    expect(1 + 1).toBe(2)
  })

  it('מערך ממויין', () => {
    const arr = ['books', 'news', 'prayers']
    expect(arr).toContain('prayers')
    expect(arr).toHaveLength(3)
  })
})
