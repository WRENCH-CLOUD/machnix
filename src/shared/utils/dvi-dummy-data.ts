// Dummy DVI data generator for job cards
// This provides realistic inspection items when DVI functionality is not yet implemented

export interface DummyDVIItem {
  id: string
  category: string
  name: string
  status: 'good' | 'attention' | 'urgent' | 'pending'
  note?: string
}

export interface DummyPart {
  id: string
  name: string
  partNumber: string
  quantity: number
  unitPrice: number
  laborCost: number
}

export interface DummyActivity {
  id: string
  timestamp: Date
  type: string
  description: string
  user: string
}

const dviCategories = {
  brakes: [
    { name: 'Front Brake Pads', note: 'Within acceptable range' },
    { name: 'Rear Brake Pads', note: 'Good condition' },
    { name: 'Brake Fluid Level', note: 'Topped up' },
    { name: 'Brake Lines', note: 'No leaks detected' },
    { name: 'Parking Brake', note: 'Operating correctly' },
  ],
  engine: [
    { name: 'Engine Oil Level', note: 'At optimal level' },
    { name: 'Engine Oil Condition', note: 'Clean, no contamination' },
    { name: 'Air Filter', note: 'Clean, good airflow' },
    { name: 'Coolant Level', note: 'Within range' },
    { name: 'Belt Condition', note: 'No cracks or wear' },
    { name: 'Battery Condition', note: 'Good charge' },
  ],
  tires: [
    { name: 'Front Left Tire', note: 'Tread depth 6mm' },
    { name: 'Front Right Tire', note: 'Tread depth 6mm' },
    { name: 'Rear Left Tire', note: 'Tread depth 5mm' },
    { name: 'Rear Right Tire', note: 'Tread depth 5mm' },
    { name: 'Tire Pressure', note: 'All tires at recommended PSI' },
  ],
  suspension: [
    { name: 'Front Shock Absorbers', note: 'No leaks, functioning well' },
    { name: 'Rear Shock Absorbers', note: 'No leaks, functioning well' },
    { name: 'Ball Joints', note: 'No play detected' },
    { name: 'Tie Rod Ends', note: 'Secure, no wear' },
  ],
  electrical: [
    { name: 'Headlights', note: 'All functioning' },
    { name: 'Tail Lights', note: 'All functioning' },
    { name: 'Turn Signals', note: 'All functioning' },
    { name: 'Horn', note: 'Working properly' },
    { name: 'Wiper System', note: 'Blades in good condition' },
  ],
  fluids: [
    { name: 'Transmission Fluid', note: 'Level and condition good' },
    { name: 'Power Steering Fluid', note: 'Level adequate' },
    { name: 'Windshield Washer Fluid', note: 'Topped up' },
  ],
}

const statusOptions: ('good' | 'attention' | 'urgent' | 'pending')[] = ['good', 'attention', 'urgent', 'pending']

/**
 * Generate dummy DVI items for a job card
 * @param templateType - Type of DVI template ('full', 'quick', 'brake', etc.)
 * @param jobId - ID of the job for unique item IDs
 * @returns Array of dummy DVI items
 */
export function generateDummyDVIItems(templateType: string = 'full', jobId: string = 'default'): DummyDVIItem[] {
  const items: DummyDVIItem[] = []
  let counter = 1

  switch (templateType.toLowerCase()) {
    case 'full':
    case 'full vehicle inspection':
      // Include all categories
      Object.entries(dviCategories).forEach(([category, categoryItems]) => {
        categoryItems.forEach((item) => {
          items.push({
            id: `dvi_${jobId}_${counter++}`,
            category: category.charAt(0).toUpperCase() + category.slice(1),
            name: item.name,
            status: getRandomStatus(),
            note: item.note,
          })
        })
      })
      break

    case 'quick':
    case 'quick service check':
      // Include only essential items
      items.push(
        {
          id: `dvi_${jobId}_${counter++}`,
          category: 'Engine',
          name: 'Engine Oil Level',
          status: 'good',
          note: 'At optimal level',
        },
        {
          id: `dvi_${jobId}_${counter++}`,
          category: 'Engine',
          name: 'Air Filter',
          status: 'good',
          note: 'Clean',
        },
        {
          id: `dvi_${jobId}_${counter++}`,
          category: 'Fluids',
          name: 'Coolant Level',
          status: 'good',
          note: 'Within range',
        },
        {
          id: `dvi_${jobId}_${counter++}`,
          category: 'Brakes',
          name: 'Brake Fluid Level',
          status: 'good',
          note: 'Adequate',
        },
        {
          id: `dvi_${jobId}_${counter++}`,
          category: 'Tires',
          name: 'Tire Pressure',
          status: 'good',
          note: 'All tires at recommended PSI',
        },
      )
      break

    case 'brake':
    case 'brake system inspection':
      // Include only brake-related items
      dviCategories.brakes.forEach((item) => {
        items.push({
          id: `dvi_${jobId}_${counter++}`,
          category: 'Brakes',
          name: item.name,
          status: getRandomStatus(['good', 'attention']),
          note: item.note,
        })
      })
      break

    default:
      // Default to a minimal set
      items.push(
        {
          id: `dvi_${jobId}_${counter++}`,
          category: 'General',
          name: 'Visual Inspection',
          status: 'pending',
          note: 'Awaiting inspection',
        }
      )
  }

  return items
}

/**
 * Generate dummy parts for a job
 */
export function generateDummyParts(): DummyPart[] {
  // Return empty array - parts should be added manually
  return []
}

/**
 * Generate dummy activity timeline for a job
 */
export function generateDummyActivities(
  jobNumber: string,
  createdAt: Date,
  status: string,
  mechanicName?: string
): DummyActivity[] {
  const activities: DummyActivity[] = [
    {
      id: `act_1`,
      timestamp: createdAt,
      type: 'status_change',
      description: `Job ${jobNumber} created and received`,
      user: 'Front Desk',
    },
  ]

  if (mechanicName) {
    activities.push({
      id: `act_2`,
      timestamp: new Date(createdAt.getTime() + 30 * 60000), // 30 minutes later
      type: 'assignment',
      description: `Assigned to ${mechanicName}`,
      user: 'Front Desk',
    })
  }

  if (status !== 'received') {
    activities.push({
      id: `act_3`,
      timestamp: new Date(createdAt.getTime() + 60 * 60000), // 1 hour later
      type: 'status_change',
      description: `Status changed to ${status}`,
      user: mechanicName || 'System',
    })
  }

  return activities
}

/**
 * Get a random status with optional allowed statuses
 */
function getRandomStatus(
  allowedStatuses: ('good' | 'attention' | 'urgent' | 'pending')[] = statusOptions
): 'good' | 'attention' | 'urgent' | 'pending' {
  // Weighted towards 'good' for realistic results
  const weights = {
    good: 0.6,
    attention: 0.2,
    urgent: 0.05,
    pending: 0.15,
  }

  const random = Math.random()
  let cumulative = 0

  for (const [status, weight] of Object.entries(weights)) {
    if (allowedStatuses.includes(status as any)) {
      cumulative += weight
      if (random <= cumulative) {
        return status as 'good' | 'attention' | 'urgent' | 'pending'
      }
    }
  }

  return allowedStatuses[0]
}

/**
 * Convert database job to UI format with dummy data
 */
export function enrichJobWithDummyData(job: any): any {
  // Ensure we have DVI items
  const dviItems = job.dviItems && job.dviItems.length > 0
    ? job.dviItems
    : generateDummyDVIItems(job.dviTemplate || 'full', job.id)

  // Ensure we have parts (default to empty)
  const parts = job.parts || []

  // Ensure we have activities
  const activities = job.activities && job.activities.length > 0
    ? job.activities
    : generateDummyActivities(
        job.job_number || job.jobNumber,
        new Date(job.created_at || job.createdAt),
        job.status,
        job.mechanic?.name
      )

  return {
    ...job,
    dviItems,
    parts,
    activities,
    // Ensure these fields exist with fallbacks
    laborTotal: job.laborTotal || 0,
    partsTotal: job.partsTotal || 0,
    tax: job.tax || 0,
    dviPending: job.dviPending !== undefined ? job.dviPending : dviItems.some((item: DummyDVIItem) => item.status === 'pending'),
    dviTemplate: job.dviTemplate || 'Full Vehicle Inspection',
  }
}
