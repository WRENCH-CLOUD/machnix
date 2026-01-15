import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })
    
    it('should handle conditionals', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
    })

    it('should merge tailwind classes properly', () => {
      // tailwind-merge should resolve conflicts
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })
  })
})
