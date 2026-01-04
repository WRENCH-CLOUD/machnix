import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

async function checkAndSeedTenants() {
  console.log('🔍 Checking tenants in database...')
  
  // Check existing tenants
  const { data: tenants, error } = await supabase
    .schema('tenant')
    .from('tenants')
    .select('*')
  
  if (error) {
    console.error('❌ Error fetching tenants:', error)
    return
  }
  
  console.log(`📊 Found ${tenants?.length || 0} tenants`)
  
  if (tenants && tenants.length > 0) {
    console.log('\n📋 Existing tenants:')
    tenants.forEach(tenant => {
      console.log(`  - ${tenant.name} (${tenant.slug}) - ${tenant.status}`)
    })
    return
  }
  
  // No tenants found, let's create sample data
  console.log('\n🌱 No tenants found. Creating sample tenants...')
  
  const sampleTenants = [
    {
      name: 'Elite Motors',
      slug: 'elite-motors',
      status: 'active',
      subscription: 'pro',
    },
    {
      name: 'Quick Fix Garage',
      slug: 'quick-fix',
      status: 'active',
      subscription: 'starter',
    },
    {
      name: 'Premium Auto Service',
      slug: 'premium-auto',
      status: 'trial',
      subscription: 'enterprise',
    },
  ]
  
  for (const tenant of sampleTenants) {
    const { data, error: insertError } = await supabase
      .schema('tenant')
      .from('tenants')
      .insert(tenant)
      .select()
      .single()
    
    if (insertError) {
      console.error(`❌ Error creating tenant ${tenant.name}:`, insertError)
    } else {
      console.log(`✅ Created tenant: ${tenant.name}`)
    }
  }
  
  console.log('\n✨ Sample data seeded successfully!')
}

checkAndSeedTenants()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Error:', err)
    process.exit(1)
  })
