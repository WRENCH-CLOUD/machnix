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
}
