import { supabase, ensureTenantContext } from '../client'
import type { Database } from '../types'

type DVITemplate = Database['tenant']['Tables']['dvi_templates']['Row']
type DVITemplateInsert = Database['tenant']['Tables']['dvi_templates']['Insert']
type DVITemplateUpdate = Database['tenant']['Tables']['dvi_templates']['Update']

// Note: DVI (Digital Vehicle Inspection) tables need to be created in your Supabase database
// This service is a placeholder until the schema is set up

export class DVIService {
  /**
   * Get all DVI templates for the current tenant
   */
  static async getTemplates(): Promise<any[]> {
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

  /**
   * Create a new DVI template
   */
  static async createTemplate(template: any): Promise<any> {
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
        tenant_id: tenantId,
        jobcard_id: jobId,
        checkpoint_id: checkpoint.id,
        name: checkpoint.name,
        category: checkpoint.category_id,
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
