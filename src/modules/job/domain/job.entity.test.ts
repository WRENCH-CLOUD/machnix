import { describe, it, expect } from 'vitest'
import { statusConfig, JobStatus } from './job.entity'

describe('Job Entity', () => {
  describe('statusConfig', () => {
    it('should have configuration for all statuses', () => {
      const statuses: JobStatus[] = ['received', 'working', 'ready', 'completed', 'cancelled']
      
      statuses.forEach(status => {
        expect(statusConfig[status]).toBeDefined()
        expect(statusConfig[status].label).toBeDefined()
        expect(statusConfig[status].color).toBeDefined()
        expect(statusConfig[status].bgColor).toBeDefined()
      })
    })

    it('should have correct color classes', () => {
      expect(statusConfig.received.color).toContain('blue')
      expect(statusConfig.cancelled.color).toContain('red')
    })
  })
})
