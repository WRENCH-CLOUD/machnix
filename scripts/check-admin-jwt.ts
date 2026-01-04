import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

async function checkAdminUser() {
  console.log('🔍 Checking for platform admin users...\n')
  
  // Check platform_admins table
  const { data: admins, error: adminError } = await supabase
    .from('platform_admins')
    .select('*, auth_user_id')
  
  if (adminError) {
    console.error('❌ Error fetching platform admins:', adminError)
    return
  }
  
  console.log(`📊 Found ${admins?.length || 0} platform admins:`)
  if (admins) {
    for (const admin of admins) {
      console.log(`\n  👤 ${admin.name} (${admin.email})`)
      console.log(`     Auth User ID: ${admin.auth_user_id}`)
      console.log(`     Is Active: ${admin.is_active}`)
      
      // Check JWT claims for this user
      if (admin.auth_user_id) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(admin.auth_user_id)
        
        if (userError) {
          console.log(`     ❌ Error fetching auth user: ${userError.message}`)
        } else if (userData?.user) {
          const appMetadata = userData.user.app_metadata || {}
          console.log(`     📋 JWT Claims:`, {
            role: appMetadata.role,
            user_type: appMetadata.user_type,
            tenant_id: appMetadata.tenant_id
          })
          
          if (appMetadata.role !== 'platform_admin') {
            console.log(`     ⚠️  WARNING: Role is not 'platform_admin'! Current role: ${appMetadata.role || 'NOT SET'}`)
          } else {
            console.log(`     ✅ JWT claims are correct!`)
          }
        }
      }
    }
  }
  
  console.log('\n✅ Done!')
}

checkAdminUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Error:', err)
    process.exit(1)
  })
