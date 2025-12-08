# Job Lifecycle Guardrails

## Overview
Implemented comprehensive guardrails to enforce proper job status transitions and payment validation across the application.

## Status Lifecycle Flow
```
received <-> working <-> ready -> completed
```
- Jobs can move **bidirectionally** between `received`, `working`, and `ready`
- Jobs can only move **forward** from `ready` to `completed` (one-way)
- Once `completed`, status is **LOCKED** and cannot be changed

## Guardrails Implemented

### 1. Status Transition Rules
**Valid transitions by current status:**
- `received`: Can move to `received` or `working`
- `working`: Can move to `received`, `working`, or `ready`
- `ready`: Can move to `working`, `ready`, or `completed`
- `completed`: **LOCKED** - Cannot change to any other status

### 2. Payment Validation
- Before completing a job (status → `completed`):
  - System checks if an invoice exists
  - If invoice has unpaid balance (`balance > 0`), prevents completion
  - Shows `UnpaidWarningModal` with option to mark as paid
  - Only allows completion after payment is confirmed

### 3. Where Guardrails Apply

#### a) Job Card Dropdown (`job-card.tsx`)
- Status dropdown shows only valid transitions
- Invalid options are disabled and marked "Locked"
- Current status is highlighted

#### b) Job Details Dropdown (`job-details.tsx`)
- Same validation as job card
- Consistent UX across both interfaces

#### c) Drag-and-Drop (`job-board.tsx`)
- Validates transition before optimistic UI update
- Prevents dragging to invalid status columns
- Shows console warning if invalid drop attempted

#### d) API Level (`app/page.tsx` - `handleStatusChange`)
- Final validation layer for all status changes
- Checks transition validity
- Validates payment before completion
- Shows appropriate error messages

## Implementation Details

### Validation Function
```typescript
const validateStatusTransition = (fromStatus: string, toStatus: string): boolean => {
  const validTransitions: Record<string, string[]> = {
    'received': ['received', 'working'],
    'working': ['working', 'ready'],
    'ready': ['ready', 'completed'],
    'completed': ['completed'], // Cannot change from completed
  }
  return validTransitions[fromStatus]?.includes(toStatus) ?? false
}
```

### Payment Check
```typescript
if (newStatus === 'completed' && oldStatus !== 'completed') {
  const invoice = await InvoiceService.getInvoiceByJobId(jobId)
  
  if (invoice && invoice.balance && invoice.balance > 0) {
    // Show unpaid warning modal
    setPendingCompletion({ jobId, invoiceId, balance, jobNumber })
    setShowUnpaidWarning(true)
    return // Block status change
  }
  
  if (!invoice) {
    alert('Cannot complete job: No invoice found.')
    return
  }
}
```

## User Experience

### Status Dropdown Behavior
- Valid next statuses: **Enabled** with colored badge
- Current status: **Highlighted** with accent background
- Invalid statuses: **Disabled** + grayed out + "Locked" label

### Drag-and-Drop Behavior
- Valid drops: Optimistic UI update → API call → Success
- Invalid drops: No visual update, console warning logged
- Payment blocked: Shows modal with payment options

### Error Messages
- **Invalid transition**: "Cannot change status from [X] to [Y]"
- **Completed locked**: "Cannot change status of a completed job"
- **Unpaid invoice**: Shows modal with balance and payment options
- **No invoice**: "Cannot complete job: No invoice found"

## Files Modified

1. **components/features/jobs/job-card.tsx**
   - Added `getValidTransitions()` function
   - Filtered status dropdown options
   - Added disabled state styling

2. **components/features/jobs/job-details.tsx**
   - Same validation as job-card
   - Consistent guardrails implementation

3. **components/features/jobs/job-board.tsx**
   - Added `validateStatusTransition()` in drag handler
   - Prevents invalid drops before optimistic update

4. **app/page.tsx**
   - Enhanced `handleStatusChange()` with validation
   - Added `validateStatusTransition()` helper
   - Payment check before completion
   - Comprehensive error handling

## Testing Checklist

- [ ] Cannot change from `received` to `ready` (dropdown)
- [ ] Cannot change from `received` to `completed` (dropdown)
- [ ] Cannot change from `completed` to any other status (dropdown)
- [ ] Cannot drag job from `completed` to `working`
- [ ] Cannot complete job with unpaid invoice (dropdown)
- [ ] Cannot complete job with unpaid invoice (drag-drop)
- [ ] Can mark paid and complete in one action
- [ ] Valid transitions work smoothly (dropdown)
- [ ] Valid transitions work smoothly (drag-drop)
- [ ] Optimistic UI updates correctly

## Benefits

✅ **Data Integrity**: Prevents invalid job state transitions
✅ **Payment Enforcement**: Ensures jobs are paid before completion
✅ **User Guidance**: Clear visual feedback on valid actions
✅ **Consistency**: Same rules across all interaction methods
✅ **Error Prevention**: Proactive blocking vs reactive errors
✅ **Audit Trail**: Proper job lifecycle progression

## Future Enhancements

- Add visual feedback (shake animation) when invalid drop attempted
- Log status transition attempts for audit purposes
- Add role-based override capabilities (admin can force transitions)
- Email notifications when job reaches "ready" or "completed"
