/**
 * Generator Utilities
 * Shared helper functions for generating IDs and other values
 */

/**
 * Generates a formatted ID with a prefix, date component key, and random suffix
 * Format: PREFIX-YYYYMMDD-XXXX
 * Example: INV-20240320-1234
 */
export function generateFormattedId(prefix: string): string {
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `${prefix}-${dateStr}-${randomNum}`
}
