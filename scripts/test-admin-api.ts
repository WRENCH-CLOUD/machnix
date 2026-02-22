/**
 * Test script to verify admin API functionality
 */

import { getSupabaseAdmin } from '../src/lib/supabase/admin'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.warn('⚠️  .env.local not found')
}

async function testAdminAPI() {
  console.log('🔍 Testing admin API...\n')

  try {
    const supabaseAdmin = getSupabaseAdmin()
    console.log('✅ Admin client created\n')

    // Test fetching tenants
    console.log('📝 Fetching tenants...')
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError)
      throw tenantsError
    }

    console.log(`✅ Found ${tenants?.length || 0} tenants`)
    if (tenants && tenants.length > 0) {
      console.log('   First tenant:', tenants[0].name, '(' + tenants[0].id + ')')
    }

    // Test fetching payments
    console.log('\n📝 Fetching payments...')
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .schema('tenant')
      .from('payments')
      .select('*')
      .limit(5)

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError)
      throw paymentsError
    }

    console.log(`✅ Found ${payments?.length || 0} payments`)

    console.log('\n🎉 All tests passed!')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

testAdminAPI()
