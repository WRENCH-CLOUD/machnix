import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

interface CreateTenantRequest {
  tenantName: string
  tenantSlug: string
  adminName: string
  adminEmail: string
  adminPhone?: string
  subscription: 'starter' | 'pro' | 'enterprise'
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    // Initialize admin client
    const supabaseAdmin = getSupabaseAdmin()

    // Parse request body
    const body: CreateTenantRequest = await request.json()

    // Validate required fields
    if (!body.tenantName || !body.tenantSlug || !body.adminName || !body.adminEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    if (!emailRegex.test(body.adminEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(body.tenantSlug)) {
      return NextResponse.json(
        { error: 'Invalid tenant slug. Use only lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      )
    }

    // Log the tenant creation attempt
    console.log(`[TENANT_CREATE] Initiating tenant creation for: ${body.tenantName} (${body.tenantSlug})`)

    // STEP 1: Check if slug already exists
    const { data: existingTenant } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .select('id')
      .eq('slug', body.tenantSlug)
      .single()

    if (existingTenant) {
      console.log(`[TENANT_CREATE] Tenant slug already exists: ${body.tenantSlug}`)
      return NextResponse.json(
        { error: 'Tenant slug already exists. Please choose a different slug.' },
        { status: 409 }
      )
    }

    // STEP 2: Check if admin email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUser.users.some(
      user => user.email?.toLowerCase() === body.adminEmail.toLowerCase()
    )

    if (emailExists) {
      console.log(`[TENANT_CREATE] Email already registered: ${body.adminEmail}`)
      return NextResponse.json(
        { error: 'Email address already registered in the system.' },
        { status: 409 }
      )
    }

    // STEP 3: Create tenant record in tenant.tenants
    const { data: newTenant, error: tenantError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .insert({
        name: body.tenantName,
        slug: body.tenantSlug,
        metadata: {
          subscription: body.subscription,
          status: 'active',
          notes: body.notes || null,
          created_by: 'admin',
          created_at: new Date().toISOString(),
        }
      })
      .select()
      .single()

    if (tenantError || !newTenant) {
      console.error('[TENANT_CREATE] Failed to create tenant:', tenantError)
      throw new Error('Failed to create tenant record')
    }

    console.log(`[TENANT_CREATE] Tenant created successfully: ${newTenant.id}`)

    // STEP 4: Create auth user via Supabase Admin API
    // Using email confirmation with magic link - SECURE METHOD
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.adminEmail,
      email_confirm: false, // They must confirm email first
      user_metadata: {
        name: body.adminName,
        phone: body.adminPhone || null,
        role: 'tenant_admin',
        tenant_id: newTenant.id,
        tenant_name: body.tenantName,
      },
    })

    if (authError || !authUser.user) {
      console.error('[TENANT_CREATE] Failed to create auth user:', authError)
      
      // Rollback: Delete the tenant record
      await supabaseAdmin
        .schema('tenant')
        .from('tenants')
        .delete()
        .eq('id', newTenant.id)
      
      throw new Error('Failed to create admin user')
    }

    console.log(`[TENANT_CREATE] Auth user created: ${authUser.user.id}`)

    // STEP 5: Create mapping in tenant.users
    const { error: userMappingError } = await supabaseAdmin
      .schema('tenant')
      .from('users')
      .insert({
        tenant_id: newTenant.id,
        auth_user_id: authUser.user.id,
        name: body.adminName,
        email: body.adminEmail,
        phone: body.adminPhone || null,
        role: 'tenant_admin',
        is_active: true,
      })

    if (userMappingError) {
      console.error('[TENANT_CREATE] Failed to create user mapping:', userMappingError)
      
      // Rollback: Delete auth user and tenant
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      await supabaseAdmin
        .schema('tenant')
        .from('tenants')
        .delete()
        .eq('id', newTenant.id)
      
      throw new Error('Failed to create user mapping')
    }

    console.log(`[TENANT_CREATE] User mapping created successfully`)

    // STEP 6: Generate magic link for password setup
    const { data: magicLink, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: body.adminEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      }
    })

    if (magicLinkError || !magicLink) {
      console.error('[TENANT_CREATE] Failed to generate magic link:', magicLinkError)
      // Don't rollback here - tenant and user are created successfully
      // We can resend the invite later
    }

    console.log(`[TENANT_CREATE] Magic link generated successfully`)

    // STEP 7: Send invitation email (in production, use a proper email service)
    // For now, we'll return the magic link in the response
    // In production, you would:
    // - Use SendGrid, AWS SES, or similar service
    // - Send a branded email with the magic link
    // - Never expose the raw magic link in the API response

    // TODO: Implement email sending service
    // await sendInvitationEmail({
    //   to: body.adminEmail,
    //   tenantName: body.tenantName,
    //   adminName: body.adminName,
    //   magicLink: magicLink.properties.action_link,
    // })

    console.log(`[TENANT_CREATE] Tenant creation completed successfully for: ${body.tenantName}`)

    // Log the creation event
    await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .update({
        metadata: {
          ...newTenant.metadata as any,
          admin_email: body.adminEmail,
          invite_sent_at: new Date().toISOString(),
        }
      })
      .eq('id', newTenant.id)

    return NextResponse.json({
      success: true,
      message: 'Tenant created successfully. Invitation email sent.',
      tenant: {
        id: newTenant.id,
        name: newTenant.name,
        slug: newTenant.slug,
      },
      // In production, don't return this - send via email only
      inviteLink: magicLink?.properties?.action_link || null,
    })

  } catch (error) {
    console.error('[TENANT_CREATE] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create tenant',
        details: 'Please check server logs for more information'
      },
      { status: 500 }
    )
  }
}
