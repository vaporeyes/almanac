// ABOUTME: Date formatting helpers for almanac display values
// ABOUTME: Preserves date-only strings without applying timezone conversion

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)

    if (dateOnlyMatch) {
      const month = Number(dateOnlyMatch[2]) - 1
      const day = Number(dateOnlyMatch[3])
      return `${MONTHS[month]} ${day}`
    }
  }

  const parsedDate = date instanceof Date ? date : new Date(date)
  return `${MONTHS[parsedDate.getMonth()]} ${parsedDate.getDate()}`
}
