/**
 * scripts/seed-vehicle-data.ts
 * Seed script to populate vehicle categories, makes, and models
 *
 * Usage:
 *  - Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *  - Run: npx tsx scripts/seed-vehicle-data.ts
 *
 * NOTE: This script uses the service_role key. Keep it secret. Run locally or on a secure CI job.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.warn('⚠️  .env.local not found — falling back to process.env')
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// DATA DEFINITIONS
// ============================================================================

const VEHICLE_CATEGORIES = [
  { name: 'Sedan', description: 'Four-door passenger car with a separate trunk' },
  { name: 'SUV', description: 'Sport Utility Vehicle - higher ground clearance and cargo space' },
  { name: 'Truck', description: 'Light-duty pickup trucks' },
  { name: 'Hatchback', description: 'Compact car with a rear door that swings upward' },
  { name: 'Minivan', description: 'Multi-purpose vehicle designed for transporting passengers' },
  { name: 'Sports Car', description: 'High performance vehicle designed for speed and agility' },
  { name: 'Hybrid', description: 'Vehicles with both electric and combustion engines' },
  { name: 'Electric', description: 'Battery Electric Vehicles (BEV)' },
  { name: 'Van', description: 'Cargo or passenger vans' },
  { name: 'Coupe', description: 'Two-door car with a fixed roof' },
  { name: 'Convertible', description: 'Car with a retractable roof' },
  { name: 'Wagon', description: 'Station wagon with extended cargo area' },
]

const VEHICLE_MAKES = [
  { name: 'Toyota', code: 'TOY' },
  { name: 'Honda', code: 'HON' },
  { name: 'Ford', code: 'FOR' },
  { name: 'Chevrolet', code: 'CHV' },
  { name: 'BMW', code: 'BMW' },
  { name: 'Mercedes-Benz', code: 'MER' },
  { name: 'Audi', code: 'AUD' },
  { name: 'Volkswagen', code: 'VW' },
  { name: 'Nissan', code: 'NIS' },
  { name: 'Hyundai', code: 'HYU' },
  { name: 'Kia', code: 'KIA' },
  { name: 'Mazda', code: 'MAZ' },
  { name: 'Subaru', code: 'SUB' },
  { name: 'Tesla', code: 'TES' },
  { name: 'Jeep', code: 'JEP' },
  { name: 'Ram', code: 'RAM' },
  { name: 'Dodge', code: 'DOD' },
  { name: 'Lexus', code: 'LEX' },
  { name: 'Acura', code: 'ACU' },
  { name: 'Infiniti', code: 'INF' },
  { name: 'Volvo', code: 'VOL' },
  { name: 'Porsche', code: 'POR' },
  { name: 'Land Rover', code: 'LR' },
  { name: 'Jaguar', code: 'JAG' },
  { name: 'Mini', code: 'MINI' },
  { name: 'Fiat', code: 'FIA' },
  { name: 'Alfa Romeo', code: 'ALF' },
  { name: 'Maserati', code: 'MAS' },
  { name: 'Ferrari', code: 'FER' },
  { name: 'Lamborghini', code: 'LAM' },
  // Indian Brands
  { name: 'Maruti Suzuki', code: 'MAR' },
  { name: 'Tata', code: 'TAT' },
  { name: 'Mahindra', code: 'MAH' },
  { name: 'MG Motor', code: 'MG' },
  { name: 'Skoda', code: 'SKO' },
  { name: 'Renault', code: 'REN' },
  { name: 'Citroen', code: 'CIT' },
]

// Models organized by make name
const VEHICLE_MODELS: Record<string, { name: string; model_code: string; category: string }[]> = {
  'Toyota': [
    { name: 'Camry', model_code: 'CAM', category: 'Sedan' },
    { name: 'Corolla', model_code: 'COR', category: 'Sedan' },
    { name: 'RAV4', model_code: 'RAV4', category: 'SUV' },
    { name: 'Highlander', model_code: 'HIGH', category: 'SUV' },
    { name: 'Fortuner', model_code: 'FORT', category: 'SUV' },
    { name: 'Innova Crysta', model_code: 'INN', category: 'Minivan' },
    { name: 'Prius', model_code: 'PRI', category: 'Hybrid' },
    { name: 'Supra', model_code: 'SUP', category: 'Sports Car' },
    { name: 'Glanza', model_code: 'GLA', category: 'Hatchback' },
  ],
  'Honda': [
    { name: 'Accord', model_code: 'ACC', category: 'Sedan' },
    { name: 'Civic', model_code: 'CIV', category: 'Sedan' },
    { name: 'City', model_code: 'CITY', category: 'Sedan' },
    { name: 'Amaze', model_code: 'AMZ', category: 'Sedan' },
    { name: 'CR-V', model_code: 'CRV', category: 'SUV' },
    { name: 'Elevate', model_code: 'ELV', category: 'SUV' },
    { name: 'WR-V', model_code: 'WRV', category: 'SUV' },
  ],
  'Ford': [
    { name: 'F-150', model_code: 'F150', category: 'Truck' },
    { name: 'Mustang', model_code: 'MUS', category: 'Sports Car' },
    { name: 'Explorer', model_code: 'EXP', category: 'SUV' },
    { name: 'Endeavour', model_code: 'END', category: 'SUV' },
    { name: 'EcoSport', model_code: 'ECO', category: 'SUV' },
  ],
  'BMW': [
    { name: '3 Series', model_code: '3SER', category: 'Sedan' },
    { name: '5 Series', model_code: '5SER', category: 'Sedan' },
    { name: '7 Series', model_code: '7SER', category: 'Sedan' },
    { name: 'X1', model_code: 'X1', category: 'SUV' },
    { name: 'X3', model_code: 'X3', category: 'SUV' },
    { name: 'X5', model_code: 'X5', category: 'SUV' },
    { name: 'i4', model_code: 'I4', category: 'Electric' },
    { name: 'iX', model_code: 'IX', category: 'Electric' },
    { name: 'M3', model_code: 'M3', category: 'Sports Car' },
  ],
  'Mercedes-Benz': [
    { name: 'A-Class', model_code: 'A-CL', category: 'Sedan' },
    { name: 'C-Class', model_code: 'C-CL', category: 'Sedan' },
    { name: 'E-Class', model_code: 'E-CL', category: 'Sedan' },
    { name: 'S-Class', model_code: 'S-CL', category: 'Sedan' },
    { name: 'GLA', model_code: 'GLA', category: 'SUV' },
    { name: 'GLC', model_code: 'GLC', category: 'SUV' },
    { name: 'GLE', model_code: 'GLE', category: 'SUV' },
    { name: 'EQS', model_code: 'EQS', category: 'Electric' },
    { name: 'AMG GT', model_code: 'AMGT', category: 'Sports Car' },
  ],
  'Audi': [
    { name: 'A3', model_code: 'A3', category: 'Sedan' },
    { name: 'A4', model_code: 'A4', category: 'Sedan' },
    { name: 'A6', model_code: 'A6', category: 'Sedan' },
    { name: 'Q3', model_code: 'Q3', category: 'SUV' },
    { name: 'Q5', model_code: 'Q5', category: 'SUV' },
    { name: 'Q7', model_code: 'Q7', category: 'SUV' },
    { name: 'e-tron', model_code: 'ETR', category: 'Electric' },
    { name: 'R8', model_code: 'R8', category: 'Sports Car' },
  ],
  'Hyundai': [
    { name: 'i10', model_code: 'I10', category: 'Hatchback' },
    { name: 'i20', model_code: 'I20', category: 'Hatchback' },
    { name: 'Verna', model_code: 'VER', category: 'Sedan' },
    { name: 'Elantra', model_code: 'ELA', category: 'Sedan' },
    { name: 'Venue', model_code: 'VEN', category: 'SUV' },
    { name: 'Creta', model_code: 'CRE', category: 'SUV' },
    { name: 'Tucson', model_code: 'TUC', category: 'SUV' },
    { name: 'Alcazar', model_code: 'ALC', category: 'SUV' },
    { name: 'Ioniq 5', model_code: 'ION5', category: 'Electric' },
    { name: 'Kona Electric', model_code: 'KONE', category: 'Electric' },
  ],
  'Kia': [
    { name: 'Seltos', model_code: 'SEL', category: 'SUV' },
    { name: 'Sonet', model_code: 'SON', category: 'SUV' },
    { name: 'Carens', model_code: 'CAR', category: 'Minivan' },
    { name: 'Carnival', model_code: 'CARN', category: 'Minivan' },
    { name: 'EV6', model_code: 'EV6', category: 'Electric' },
    { name: 'Sportage', model_code: 'SPO', category: 'SUV' },
  ],
  'Maruti Suzuki': [
    { name: 'Alto', model_code: 'ALT', category: 'Hatchback' },
    { name: 'Swift', model_code: 'SWI', category: 'Hatchback' },
    { name: 'Baleno', model_code: 'BAL', category: 'Hatchback' },
    { name: 'WagonR', model_code: 'WAG', category: 'Hatchback' },
    { name: 'Dzire', model_code: 'DZI', category: 'Sedan' },
    { name: 'Ciaz', model_code: 'CIZ', category: 'Sedan' },
    { name: 'Brezza', model_code: 'BRZ', category: 'SUV' },
    { name: 'Grand Vitara', model_code: 'GV', category: 'SUV' },
    { name: 'Fronx', model_code: 'FRO', category: 'SUV' },
    { name: 'Jimny', model_code: 'JIM', category: 'SUV' },
    { name: 'Ertiga', model_code: 'ERT', category: 'Minivan' },
    { name: 'XL6', model_code: 'XL6', category: 'Minivan' },
  ],
  'Tata': [
    { name: 'Tiago', model_code: 'TIA', category: 'Hatchback' },
    { name: 'Altroz', model_code: 'ALT', category: 'Hatchback' },
    { name: 'Punch', model_code: 'PUN', category: 'SUV' },
    { name: 'Nexon', model_code: 'NEX', category: 'SUV' },
    { name: 'Nexon EV', model_code: 'NEXE', category: 'Electric' },
    { name: 'Harrier', model_code: 'HAR', category: 'SUV' },
    { name: 'Safari', model_code: 'SAF', category: 'SUV' },
    { name: 'Tigor', model_code: 'TIG', category: 'Sedan' },
    { name: 'Tigor EV', model_code: 'TIGE', category: 'Electric' },
    { name: 'Tiago EV', model_code: 'TIAE', category: 'Electric' },
  ],
  'Mahindra': [
    { name: 'Thar', model_code: 'THA', category: 'SUV' },
    { name: 'Scorpio-N', model_code: 'SCN', category: 'SUV' },
    { name: 'Scorpio Classic', model_code: 'SCC', category: 'SUV' },
    { name: 'XUV700', model_code: 'X700', category: 'SUV' },
    { name: 'XUV400', model_code: 'X400', category: 'Electric' },
    { name: 'XUV300', model_code: 'X300', category: 'SUV' },
    { name: 'Bolero', model_code: 'BOL', category: 'SUV' },
    { name: 'BE 6', model_code: 'BE6', category: 'Electric' },
  ],
  'MG Motor': [
    { name: 'Hector', model_code: 'HEC', category: 'SUV' },
    { name: 'Astor', model_code: 'AST', category: 'SUV' },
    { name: 'ZS EV', model_code: 'ZSEV', category: 'Electric' },
    { name: 'Comet EV', model_code: 'COM', category: 'Electric' },
    { name: 'Gloster', model_code: 'GLO', category: 'SUV' },
  ],
  'Skoda': [
    { name: 'Slavia', model_code: 'SLA', category: 'Sedan' },
    { name: 'Kushaq', model_code: 'KUS', category: 'SUV' },
    { name: 'Kodiaq', model_code: 'KOD', category: 'SUV' },
    { name: 'Superb', model_code: 'SUP', category: 'Sedan' },
    { name: 'Octavia', model_code: 'OCT', category: 'Sedan' },
  ],
  'Volkswagen': [
    { name: 'Polo', model_code: 'POL', category: 'Hatchback' },
    { name: 'Virtus', model_code: 'VIR', category: 'Sedan' },
    { name: 'Taigun', model_code: 'TAI', category: 'SUV' },
    { name: 'Tiguan', model_code: 'TIG', category: 'SUV' },
    { name: 'ID.4', model_code: 'ID4', category: 'Electric' },
  ],
  'Tesla': [
    { name: 'Model 3', model_code: 'M3', category: 'Electric' },
    { name: 'Model Y', model_code: 'MY', category: 'Electric' },
    { name: 'Model S', model_code: 'MS', category: 'Electric' },
    { name: 'Model X', model_code: 'MX', category: 'Electric' },
    { name: 'Cybertruck', model_code: 'CYB', category: 'Electric' },
  ],
  'Jeep': [
    { name: 'Compass', model_code: 'COM', category: 'SUV' },
    { name: 'Meridian', model_code: 'MER', category: 'SUV' },
    { name: 'Wrangler', model_code: 'WRA', category: 'SUV' },
    { name: 'Grand Cherokee', model_code: 'GC', category: 'SUV' },
  ],
  'Volvo': [
    { name: 'S60', model_code: 'S60', category: 'Sedan' },
    { name: 'S90', model_code: 'S90', category: 'Sedan' },
    { name: 'XC40', model_code: 'XC40', category: 'SUV' },
    { name: 'XC60', model_code: 'XC60', category: 'SUV' },
    { name: 'XC90', model_code: 'XC90', category: 'SUV' },
    { name: 'XC40 Recharge', model_code: 'XC40E', category: 'Electric' },
  ],
  'Porsche': [
    { name: '911', model_code: '911', category: 'Sports Car' },
    { name: 'Cayenne', model_code: 'CAY', category: 'SUV' },
    { name: 'Macan', model_code: 'MAC', category: 'SUV' },
    { name: 'Panamera', model_code: 'PAN', category: 'Sedan' },
    { name: 'Taycan', model_code: 'TAY', category: 'Electric' },
  ],
  'Land Rover': [
    { name: 'Range Rover', model_code: 'RR', category: 'SUV' },
    { name: 'Range Rover Sport', model_code: 'RRS', category: 'SUV' },
    { name: 'Defender', model_code: 'DEF', category: 'SUV' },
    { name: 'Discovery', model_code: 'DIS', category: 'SUV' },
  ],
  'Jaguar': [
    { name: 'XE', model_code: 'XE', category: 'Sedan' },
    { name: 'XF', model_code: 'XF', category: 'Sedan' },
    { name: 'F-PACE', model_code: 'FP', category: 'SUV' },
    { name: 'I-PACE', model_code: 'IP', category: 'Electric' },
    { name: 'F-TYPE', model_code: 'FT', category: 'Sports Car' },
  ],
  'Lexus': [
    { name: 'ES', model_code: 'ES', category: 'Sedan' },
    { name: 'LS', model_code: 'LS', category: 'Sedan' },
    { name: 'NX', model_code: 'NX', category: 'SUV' },
    { name: 'RX', model_code: 'RX', category: 'SUV' },
    { name: 'LX', model_code: 'LX', category: 'SUV' },
  ],
  'Renault': [
    { name: 'Kwid', model_code: 'KWI', category: 'Hatchback' },
    { name: 'Triber', model_code: 'TRI', category: 'Minivan' },
    { name: 'Kiger', model_code: 'KIG', category: 'SUV' },
    { name: 'Duster', model_code: 'DUS', category: 'SUV' },
  ],
}

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedCategories() {
  console.log('ℹ️  Seeding vehicle categories...')
  
  const { data, error } = await supabase
    .from('vehicle_category')
    .upsert(VEHICLE_CATEGORIES, { onConflict: 'name', ignoreDuplicates: true })
    .select()

  if (error) {
    console.error('❌ Error seeding categories:', error)
    return null
  }
  
  console.log(`✅ Seeded ${VEHICLE_CATEGORIES.length} vehicle categories`)
  return data
}

async function seedMakes() {
  console.log('ℹ️  Seeding vehicle makes...')
  
  const { data, error } = await supabase
    .from('vehicle_make')
    .upsert(VEHICLE_MAKES, { onConflict: 'name', ignoreDuplicates: true })
    .select()

  if (error) {
    console.error('❌ Error seeding makes:', error)
    return null
  }
  
  console.log(`✅ Seeded ${VEHICLE_MAKES.length} vehicle makes`)
  return data
}

async function seedModels() {
  console.log('ℹ️  Seeding vehicle models...')
  
  // First, get all makes and categories to map names to IDs
  const { data: makes, error: makesError } = await supabase
    .from('vehicle_make')
    .select('id, name')
  
  if (makesError || !makes) {
    console.error('❌ Error fetching makes:', makesError)
    return
  }
  
  const { data: categories, error: catError } = await supabase
    .from('vehicle_category')
    .select('id, name')
  
  if (catError || !categories) {
    console.error('❌ Error fetching categories:', catError)
    return
  }
  
  // Get existing models to avoid duplicates
  const { data: existingModels, error: existingError } = await supabase
    .from('vehicle_model')
    .select('make_id, name')
  
  if (existingError) {
    console.error('❌ Error fetching existing models:', existingError)
    return
  }
  
  const existingSet = new Set(
    (existingModels || []).map(m => `${m.make_id}:${m.name}`)
  )
  
  const makeMap = new Map(makes.map(m => [m.name, m.id]))
  const categoryMap = new Map(categories.map(c => [c.name, c.id]))
  
  let totalInserted = 0
  
  for (const [makeName, models] of Object.entries(VEHICLE_MODELS)) {
    const makeId = makeMap.get(makeName)
    if (!makeId) {
      console.warn(`⚠️  Make "${makeName}" not found, skipping its models`)
      continue
    }
    
    // Filter out models that already exist
    const newModels = models.filter(m => !existingSet.has(`${makeId}:${m.name}`))
    
    if (newModels.length === 0) {
      console.log(`ℹ️  All models for ${makeName} already exist, skipping`)
      continue
    }
    
    const modelsToInsert = newModels.map(m => ({
      make_id: makeId,
      name: m.name,
      model_code: m.model_code,
      vehicle_category: categoryMap.get(m.category) ?? null,
    }))
    
    const { error } = await supabase
      .from('vehicle_model')
      .insert(modelsToInsert)
    
    if (error) {
      console.error(`❌ Error seeding models for ${makeName}:`, error)
    } else {
      totalInserted += newModels.length
      console.log(`✅ Inserted ${newModels.length} models for ${makeName}`)
    }
  }
  
  console.log(`✅ Seeded ${totalInserted} vehicle models total`)
}

async function run() {
  try {
    console.log('🚗 Starting vehicle data seed...\n')
    
    await seedCategories()
    await seedMakes()
    await seedModels()
    
    console.log('\n🎉 Vehicle data seeding completed successfully!')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

run()
