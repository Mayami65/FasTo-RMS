# PRD Execution Plan (P0/P1/P2)

## P0 (Critical compliance + financial safety)

- **Enforce transaction locks after day close**
  - Add backend guard in `process-sale` to reject sales on closed/locked dates.
  - Ensure edits/deletes on closed-day records are blocked.
  - Effort: `0.5-1 day`
- **Prevent negative stock everywhere**
  - Validate stock before sale deduction and stock adjustments.
  - Return clear user-facing error when quantity exceeds available stock.
  - Effort: `0.5 day`
- **Implement refunds end-to-end**
  - DB schema: refunds + refund_items tables.
  - IPC + UI: transaction lookup, partial/full refund, mandatory reason.
  - Stock reversal + audit log on refund actions.
  - Effort: `2-3 days`
- **Audit log completion for mandatory actions**
  - Add logging for login attempts, close-day, HP edits/installment updates, refunds.
  - Include affected record + before/after where required.
  - Effort: `1-2 days`
- **Fix report contract consistency**
  - Remove duplicate `get-sales-report` behavior divergence in `electron/main.ts`.
  - Standardize one response shape used by dashboard/reports.
  - Effort: `0.5 day`

## P1 (PRD feature completeness)

- **Payment methods parity**
  - Add `BANK_CARD` method in checkout, DB queries, reporting breakdown.
  - Effort: `0.5 day`
- **Owner account controls**
  - Add lock/unlock user accounts and enforce `is_active` at login.
  - Restrict backend user-management handlers to owner role.
  - Effort: `1 day`
- **Reporting module expansion**
  - Add PRD-aligned Inventory Report (stock levels, low stock, cost valuation).
  - Add HP report fields (outstanding, overdue, today’s collected, active contracts).
  - Effort: `1-2 days`
- **Daily closing outputs**
  - Generate daily sales + reconciliation export (PDF preferred, CSV fallback interim).
  - Effort: `1-2 days`

## P2 (Operational hardening + nice-to-have)

- **Automated daily backup**
  - Scheduled local backup with timestamped files and retention policy.
  - Effort: `1 day`
- **Restore hardening**
  - Pre-restore validation + confirmation + rollback-safe handling.
  - Effort: `0.5-1 day`
- **Barcode scanner support**
  - Input event integration for scanner flow in POS/inventory.
  - Effort: `1 day`
- **Auth/session robustness**
  - Persist session securely for app reloads, add logout timeout policy if needed.
  - Effort: `0.5 day`
- **Spec alignment decision**
  - Either update PRD to Electron or plan migration path to Tauri.
  - Effort: `0.5 day` (decision/documentation), migration is much larger.

## Suggested delivery sequence

1. P0 first (protect money/data integrity)
2. P1 second (PRD acceptance readiness)
3. P2 third (stability + operator UX)

## Rough timeline

- P0: `4-7 working days`
- P1: `3-6 working days`
- P2: `3-4 working days`
- Total: `2-3 weeks` for one developer
