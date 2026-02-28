# Moon Textile ERP — Senior Industry Audit & Roadmap

> **Date**: 28 Feb 2026 · **Auditor Role**: Senior ERP Architect  
> This document is a complete code-verified audit of both the backend (`moon_fashion_express_class`) and frontend (`erp-textile`), grading each module with an honest **readiness score** and a prioritized implementation roadmap.

---

## Executive Summary

| Metric | Count |
|---|---|
| Backend Modules | 17 |
| Frontend Page Groups | 12 |
| Prisma Models | 20+ |
| Database Provider | PostgreSQL |
| Architecture | Double-Entry Accounting (JournalEntry → JournalLine) |

Your ERP has a **strong foundation** — the double-entry accounting engine (`createDraft` → `postEntry` with Debit/Credit balancing) is industry-grade. But several frontend pages are **displaying fake/mock data**, creating a gap between what the backend can do and what the user actually sees.

---

## Module-by-Module Audit

### ✅ FULLY OPERATIONAL (Backend + Frontend Live)

| # | Module | Backend | Frontend | Notes |
|---|---|---|---|---|
| 1 | **User Management** | `User` module (Auth, OTP, RBAC) | `/users` — CRUD + role control | Complete with module-based permissions |
| 2 | **Buyer Management** | `Buyer` module | `/buyers` — CRUD | Includes buyer→order→invoice chain |
| 3 | **Supplier Management** | `Supplier` module | `/suppliers` — CRUD | Full entity with ledger links |
| 4 | **Order Management** | `Order` module (Fabric, Label, Carton) | `/order-management/orders` — CRUD + 3 product types | Production-grade with polymorphic items |
| 5 | **Proforma Invoice** | `Invoice` module | `/invoice-management/invoices` — CRUD | Linked to Orders and Invoice Terms |
| 6 | **Invoice Terms** | `InvoiceTerms` module | `/invoice-terms` — CRUD | Shared templates |
| 7 | **LC Management** | `LCManagement` module | `/lc-management` — CRUD | Full Bill of Exchange support |
| 8 | **Company Profile** | `CompanyProfile` module | `/company-profile` — CRUD | Parent/Sister company support |
| 9 | **Account Heads** | `AccountHead` module (5 types: ASSET, LIABILITY, EQUITY, INCOME, EXPENSE) | `/accounting/account-headers` — CRUD + opening balances | Chart of Accounts properly structured |
| 10 | **Daily Bookkeeping** | `JournalEntry` module (Draft → Post → Reverse) | `/accounting/daily-bookkeeping` — Create/Edit/View vouchers | Double-entry engine works, auto voucher numbering |
| 11 | **Buyer Ledger** | `Ledger` service (`getBuyerLedger`) | `/accounting/buyer-ledger/[id]` — Running balance | Live data with opening/closing balance |
| 12 | **Supplier Ledger** | `Ledger` service (`getSupplierLedger`) | `/accounting/supplier-ledger/[id]` — Running balance | Live data with Debit/Credit tracking |
| 13 | **Bank Management** | `Bank` module + real-time balance aggregation | `/accounting/banks` — CRUD with live balances | Recently fixed, sub-ledger model |
| 14 | **Loan Management** | `Loan` module (principal, interest, repayments) | `/accounting/loan-management` — Progress meter, KPIs | Complete with repayment tracking |

---

### ⚠️ BACKEND EXISTS, FRONTEND MISSING

| # | Module | Backend Status | Frontend Gap | Priority |
|---|---|---|---|---|
| 15 | **Record Receipt** (Buyer Payment Collection) | ✅ `receipt.service.ts` — Creates auto journal entries (Dr Bank/Cash, Cr Receivable) | ❌ **No "Record Receipt" button** on buyer ledger page | 🔴 **CRITICAL** |
| 16 | **Record Payment** (Supplier Payment) | ✅ `payment.service.ts` — Creates auto journal entries (Dr Payable, Cr Bank/Cash) | ❌ **No "Record Payment" button** on supplier ledger page | 🔴 **CRITICAL** |

> **⚠️ CAUTION**
> These are the most critical gaps. Your backend can already handle Receipts and Payments with proper accounting entries, but the user has **no way to trigger them** from the UI. This means all buyer/supplier transactions must be manually created as journal entries, which defeats the purpose of having a dedicated receipt/payment module.

---

### 🚫 FRONTEND PAGES SHOWING FAKE (MOCK) DATA

| # | Page | What's Fake | What Needs to Happen |
|---|---|---|---|
| 17 | **Accounting Overview** (`overview/page.tsx`) | Stats cards use `mockAccountingStats` ($11,990 receivables, -$2,800 payables, etc.) from `types.ts`. Recent transactions are hardcoded. | Connect to `LedgerService.getDashboardStats()` API and fetch real journal entries |
| 18 | **MOI / Cash Book** (`cash-book/page.tsx`) | Entire page uses hardcoded `employees[]` array (Salim Ahmed, Farhan Morshed, Rina Begum). No backend model exists for Employee or IOU. | Requires new Prisma model + backend module + frontend rewrite |
| 19 | **Audit Trail** (`audit-trail/page.tsx`) | `auditItems[]` array is fully hardcoded (JE-041, JE-039, etc.). Backend has `getAuditTrail()` in `ledger.service.ts` but frontend doesn't call it | Just connect the frontend to the existing API |
| 20 | **Main Dashboard** (`page.tsx`) | Shows only Orders/Buyers/Users counts. No financial data, no cash position, no receivables/payables summary. | Extend with financial KPIs from `getDashboardStats()` |

---

### 🔧 BACKEND CODE ISSUES (Technical Debt)

| Issue | Location | Impact |
|---|---|---|
| **JournalEntry status filter COMMENTED OUT** | `ledger.service.ts:17-19` — `journalEntry.status: POSTED` is commented out in both buyer and supplier ledger | Currently showing DRAFT entries in ledger totals — this inflates balances with unposted transactions |
| **Dashboard stats use `openingBalance` only** | `ledger.service.ts:239-262` — `getDashboardStats()` aggregates `AccountHead.openingBalance` | Does NOT reflect transaction changes. A properly working system should compute balances from JournalLines |
| **Analytics module is a stub** | `analytics.service.ts` — Just counts buyers/users/orders | No financial analysis, trending, or forecasting capability |
| **No Pagination on Audit Trail** | `getAuditTrail()` returns fixed 20 entries, no date filter | Should support pagination and date range filtering |

---

## Prioritized Implementation Roadmap

### Phase 1 — Critical Treasury Operations (Immediate)

> Without these, the ERP cannot process real money movement.

- [ ] **1.1 Record Receipt Modal** — Add a "Record Receipt" button to the Buyer Ledger detail page that opens a form calling `POST /accounting/receipts/buyer`
- [ ] **1.2 Record Payment Modal** — Add a "Record Payment" button to the Supplier Ledger detail page that opens a form calling `POST /accounting/payments/supplier`
- [ ] **1.3 Fix Ledger Status Filter** — Uncomment the `POSTED` status filter in `ledger.service.ts` so draft entries don't inflate balances
- [ ] **1.4 Audit Trail → Live Data** — Replace hardcoded audit items with API call to `GET /accounting/ledger/audit-trail`

---

### Phase 2 — Financial Intelligence (Week 2)

> Make the Accounting Overview page meaningful.

- [ ] **2.1 Live Accounting Overview** — Replace all mock data in Overview page with real API calls to the Ledger dashboard stats
- [ ] **2.2 Enhanced Dashboard Stats** — Compute real receivables, payables, and cash position from JournalLines (not just AccountHead.openingBalance)
- [ ] **2.3 Main Dashboard Financial Widget** — Add receivables/payables/cash cards to the main dashboard alongside the existing Order/Buyer/User stats

---

### Phase 3 — MOI / Cash Book (Week 3)

> Employee IOU tracking (petty cash, advances).

- [ ] **3.1 Schema Design** — Add `Employee` and `CashAdvance` models to Prisma
- [ ] **3.2 Backend Module** — Create EmployeeCashBook module (service, controller, routes, validation)
- [ ] **3.3 Frontend Rewrite** — Replace mock data in `/accounting/cash-book` with real API calls

---

### Phase 4 — Financial Reports (Week 4)

> Industry-standard accounting reports.

- [ ] **4.1 Trial Balance Report** — Backend endpoint that aggregates all AccountHead balances with Debit/Credit columns
- [ ] **4.2 Profit & Loss Statement** — Compute Revenue minus Expenses for a date range
- [ ] **4.3 Balance Sheet** — Assets = Liabilities + Equity at a point in time
- [ ] **4.4 Report Frontend Pages** — Create dedicated pages for each report with date range filtering and print/export capability

---

### Phase 5 — Production & Document Quality (Week 5+)

> Polish for production deployment.

- [ ] **5.1 PDF Generation** — Professional invoice, voucher, and receipt PDF templates
- [ ] **5.2 Production Dashboard** — Order progress tracking, delivery timelines
- [ ] **5.3 Role-Based Module Visibility** — Ensure sidebar navigation properly hides modules based on `user.modules[]`
- [ ] **5.4 Data Export** — Excel/CSV export for ledger reports

---

## Verification Plan

### For Phase 1 (Receipt/Payment)
1. Open a buyer ledger detail page → click "Record Receipt" → fill form → submit
2. Verify new journal entry created with category RECEIPT
3. Verify buyer ledger balance updates correctly
4. Repeat for supplier payment
5. **Manual verification**: User navigates to `/accounting/buyer-ledger/{id}` and tests the full flow

### For Phase 2 (Overview)
1. Navigate to `/accounting/overview` and verify all numbers match actual database state
2. Compare stats with values computed from `/accounting/ledger/dashboard-stats` API response

### For Phase 3 (MOI)
1. Add employee → Issue cash advance → Record return → Verify outstanding balance
2. All operations tested via browser on `/accounting/cash-book`

> **⚠️ IMPORTANT**
> **No existing automated tests were found** in the frontend or backend projects. All verification will be manual browser testing by the user.
