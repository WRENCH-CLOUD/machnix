"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, GripVertical, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { DVIService } from "@/lib/supabase/services/dvi.service"
import { useAuth } from "@/providers/auth-provider"
import type { Database } from "@/lib/supabase/database.types"

type DVITemplate = Database['tenant']['Tables']['dvi_templates']['Row']
type DVICategory = Database['tenant']['Tables']['dvi_categories']['Row']
type DVICheckpoint = Database['tenant']['Tables']['dvi_checkpoints']['Row']

interface TemplateWithDetails extends DVITemplate {
  categories?: (DVICategory & {
    checkpoints?: DVICheckpoint[]
  })[]
}

export function DVITemplateManager() {
  const { tenantId } = useAuth()
  const [templates, setTemplates] = useState<DVITemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (tenantId) {
      loadTemplates()
    }
  }, [tenantId])

  const loadTemplates = async () => {
    if (!tenantId) return
    
    setLoading(true)
    try {
      const data = await DVIService.getTemplates(tenantId)
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplateDetails = async (templateId: string) => {
    try {
      const data = await DVIService.getTemplateWithDetails(templateId)
      setSelectedTemplate(data as TemplateWithDetails)
    } catch (error) {
      console.error('Error loading template details:', error)
    }
  }

  const handleCreateTemplate = async (formData: {
    name: string
    description: string
    is_active: boolean
  }) => {
    if (!tenantId) return

    setLoading(true)
    try {
      await DVIService.createTemplate({
        tenant_id: tenantId,
        ...formData,
      })
      await loadTemplates()
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await DVIService.deleteTemplate(id)
      await loadTemplates()
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const handleToggleActive = async (template: DVITemplate) => {
    try {
      await DVIService.updateTemplate(template.id, {
        is_active: !template.is_active,
      })
      await loadTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Failed to update template')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">DVI Templates</h2>
          <p className="text-muted-foreground">Manage Digital Vehicle Inspection templates</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create DVI Template</DialogTitle>
            </DialogHeader>
            <CreateTemplateForm onSubmit={handleCreateTemplate} onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => loadTemplateDetails(template.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge variant={template.is_active ? "default" : "secondary"}>
                  {template.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
              <div className="flex items-center justify-between">
                <Switch
                  checked={template.is_active}
                  onCheckedChange={() => handleToggleActive(template)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      loadTemplateDetails(template.id)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTemplate(template.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
            </DialogHeader>
            <TemplateEditor template={selectedTemplate} onClose={() => setIsEditDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function CreateTemplateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; description: string; is_active: boolean }) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Template Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Standard 35-Point Inspection"
          required
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this inspection template..."
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label>Active</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Template</Button>
      </div>
    </form>
  )
}

function TemplateEditor({
  template,
  onClose,
}: {
  template: TemplateWithDetails
  onClose: () => void
}) {
  const [categories, setCategories] = useState<(DVICategory & { checkpoints?: DVICheckpoint[] })[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [template.id])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const cats = await DVIService.getCategories(template.id)
      
      // Load checkpoints for each category
      const catsWithCheckpoints = await Promise.all(
        cats.map(async (cat) => {
          const checkpoints = await DVIService.getCheckpoints(cat.id)
          return { ...cat, checkpoints }
        })
      )
      
      setCategories(catsWithCheckpoints)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    const name = prompt('Category name:')
    if (!name) return

    try {
      await DVIService.createCategory({
        template_id: template.id,
        name,
        sort_order: categories.length,
      })
      await loadCategories()
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Failed to create category')
    }
  }

  const handleAddCheckpoint = async (categoryId: string) => {
    const name = prompt('Checkpoint name:')
    if (!name) return

    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    try {
      await DVIService.createCheckpoint({
        category_id: categoryId,
        name,
        sort_order: category.checkpoints?.length || 0,
      })
      await loadCategories()
    } catch (error) {
      console.error('Error creating checkpoint:', error)
      alert('Failed to create checkpoint')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category and all its checkpoints?')) return

    try {
      await DVIService.deleteCategory(categoryId)
      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  const handleDeleteCheckpoint = async (checkpointId: string) => {
    if (!confirm('Delete this checkpoint?')) return

    try {
      await DVIService.deleteCheckpoint(checkpointId)
      await loadCategories()
    } catch (error) {
      console.error('Error deleting checkpoint:', error)
      alert('Failed to delete checkpoint')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Categories & Checkpoints</h3>
        <Button onClick={handleAddCategory}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No categories yet. Click "Add Category" to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleAddCheckpoint(category.id)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Checkpoint
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.checkpoints && category.checkpoints.length > 0 ? (
                  <ul className="space-y-2">
                    {category.checkpoints.map((checkpoint) => (
                      <li key={checkpoint.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <span>{checkpoint.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCheckpoint(checkpoint.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No checkpoints in this category</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
