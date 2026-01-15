import { describe, it, expect } from 'vitest'
import { generateTenantSlug, emailRegex, slugRegex } from './tenant.rules'

describe('Tenant Rules', () => {
  describe('generateTenantSlug', () => {
    it('should convert name to kebab-case', () => {
      expect(generateTenantSlug('My Auto Shop')).toBe('my-auto-shop')
    })
    it('should remove special characters', () => {
      expect(generateTenantSlug('Auto & Repair!')).toBe('auto-repair')
    })
    it('should trim whitespace', () => {
      expect(generateTenantSlug('  Mechanic  ')).toBe('mechanic')
    })
  })

  describe('emailRegex', () => {
    it('should validate correct emails', () => {
      expect(emailRegex('test@example.com')).toBe(true)
    })
    it('should reject invalid emails', () => {
      expect(emailRegex('invalid-email')).toBe(false)
      expect(emailRegex('@domain.com')).toBe(false)
    })
  })

  describe('slugRegex', () => {
    it('should validate correct slugs', () => {
      expect(slugRegex('my-slug-123')).toBe(true)
    })
    it('should reject invalid slugs', () => {
      expect(slugRegex('My Slug')).toBe(false)
      expect(slugRegex('slug!')).toBe(false)
    })
  })
})
