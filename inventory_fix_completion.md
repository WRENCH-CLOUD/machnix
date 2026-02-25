# Inventory Fix Implementation

## Summary
The issue where inventory items were not showing up in the "Add New Items" dropdown has been addressed by:
1.  **Refactoring Data Fetching**: Moved the `useInventoryItems` hook call from the child `JobParts` component to the parent `JobDetailsContainer`. This ensures data is fetched reliably at the page level and passed down as props.
2.  **Debug Verification**: Added a temporary debug indicator in the UI (next to "Add New Items" title) to show the loading status and item count (e.g., `(5 items available)`).

## Verification Steps
1.  Reload the Job Details page.
2.  Check the "Add New Items" card title.
    *   If it shows `(Loading...)` then `(Error loading)`, there is a backend/network issue.
    *   If it shows `(0 items available)`, the database has no inventory items for your tenant.
    *   If it shows `(X items available)`, the data is loaded correctly.
3.  Click "Select part..." to search and select items.

## Implementation Details
- Modified `src/components/tenant/jobs/job-details-container.tsx` to fetch inventory items.
- Modified `src/components/tenant/jobs/job-details-dialog.tsx` to accept and pass inventory props.
- Modified `src/components/tenant/jobs/job-parts.tsx` to use props instead of internal hook.

Please verify the fix in the application.
