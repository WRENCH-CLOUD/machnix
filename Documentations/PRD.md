WrenchCloud – Product Requirements Document (PRD)
1. Product Overview
Product Name: WrenchCloud
WrenchCloud is a multi-tenant SaaS platform for automobile garages, designed to replace paper-based job cards and fragmented Excel workflows with a unified, digital system. The product focuses on job tracking, customer engagement, and billing accuracy, while laying the foundation for future automation and scale.
The platform is built as a startup SaaS, with optional white-labeled dashboards that allow tenants (garage owners) to feel ownership over their workspace.
The paying customer is the garage owner, who may operate one or multiple garages.
________________________________________
2. Target Users
Primary User (v1)
•	Garage Owner / Manager
o	Operates a mid-sized garage
o	Up to ~10 mechanics
o	Handles customer interaction, job approval, and billing
Explicitly Excluded in v1
•	Mechanics (no direct system access)
•	Front-desk-only roles
•	Finance-only or analyst-only roles
________________________________________
3. Current State & Problem Statement
Current Workflow
•	Job cards are written on paper
•	Data is later copied into Excel (often incomplete or delayed)
•	Estimates and invoices are manually prepared
•	Customer communication is informal and inconsistent
Key Problems
1.	Paper overload – job cards, DVIs, and invoices are hard to manage
2.	Billing gaps – mismatch between work done and what gets billed
3.	No visibility – owners lack a clear view of jobs, revenue, and performance
4.	Customer drop-off – no structured engagement after service completion
“Managing so much paper every day and still having gaps in billing is exhausting.”
________________________________________
4. Value Proposition
WrenchCloud provides: - A single system for job cards, vehicles, customers, and billing - Better tracking of jobs from intake to completion - Improved customer engagement, reducing repeat-customer loss - Cleaner, professional records instead of scattered paper and spreadsheets
Primary Value Drivers
•	Better tracking and visibility
•	Customer engagement
Consequence of Not Using WrenchCloud
•	Operational chaos
•	Lost or unbilled work
•	No historical data
•	Reduced customer retention
________________________________________
5. Product Scope – Version 1 (Must-Have)
Included in v1
•	Job Cards
•	Customer & Vehicle CRM
•	Estimates
•	Invoices
•	Analytics Dashboard (basic business insights)
Explicitly Excluded from v1
•	Digital Vehicle Inspection (DVI) checklists
•	Payments integration (UPI/Card/Cash tracking only, no gateway logic)
•	WhatsApp or notification updates
•	Mechanic logins
•	Multi-level roles (front desk, sub-admins)
•	Scheduling / appointment system
•	Customer mobile app
•	Enterprise features for large garage chains
These features are intentionally deferred to avoid over-scoping.
________________________________________
6. User Roles & Permissions (v1)
Platform Admin
•	Manages tenants (garages)
•	Views system-wide analytics
•	No operational involvement in day-to-day garage work
Tenant (Garage Owner / Manager)
•	Creates and manages job cards
•	Manages customers and vehicles
•	Approves estimates
•	Generates invoices
•	Views analytics for their garage
Mechanics are completely excluded in v1.
________________________________________
7. Job Lifecycle (Real-World Flow)
The job lifecycle in WrenchCloud mirrors actual garage operations, not an idealized process.
Current Real-World Flow
1.	Customer arrives with vehicle
2.	Vehicle is inspected and test-driven
3.	Notes and required parts are identified
4.	An estimate is prepared
5.	Owner/manager approves the estimate
6.	Work is completed
7.	Owner informs the customer
8.	Customer pays
9.	Customer receives an invoice and collects the vehicle
v1 Rules
•	A job cannot exist without a job card
•	A job cannot start without a job card
•	Job completion requires billing to be completed
•	Estimate approval is done by the owner or manager only
________________________________________
8. Estimates & Billing
•	Estimates are generated based on inspection and parts
•	Estimates must be approved before final billing
•	Invoices are generated after work completion
•	Payment methods supported conceptually:
o	Cash
o	UPI
o	Card
Explicit Constraints
•	No partial payments in v1
•	No refunds in v1
________________________________________
9. Analytics & Insights (v1)
Garages may view: - Number of jobs completed - Revenue summaries - Basic operational metrics
Advanced analytics and forecasting are deferred.
________________________________________
10. Multi-Tenancy & Branding
•	WrenchCloud is multi-tenant by design to reduce development cost and speed up iteration
•	Each tenant’s data is isolated
•	Optional branding support:
o	Some tenants may want their own branding
o	Others may use default WrenchCloud branding
User Constraints
•	A platform user belongs to only one garage in v1
•	Multi-garage user access is deferred
________________________________________
11. Success Metrics
Product Success
•	At least 10 active tenants by March v2 launch
•	High tenant feedback satisfaction
•	95% uptime during pilot phase
Failure Indicators
•	Frequent bugs or system instability
•	Low tenant adoption or usage
•	Negative tenant feedback
________________________________________
12. Release Timeline
•	Pilot Start: Late December / January
•	Feedback Iteration: January–February
•	Version 2 Launch: March
•	Target Adoption: 10+ tenants
________________________________________
13. Constraints & Considerations
•	Product is intended to evolve into a startup-scale SaaS
•	Sensitive user and business data is involved
•	Security, privacy, and data isolation are critical
•	Compliance considerations may arise (HIPAA-like sensitivity due to customer data), to be evaluated further
________________________________________
14. Out of Scope (Explicit)
Anything not listed in v1 scope is considered out of scope unless formally added through a future PRD revision.
________________________________________
15. Guiding Principle
WrenchCloud v1 prioritizes clarity, billing accuracy, and customer engagement over feature breadth.
