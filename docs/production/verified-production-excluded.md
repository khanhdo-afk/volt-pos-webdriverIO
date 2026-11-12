# Verified Production — excluded issues (team VOLT)

Scanned 2026-11-10 via Linear list_issues (state "Verified Production"): **806 issues**. Included in `verified-production-catalog.json`: **298**. Web cross-surface candidates: **6**. Excluded: **502**.

## Counts per exclusion reason

| Reason                                                                                               | Count |
| ---------------------------------------------------------------------------------------------------- | ----- |
| SS Request "[Request] Ticket …" data edits (edit OD, payroll setup, move tip/service, needs-backend) | 264   |
| Android / P8D / Mobile / Business App                                                                | 27    |
| Portal-only (incl. Report V4 Config page-builder)                                                    | 74    |
| Backend / API / infra / refactor / analytics / legacy pre-project tasks                              | 101   |
| One-off incident / specific-order investigation / data issue                                         | 33    |
| Offline / network-loss (user removed offline TCs)                                                    | 1     |
| Umbrella parent with no own behaviour                                                                | 2     |

Request count is derived (total − included − web − every listed exclusion below). It also includes the SS Request items VP-2965 (guide Add/Edit/Remove Service) and VP-2804 (default tip split request).

## Android / P8D / Mobile / Business App

- VP-5133 — Ticket #1571358 Cancel button while paying on POS Volt Mobile (Android project)
- VP-5485 — [P8D] Card charge fails on FBP, app stuck on Processing
- VP-4799 — [P8D] Compact customer display
- VP-5019 — [P8D] Delete Order offered on order with collected payment
- VP-4928 — [P8D] Blank white screen after reopen
- VP-4511 — Show card last 4 + log failed payment (Android)
- VP-4764 — Other payment accepts amount > due (Android)
- VP-4567 — Receipt printed from P8D is faint
- VP-4506 — Payment-method tag in Order History (Android Issues project)
- VP-4509 — Auto-fill cash amount due (Android Issues project)
- VP-4791 — [POS Android] Add Service has no Gift Card category
- VP-3235 — Scan Gift Card does not show transaction history (Android)
- VP-4890 — [Report V4 - Mobile] Staff Income mobile layout truncates headers
- VP-3155 — Payment Complete receipt fields blurry 1-2s (Android)
- VP-3161 — Card payment missing Total Discount (Android)
- VP-3159 — Item discount/note stacked under product name (Android)
- VP-3212 — [P8D] Missing Order Note
- VP-3216 — [P8D] "Apply Promotion/Re…" truncated
- VP-3196 — [P8D] GitHub repo settings for APK build
- VP-3218 — [P8D] Integrate all methods by Bamboo App
- VP-3190 — P8D: Service Fee display per product
- VP-3260 — Raw i18n key on wrong staff code (Android)
- VP-2002 — P8 Dual POS - Enhancements
- VP-3287 — Business App - show service in staff income
- VP-2961 — Ticket #1469448 Staff income POS vs BA mismatch (BA)
- VP-2962 — Ticket #1470583 BA app shows wrong amounts
- VP-3149 — Ticket #1489592 BA passcode login (Business App)

## Portal-only (incl. Report V4 Config page-builder)

- VP-3261 — [Portal] Separate Discount Setting Promotion/Custom Promotion
- VP-2655 — [Portal] Onboarding integration checks multi gateway
- VP-4590 — [Portal] Checkout Type Setting
- VP-5098 — [UX/UI] Portal Checkout setting layout / Point config in Hybrid
- VP-4974 — [Portal] Checkout setting Point Bonus draft value
- VP-4315 — Download Receipt on Portal Order Detail
- VP-4756 — [PORTAL] Report V4 configuration Internal area
- VP-4863 — [Report Config V4] Config changes not applied on Report V4
- VP-4885 — [Report Config V4] Opens: Staff info overridden by Row Click
- VP-4881 — [Report Config V4] Totals row "No total"
- VP-4873 — [Report Config V4] Number format raw cents
- VP-4871 — [Report Config V4] Text colour not applied
- VP-4870 — [Report Config V4] Value colour no effect
- VP-4869 — [Report Config V4] Rename column loses focus
- VP-4886 — [Report Config V4] Page Name change not reflected in title
- VP-4875 — [Report Config V4] First Save draft not saved
- VP-4872 — [Report Config V4] No working filter for Daily Sale Report
- VP-4834 — [Report V4 Config] Copy for merchant auto-publishes draft
- VP-4857 — Portal Data Verification (umbrella)
- VP-4888 — [Staff Payroll] Export file name wrong range (Portal verification)
- VP-4887 — [Export CSV] only 30 rows exported (Portal verification)
- VP-4889 — [Staff Income Detail] title backslash (Portal verification)
- VP-4846 — [Report V4] Date filter inconsistency (Portal)
- VP-4845 — [Report V4 Config] Publish without confirmation
- VP-4844 — [Report V4 Config] Copy for merchant needs 2 clicks
- VP-4843 — [Report V4 Config] Block Format not updating Preview
- VP-4842 — [Report V4 Config] New block validation
- VP-4841 — [Report V4 Config] Scope/Merchant change clears fields
- VP-4840 — [Report V4 Config] Run preview not locked
- VP-4839 — [Report V4] Open in legacy error (Portal)
- VP-4838 — [Report V4 Config] Duplicate store income fields
- VP-4837 — [Report V4 Config] Report not filtered by Kind
- VP-4836 — [Report V4 Config] Required filter input disappears
- VP-4835 — [Report V4 Config] Run preview E_PARAM
- VP-4833 — [Report V4 Config] Block Save 422
- VP-4832 — [Report V4 Config] Add column shows metadata
- VP-4831 — [Report V4 Config] Try query 400 shown as empty
- VP-4830 — [Report V4 Config] Save as report 400
- VP-4876 — [Report V4 Config] Esc locks page
- VP-4847 — [Report V4 Config] Blocks list no pagination
- VP-4584 — [PORTAL] Receipt Details policy below→above
- VP-1991 — [Portal] Report Template Configuration
- VP-4482 — [Staff Income] Portal wrong report template
- VP-4485 — [Income Summary] Portal field order (sync with POS)
- VP-4488 — [Daily Sale Report] Portal layout 2x2
- VP-3360 — [Portal] Data not real-time across users
- VP-4045 — [PORTAL] Point Configuration
- VP-4295 — [PORTAL] Auth Code on receipt
- VP-4304 — [PORTAL] Customer signature on receipt
- VP-3972 — [Portal] Staff Payroll hides $0 staff
- VP-3826 — [Portal] Passcode Setting for Staff Payroll
- VP-3042 — [Portal] Pause/Resume Publish POS version
- VP-3763 — Passcode Settings switch 422 (Portal parent VP-3253)
- VP-3087 — [Portal] Business Phone from CRM
- VP-1176 — [Portal] Import Service/Product via Excel
- VP-1168 — [Portal] Import Staff via csv
- VP-3139 — [Portal] Staff Payroll current period option
- VP-3253 — [Portal] Improve Passcode Settings
- VP-3133 — [Portal] Staff Payroll current period option (parent)
- VP-3331 — Service tax number setting in Portal
- VP-3296 — Payroll Check MICR alignment (Portal)
- VP-3295 — Payroll Check detail $0.00 (Portal)
- VP-3053 — [Payroll Check] UI/Print layout (Portal)
- VP-1178 — Portal Advanced Export Service/Product
- VP-3312 — Remote Actions tab in Volt Monitor
- VP-2558 — Payroll rerun tool page
- VP-1180 — Portal Advanced Export Staff
- VP-3043 — [Portal] Pay 1/Pay 2 logic
- VP-3153 — Investigate duplicate staff code (Portal)
- VP-2236 — [Portal & POS] Apply Staff Compensation to current period (Portal label)
- VP-1219 — Check number in Check History
- VP-1220 — [BE] Check History support
- VP-1232 — [FE] Payroll - Update UI
- VP-1270 — Onboarding integration connectivity gate

## Backend / API / infra / refactor / analytics / legacy pre-project tasks

- VP-4447 — [POS] Sync pull batching (TechDebt)
- VP-4755 — feat: order support permission (API)
- VP-4761 — refactor: order support cleanup
- VP-4517 — [MCP] Change order recorded date
- VP-4518 — [MCP] Split one service line among staff
- VP-4556 — [BE] GCI service CDC FK violation
- VP-3255 — [API] Passcode Settings
- VP-3315 — [BE] Split Discount Setting
- VP-3214 — [POS] Remove legacy card code path
- VP-3231 — [POS] Remove demo mode
- VP-3304 — [POS] Limit concurrent table pulls
- VP-2647 — [POS] Update upstream env domains
- VP-2665 — [BE] Update api Import Staff
- VP-2800 — category_priority display_order (API)
- VP-3143 — fix(syncing) reuse deleted staff code (API)
- VP-3163 — Tip Details Method for Report V2 (API)
- VP-3165 — [POS] Fix failing unit tests
- VP-3180 — Caddy response_buffers
- VP-4004 — [POS] Duplicate order.total push refused (sync internals)
- VP-3400 — [POS] Negative tax_amount breaking sync push 422 (internal)
- VP-3428 — Pull-side conflict resolution strategy
- VP-2735 — [POS] Splash crash panic SplashState::Error (startup internals)
- VP-2711 — Receipt link DNS error on dev domain (env)
- VP-3293 — [POS] PostHog error tracking
- VP-3290 — [POS] PostHog auto pageview
- VP-3291 — [POS] PostHog business events
- VP-3288 — PostHog Cloud setup
- VP-2340 — Merchant usage data for CRM
- VP-3289 — [POS] posthog-js init
- VP-3367 — [POS] Move report screen-view tracking
- VP-3294 — HogQL handover for CRM
- VP-1191 — [BE] Export Staff api
- VP-1203 — Batch History data on Production
- VP-1204 — [BE] Support (Batch History)
- VP-1228 — [BE] Merchant note field
- VP-1356 — [RUST] Income Summary Daily
- VP-1452 — [BE] Payroll rerun background task
- VP-1457 — [BUG] Income Summary (legacy, no detail)
- VP-1777 — [Chore] release automation skills
- VP-1836 — [RUST] Report Staff Today
- VP-1850 — [BE] Report Version 2
- VP-1964 — Filter date order vs order item (BE)
- VP-2014 — include_appointments true
- VP-2026 — [DISCUSS] Report/Income/Payroll issues
- VP-132 — Add Tip (legacy epic child)
- VP-136 — Implement Volt Graphql
- VP-140 — Order transaction tip amount
- VP-284 — Implement GiftCard (legacy epic)
- VP-349 — Stream Data Fastboy Payment
- VP-408 — Birthday (legacy)
- VP-411 — Database user_input in Order
- VP-422 — Connection
- VP-500 — Todolist
- VP-501 — Ticket for Settings site
- VP-503 — Huddle with Duy
- VP-502 — Check todolist
- VP-510 — Update UI About
- VP-516 — Staff Change Requirement
- VP-517 — [BE][PHP] Staff Change Requirement
- VP-518 — [BE][RUST] Staff Change Requirement
- VP-545 — logic_type/logic_value fields
- VP-585 — [BE] Fix redeem
- VP-594 — [BE][PHP] Cancel Order
- VP-598 — [BE][PHP] Benthos payment streams
- VP-600 — [BE][RUST] Remove reference id
- VP-601 — [PHP] GoCheckin API ID source
- VP-607 — [BE][PHP] Defaults staff/service
- VP-609 — [BE][PHP] birthday type
- VP-610 — [BE][RUST] birthday type
- VP-613 — Restore relationship constraints
- VP-615 — [PHP] Merchant 14 for SMS
- VP-621 — [BE][PHP] Pull DTS category
- VP-628 — Remove Pullable for Ref_id
- VP-639 — [BE] Regression getter/setter
- VP-710 — [BE] Time Tracking
- VP-756 — [BE] remote_updated_at
- VP-768 — [BE] Stream card info
- VP-769 — [BE] Order status mismatch
- VP-777 — [BE] Settle order logic
- VP-896 — [BE] Total Orders
- VP-898 — [PHP] Snap items on refund
- VP-899 — [BE][PHP] Batch Close Open
- VP-901 — [BE][PHP] Adjust tip
- VP-903 — giftCardNumber on payment flow
- VP-904 — [PHP] Sync realtime batch open
- VP-914 — [PHP] Refundable amount per item
- VP-918 — [BE][PHP] Merchant package assignment
- VP-1025 — [BE] Sync timezone
- VP-1037 — [BE] Check syncing workflow
- VP-1040 — [BE] API Receipt Settings
- VP-1042 — GH action CI/CD
- VP-1069 — [BE] Pushable Role
- VP-1077 — [BE] Role permission validation
- VP-1089 — First Release Testing (umbrella)
- VP-1102 — Onboarding POST sync DTS
- VP-1107 — Remove Gift card category (legacy)
- VP-1114 — [BE] Sync Customer Group
- VP-1172 — Stream Note for Appointment
- VP-1186 — [FE] Multi Country/State select (surface unclear)
- VP-1197 — [BE] order-id on Appointment
- VP-1488 — Notification Improvement (no detail)

## One-off incident / specific-order investigation / data issue

- VP-4435 — Ticket #1551289 Store income off by $20 on 06/10
- VP-4334 — Ticket #1544430 OD261003-00000975 Pending though charged
- VP-2963 — Ticket #1478533 Declined but card charged
- VP-4193 — Ticket #1539515 Staff Tom missing on Volt POS
- VP-3701 — Ticket #1515649 Apple Card processing, no OD
- VP-3624 — Pending — OD260828-84292153 investigation
- VP-3397 — Lost order after $65 card payment
- VP-2403 — OD260707-12050342 not in any report
- VP-2825 — Ticket #1474546 Successful order but payment Failed
- VP-2828 — Card success on FBP but POS Failed → double charge (4 stores)
- VP-2837 — Resolve 19 double-charged orders (+19 child tickets VP-2838..2856)
- VP-3063 — Ticket #1485382 Payment details missing successful card
- VP-3278 — Ticket #1497275 Order stuck Canceling during batch close
- VP-2910 — Payroll not syncing staff income (data)

## Offline / network-loss (user removed offline TCs)

- VP-5225 — [POS] GAP pending order: offline at payment → no points after reconnect

## Umbrella parent with no own behaviour

- VP-4848 — POS Data Verification (children VP-4849..4853, 4936..4939 included)
- VP-1870 — [Portal/POS/B.App] Report Template Configuration (POS child VP-1992 included)

## Web cross-surface candidates (GoCheckin / GAP → POS)

Not in the POS-only catalog. They can be tested with the web lane (GoCheckin / GAP) plus a POS check.

- VP-4823 — [Tiệm 14] GoCheckin kiosk check-in OK but no pending order on Volt POS (1/18 lost). Idea: Check in on GoCheckin kiosk/web → order appears in POS Pending Orders.
- VP-5496 — Ticket #1578719 GCI — staff missing when choosing staff at check-in. Idea: GoCheckin staff picker lists all active POS staff.
- VP-4433 — Ticket #1549684 Unknown/Cancelled appointment blocks slot, not visible on GAPAPP Booking. Idea: Cancelled appointment in POS frees the slot on GAP booking.
- VP-4323 — Ticket #1543596 GCI check-in not syncing reliably to Volt POS. Idea: Repeated GoCheckin check-ins all reach POS Pending Orders.
- VP-3038 — Ticket #1484041 Reward Points from GCI not synced to Volt POS. Idea: GCI reward points match POS customer points.
- VP-3061 — Ticket #1484861 Customers imported to GCI: points not synced to POS. Idea: Imported GCI customer shows correct points on POS.

Related POS items already in the catalog that also involve another surface: VP-3536 (appointment notification), VP-3449 / VP-3195 (DTS/GCI staff and service sync), VP-3974 / VP-3302 (DTS reward settings), VP-3762 (Passcode Settings POS→Portal), VP-3181 (Portal remote actions).
