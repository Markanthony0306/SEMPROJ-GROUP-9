# Graph Report - src  (2026-11-25)

## Corpus Check
- 81 files · ~70,055 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .css 16)

## Summary
- 332 nodes · 1058 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Dashboard Navigation and Activity
- Authentication Screens and Routing
- Identity and API Sessions
- Shared Tables and Administration
- Analytics Charts and Theme
- Gorilla Assistant Interactions
- Reports and Payment Exports
- Dialogs and Mobile Navigation
- Member Identity Capture
- Attendance and QR Scanning
- Member QR Code Caching
- Night Landscape Assets
- Day Landscape WebP Asset
- Membership Plan Choices
- Day Landscape JPEG Asset

## God Nodes (most connected - your core abstractions)
1. `apiRequest()` - 48 edges
2. `useAuth()` - 32 edges
3. `UserPage()` - 26 edges
4. `AdminStaffPage()` - 24 edges
5. `Icon()` - 22 edges
6. `Dialog()` - 20 edges
7. `GorillaProvider()` - 17 edges
8. `DataTable()` - 16 edges
9. `CreateMemberSheet()` - 16 edges
10. `membershipState()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `apiRequest()`  [EXTRACTED]
  App.jsx → utils/api.js
- `AccountDeleteDialog()` --calls--> `useAuth()`  [EXTRACTED]
  components/AccountDeleteDialog.jsx → auth/AuthContext.jsx
- `AdminAnalytics()` --calls--> `useAuth()`  [EXTRACTED]
  components/admin/analytics/AdminAnalytics.jsx → auth/AuthContext.jsx
- `AdminReports()` --calls--> `useAuth()`  [EXTRACTED]
  components/AdminReports.jsx → auth/AuthContext.jsx
- `CloudAccountLinkForm()` --calls--> `useAuth()`  [EXTRACTED]
  components/CloudAccountLinkForm.jsx → auth/AuthContext.jsx

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "Dashboard Navigation and Activity"
Cohesion: 0.10
Nodes (37): ActivityChart(), AdminDashboardSection(), AdminSettingsSection(), AdminNotifications(), recordedAt(), ADMIN_NAVIGATION, bannerStyles, Brand() (+29 more)

### Community 1 - "Authentication Screens and Routing"
Cohesion: 0.09
Nodes (31): AdminStaffPage, App(), ChangePasswordPage, ForgotPassword, GorillaProvider, Login, NotFound, readRoute() (+23 more)

### Community 2 - "Identity and API Sessions"
Cohesion: 0.10
Nodes (23): AuthContext, AuthProvider(), readSession(), CloudAccountLinkForm(), CreatedMemberCredentials(), FacialLoginChallenge(), STAGES, useEventStream() (+15 more)

### Community 3 - "Shared Tables and Administration"
Cohesion: 0.15
Nodes (21): Modal(), AdminEquipmentSection(), AdminMemberDialogs(), AdminMembersSection(), AdminOperationsDialogs(), AdminPaymentsSection(), AdminStaffDialogs(), CreateMemberSheet (+13 more)

### Community 4 - "Analytics Charts and Theme"
Cohesion: 0.19
Nodes (17): AdminAnalytics(), useAnalyticsResource(), validPayload, AttendanceChart(), ChartCard(), MembershipStatusChart(), PaymentMethodsChart(), monthStart() (+9 more)

### Community 5 - "Gorilla Assistant Interactions"
Cohesion: 0.11
Nodes (18): expressions, GorillaArt(), ALERT_SECTIONS, avoidMobileActions(), bubblePosition(), clamp(), constrain(), DESTINATIONS (+10 more)

### Community 6 - "Reports and Payment Exports"
Cohesion: 0.19
Nodes (13): AdminReports(), RecordForm(), activityBuckets(), calendarDate(), csvCell(), downloadCsv(), downloadCsvRows(), downloadPayments() (+5 more)

### Community 7 - "Dialogs and Mobile Navigation"
Cohesion: 0.17
Nodes (14): AccountDeleteDialog(), DashboardSheetContext, Dialog(), flagField(), RockyDeleteError(), BottomNav(), BottomSheet(), activitySections (+6 more)

### Community 8 - "Member Identity Capture"
Cohesion: 0.22
Nodes (10): CreateMemberSheet(), captureCloseup(), captureTurn(), goBack(), moveTo(), resetIdScan(), submitDetails(), uploadIdFile() (+2 more)

### Community 9 - "Attendance and QR Scanning"
Cohesion: 0.39
Nodes (6): AdminAttendanceSection(), isFitPulseToken(), PhysicalQrScanner(), finishScan(), handleKeyDown(), WebcamQrScanner()

### Community 10 - "Member QR Code Caching"
Cohesion: 0.57
Nodes (6): MemberQr(), cacheKey(), getMemberQr(), inFlight, membershipPeriod(), readCachedMemberQr()

### Community 11 - "Night Landscape Assets"
Cohesion: 0.40
Nodes (6): Voxel night sky illustration, Dark block-shaped mountain silhouettes, Block-style night landscape image, Stars across a dark blue night sky, Deep blue starry night sky, Block-shaped pale blue clouds

### Community 12 - "Day Landscape WebP Asset"
Cohesion: 0.40
Nodes (5): Blue Sky, Daytime Voxel Landscape, Rocky Mountains, Voxel Visual Style, White Clouds

### Community 14 - "Day Landscape JPEG Asset"
Cohesion: 0.50
Nodes (4): White block-shaped clouds against a blue daytime sky, Daytime voxel sky and mountain image, Dark block-shaped mountain peaks in the lower right, Voxel art

## Knowledge Gaps
- **9 isolated node(s):** `Voxel art`, `White block-shaped clouds against a blue daytime sky`, `Dark block-shaped mountain peaks in the lower right`, `White Clouds`, `Blue Sky` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 59 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiRequest()` connect `Identity and API Sessions` to `Dashboard Navigation and Activity`, `Authentication Screens and Routing`, `Shared Tables and Administration`, `Analytics Charts and Theme`, `Gorilla Assistant Interactions`, `Reports and Payment Exports`, `Dialogs and Mobile Navigation`, `Member Identity Capture`, `Member QR Code Caching`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **What connects `Voxel art`, `White block-shaped clouds against a blue daytime sky`, `Dark block-shaped mountain peaks in the lower right` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Navigation and Activity` be split into smaller, more focused modules?**
  _Cohesion score 0.09966329966329966 - nodes in this community are weakly interconnected._
- **Why does `CreateMemberSheet()` connect `Member Identity Capture` to `Identity and API Sessions`, `Shared Tables and Administration`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Authentication Screens and Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.09142857142857143 - nodes in this community are weakly interconnected._
- **Why does `useAuth()` connect `Authentication Screens and Routing` to `Dashboard Navigation and Activity`, `Identity and API Sessions`, `Shared Tables and Administration`, `Analytics Charts and Theme`, `Gorilla Assistant Interactions`, `Reports and Payment Exports`, `Dialogs and Mobile Navigation`, `Member QR Code Caching`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `Identity and API Sessions` be split into smaller, more focused modules?**
  _Cohesion score 0.10384068278805121 - nodes in this community are weakly interconnected._

Graph health warning: 75 dangling-endpoint edges, 10 self-loops, 14 undirected same-endpoint collapses. Some shared modules are outside the requested src scope; extraction may be incomplete.

Token cost: actual host-agent input/output usage was unavailable. Reported zeros are unknown usage, not a claim of free semantic extraction. AST extraction required no model API calls.

graphify-out/ was written into the working tree and is not currently ignored. Commit only outputs your team should share, or add this folder to .gitignore.
