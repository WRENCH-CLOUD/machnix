export function generateTenantSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function emailRegex (email: string): boolean {
  const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  return regex.test(email)
} 
  

 
export function slugRegex(slug: string): boolean {
  const regex = /^[a-z0-9-]+$/
  return regex.test(slug)
}
    