import { supabase, ensureTenantContext } from '../client'
import type { Database } from '../types'

type DVITemplate = Database['tenant']['Tables']['dvi_templates']['Row']
type DVITemplateInsert = Database['tenant']['Tables']['dvi_templates']['Insert']
type DVITemplateUpdate = Database['tenant']['Tables']['dvi_templates']['Update']
type DVICategory = Database['tenant']['Tables']['dvi_checkpoint_categories']['Row']
type DVICategoryInsert = Database['tenant']['Tables']['dvi_checkpoint_categories']['Insert']
type DVICheckpoint = Database['tenant']['Tables']['dvi_checkpoints']['Row']
type DVICheckpointInsert = Database['tenant']['Tables']['dvi_checkpoints']['Insert']

export class DVIService {
  /**
   * Get all DVI templates for the current tenant
   */
  static async getTemplates(): Promise<DVITemplate[]> {
    const tenantId = ensureTenantContext()

    try {
      const { data, error } = await supabase
        .schema('tenant')
        .from('dvi_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('DVI tables not yet created in database:', error)
      return []
    }
  }

  static async getTemplateWithDetails(
    templateId: string
  ): Promise<(DVITemplate & { categories?: Array<DVICategory & { checkpoints?: DVICheckpoint[] }> }) | null> {
    const tenantId = ensureTenantContext()

    try {
      const { data: template, error: templateError } = await supabase
        .schema('tenant')
        .from('dvi_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', templateId)
        .single()

      if (templateError || !template) throw templateError

      const checkpoints = await this.getCheckpointsByTemplate(templateId)
      const categories = await this.getCategories(templateId)
      const categoriesWithCheckpoints = categories.map((category) => ({
        ...category,
        checkpoints: checkpoints.filter((checkpoint) => checkpoint.category_id === category.id),
      }))

      return {
        ...template,
        categories: categoriesWithCheckpoints,
      }
    } catch (error) {
      console.warn('DVI template details not available:', error)
      return null
    }
  }

  /**
   * Create a new DVI template
   */
  static async createTemplate(template: DVITemplateInsert): Promise<DVITemplate> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('dvi_templates')
      .insert({
        ...template,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update a DVI template
   */
  static async updateTemplate(templateId: string, updates: any): Promise<any> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('dvi_templates')
      .update(updates)
      .eq('id', templateId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete a DVI template
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    const tenantId = ensureTenantContext()

    const { error } = await supabase
      .schema('tenant')
      .from('dvi_templates')
      .delete()
      .eq('id', templateId)
      .eq('tenant_id', tenantId)
    
    if (error) throw error
  }

  static async getCategories(templateId?: string): Promise<DVICategory[]> {
    const tenantId = ensureTenantContext()

    try {
      let query = supabase
        .schema('tenant')
        .from('dvi_checkpoint_categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true })

      if (templateId) {
        const { data: categoryRefs, error: refsError } = await supabase
          .schema('tenant')
          .from('dvi_checkpoints')
          .select('category_id')
          .eq('template_id', templateId)
          .not('category_id', 'is', null)

        if (refsError) throw refsError

        const categoryIds = Array.from(
          new Set((categoryRefs || []).map((ref) => ref.category_id).filter(Boolean) as string[])
        )

        if (categoryIds.length === 0) {
          return []
        }

        query = query.in('id', categoryIds)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('DVI categories not available:', error)
      return []
    }
  }

  static async getCheckpoints(categoryId: string, templateId?: string): Promise<DVICheckpoint[]> {
    const tenantId = ensureTenantContext()

    try {
      let query = supabase
        .schema('tenant')
        .from('dvi_checkpoints')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true })

      if (templateId) {
        query = query.eq('template_id', templateId)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('DVI checkpoints not available:', error)
      return []
    }
  }

  static async getCheckpointsByTemplate(templateId: string): Promise<DVICheckpoint[]> {
    const tenantId = ensureTenantContext()

    try {
      const { data, error } = await supabase
        .schema('tenant')
        .from('dvi_checkpoints')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('template_id', templateId)
        .order('display_order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('DVI checkpoints not available:', error)
      return []
    }
  }

  static async createCategory(category: Omit<DVICategoryInsert, 'tenant_id'>): Promise<DVICategory> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('dvi_checkpoint_categories')
      .insert({
        ...category,
        tenant_id: tenantId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async createCheckpoint(checkpoint: Omit<DVICheckpointInsert, 'tenant_id'>): Promise<DVICheckpoint> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('dvi_checkpoints')
      .insert({
        ...checkpoint,
        tenant_id: tenantId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    const tenantId = ensureTenantContext()

    const { error } = await supabase
      .schema('tenant')
      .from('dvi_checkpoint_categories')
      .delete()
      .eq('id', categoryId)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  static async deleteCheckpoint(checkpointId: string): Promise<void> {
    const tenantId = ensureTenantContext()

    const { error } = await supabase
      .schema('tenant')
      .from('dvi_checkpoints')
      .delete()
      .eq('id', checkpointId)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  /**
   * Initialize DVI items for a job based on a template
   * This copies template checkpoints to job-specific DVI items
   */
  static async initializeJobDVI(jobId: string, templateId: string): Promise<void> {
    const tenantId = ensureTenantContext()

    try {
      // Get the template with its checkpoints
      const { data: template, error: templateError } = await supabase
        .schema('tenant')
        .from('dvi_templates')
        .select('*')
        .eq('id', templateId)
        .eq('tenant_id', tenantId)
        .single()
      
      if (templateError) {
        console.warn('Template not found or DVI not set up:', templateError)
        return
      }

      // Get template checkpoints if they exist
      const { data: checkpoints, error: checkpointsError } = await supabase
        .schema('tenant')
        .from('dvi_checkpoints')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: true })

      if (checkpointsError || !checkpoints?.length) {
        console.warn('No checkpoints found for template:', checkpointsError)
        return
      }

      // Create job DVI items from checkpoints
      const dviItems = checkpoints.map((checkpoint: any) => ({
        jobcard_id: jobId,
        checkpoint_id: checkpoint.id,
        checkpoint_name: checkpoint.name,
        status: 'pending',
        created_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase
        .schema('tenant')
        .from('dvi_items')
        .insert(dviItems)

      if (insertError) {
        console.warn('Failed to create DVI items:', insertError)
      }
    } catch (error) {
      console.warn('DVI initialization failed (tables may not exist):', error)
    }
  }
}
