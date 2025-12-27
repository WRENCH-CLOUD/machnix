/**
 * MIGRATION SCRIPT - Update Existing Users with JWT Claims
 * 
 * This script updates all existing users in the database to have proper
 * JWT claims (role and tenant_id) in their app_metadata.
 * 
 * RUN THIS AFTER:
 * 1. Deploying the new JWT claim code
 * 2. Running the RLS migration (20251211000000_standardize_jwt_claims.sql)
 * 
 * USAGE:
 * 1. Ensure environment variables are set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 * 2. Run: npx tsx scripts/update-existing-users-jwt-claims.ts
 * 3. Review output and verify users have correct claims
 * 
 * WHAT IT DOES:
 * - Fetches all users from tenant.users table
 * - Sets JWT claims based on their tenant_id and role
 * - Skips users who already have correct claims
 * - Reports success/failure for each user
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { setTenantUserClaims, getUserJwtClaims } from '../lib/auth/set-jwt-claims'
import { JWT_ROLES, isValidRole } from '../lib/auth/jwt-claims'

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.warn('⚠️  .env.local not found, using system environment variables\n')
}

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗')
  process.exit(1)
}

// Create admin client (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Map tenant.users role to JWT role
// tenant.users uses: 'admin' | 'tenant' | 'mechanic' | 'employee'
// JWT uses standardized roles from JWT_ROLES
function mapTenantRoleToJwtRole(tenantRole: string): string {
  const mapping: Record<string, string> = {
    'admin': JWT_ROLES.TENANT_ADMIN,
    'tenant': JWT_ROLES.TENANT,
    'mechanic': JWT_ROLES.MECHANIC,
    'employee': JWT_ROLES.EMPLOYEE,
    'frontdesk': JWT_ROLES.FRONTDESK,
    'manager': JWT_ROLES.MANAGER,
  }

  return mapping[tenantRole.toLowerCase()] || JWT_ROLES.EMPLOYEE
}

interface TenantUser {
  auth_user_id: string
  tenant_id: string
  name: string
  email: string
  role: string
}

async function updateExistingUsers() {
  console.log('🔄 Starting JWT claims migration for existing users...\n')

  try {
    // Step 1: Fetch all tenant users
    console.log('📋 Fetching all tenant users...')
    const { data: tenantUsers, error: fetchError } = await supabaseAdmin
      .schema('tenant')
      .from('users')
      .select('auth_user_id, tenant_id, name, email, role')
      .eq('is_active', true)

    if (fetchError) {
      console.error('❌ Error fetching tenant users:', fetchError.message)
      process.exit(1)
    }

    if (!tenantUsers || tenantUsers.length === 0) {
      console.log('⚠️  No tenant users found in database')
      return
    }

    console.log(`✅ Found ${tenantUsers.length} tenant users\n`)

    // Step 2: Fetch all platform admins
    console.log('📋 Fetching all platform admins...')
    const { data: platformAdmins, error: adminFetchError } = await supabaseAdmin
      .from('platform_admins')
      .select('auth_user_id, name, email')
      .eq('is_active', true)

    if (adminFetchError) {
      console.error('❌ Error fetching platform admins:', adminFetchError.message)
    }

    console.log(`✅ Found ${platformAdmins?.length || 0} platform admins\n`)

    // Step 3: Process platform admins
    let adminSuccessCount = 0
    let adminSkipCount = 0
    let adminFailCount = 0

    if (platformAdmins && platformAdmins.length > 0) {
      console.log('👤 Processing platform admins...')
      
      for (const admin of platformAdmins) {
        console.log(`\n  Processing: ${admin.email} (${admin.name})`)

        // Check current claims
        const currentClaims = await getUserJwtClaims(supabaseAdmin, admin.auth_user_id)
        
        if (currentClaims?.role === JWT_ROLES.PLATFORM_ADMIN) {
          console.log('  ⏭️  Already has correct claims, skipping')
          adminSkipCount++
          continue
        }

        // Set platform admin claims
        const { setPlatformAdminClaims } = await import('../lib/auth/set-jwt-claims')
        const result = await setPlatformAdminClaims(supabaseAdmin, admin.auth_user_id)

        if (result.success) {
          console.log('  ✅ Successfully set platform_admin claims')
          adminSuccessCount++
        } else {
          console.log(`  ❌ Failed: ${result.error}`)
          adminFailCount++
        }
      }
    }

    // Step 4: Process tenant users
    let tenantSuccessCount = 0
    let tenantSkipCount = 0
    let tenantFailCount = 0

    console.log('\n👥 Processing tenant users...')

    for (const user of tenantUsers as TenantUser[]) {
      console.log(`\n  Processing: ${user.email} (${user.name})`)
      console.log(`    Tenant ID: ${user.tenant_id}`)
      console.log(`    Current Role: ${user.role}`)

      // Map tenant role to JWT role
      const jwtRole = mapTenantRoleToJwtRole(user.role)
      console.log(`    JWT Role: ${jwtRole}`)

      // Check current claims
      const currentClaims = await getUserJwtClaims(supabaseAdmin, user.auth_user_id)
      
      if (
        currentClaims?.role === jwtRole &&
        currentClaims?.tenant_id === user.tenant_id
      ) {
        console.log('  ⏭️  Already has correct claims, skipping')
        tenantSkipCount++
        continue
      }

      // Set tenant user claims
      const result = await setTenantUserClaims(
        supabaseAdmin,
        user.auth_user_id,
        jwtRole as any,
        user.tenant_id
      )

      if (result.success) {
        console.log(`  ✅ Successfully set claims (role: ${jwtRole}, tenant_id: ${user.tenant_id})`)
        tenantSuccessCount++
      } else {
        console.log(`  ❌ Failed: ${result.error}`)
        tenantFailCount++
      }
    }

    // Step 5: Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    
    if (platformAdmins && platformAdmins.length > 0) {
      console.log('\nPlatform Admins:')
      console.log(`  ✅ Successfully updated: ${adminSuccessCount}`)
      console.log(`  ⏭️  Already correct:      ${adminSkipCount}`)
      console.log(`  ❌ Failed:              ${adminFailCount}`)
      console.log(`  📊 Total:               ${platformAdmins.length}`)
    }

    console.log('\nTenant Users:')
    console.log(`  ✅ Successfully updated: ${tenantSuccessCount}`)
    console.log(`  ⏭️  Already correct:      ${tenantSkipCount}`)
    console.log(`  ❌ Failed:              ${tenantFailCount}`)
    console.log(`  📊 Total:               ${tenantUsers.length}`)

    const totalSuccess = adminSuccessCount + tenantSuccessCount
    const totalSkipped = adminSkipCount + tenantSkipCount
    const totalFailed = adminFailCount + tenantFailCount
    const totalProcessed = (platformAdmins?.length || 0) + tenantUsers.length

    console.log('\nOverall:')
    console.log(`  ✅ Successfully updated: ${totalSuccess}`)
    console.log(`  ⏭️  Already correct:      ${totalSkipped}`)
    console.log(`  ❌ Failed:              ${totalFailed}`)
    console.log(`  📊 Total processed:     ${totalProcessed}`)
    console.log('='.repeat(60))

    if (totalFailed > 0) {
      console.log('\n⚠️  Some users failed to update. Please review the errors above.')
      process.exit(1)
    } else {
      console.log('\n✅ All users successfully processed!')
      console.log('\n📝 Next steps:')
      console.log('   1. Test login with different user roles')
      console.log('   2. Verify RLS policies are working correctly')
      console.log('   3. Check that tenant isolation is enforced')
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
console.log('╔════════════════════════════════════════════════════════════╗')
console.log('║   JWT CLAIMS MIGRATION - Update Existing Users            ║')
console.log('╚════════════════════════════════════════════════════════════╝\n')

updateExistingUsers()
