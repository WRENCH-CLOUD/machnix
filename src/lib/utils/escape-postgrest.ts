/**
 * Utility function to escape special characters in PostgREST filter syntax
 * Prevents potential SQL/filter injection through user input
 */
export function escapePostgrestOperator(value: string): string {
  if (!value) return value;
  
  // Escape characters that have special meaning in PostgREST filter syntax
  return value
    .replace(/\\/g, '\\\\')  // Escape backslash first
    .replace(/,/g, '\\,')    // Escape comma (OR separator in .or())
    .replace(/\./g, '\\.')   // Escape dot (field separator)
    .replace(/\(/g, '\\(')   // Escape parentheses
    .replace(/\)/g, '\\)')
    .replace(/:/g, '\\:');   // Escape colon (operator separator)
}
