# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` / `ng serve` — dev server at `http://localhost:4200/` (use `--port` to override; port 4300 has been used in this repo's own testing sessions to avoid clashing with a default-port instance).
- `ng build` — production build to `dist/`. Use `ng build --configuration development` for a quick compile-error check without full optimization.
- `ng test` — unit tests via Karma/Jasmine. No spec files currently exist in `src/app`; `app.component.spec.ts` was deleted because it referenced the scaffold placeholder template.
- No e2e test runner is configured.
- There is no lint script in `package.json`.

## Architecture

This is a single-page Angular 18 standalone app (no NgModules) for tracking debt-repayment plans and the receipts logged against them. All UI text is in Spanish; all code (identifiers, comments) is in English — keep following this split when adding features.

### Data flow and layering

`components (pages/shared) → PlanService / ReceiptService → StorageService → localStorage`

- **`StorageService`** (`src/app/services/storage.service.ts`) is the *only* code allowed to touch `localStorage`. It namespaces every key with a versioned prefix (`rt_v1_`) so a future breaking data-shape change can migrate by bumping the prefix and adding a migration step here, not scattered through services.
- **`ReceiptService`** and **`PlanService`** each hold their collection in a signal, hydrated once from `StorageService` at construction, and write through `persist()` on every mutation (`storage.set()` + signal update). Never call `StorageService` from a component directly.
- **`PlanService.planSummaries`** is a `computed()` that derives a `PlanSummary` per plan by calling into `ReceiptService`. `PlanSummary` fields (`totalPaid`, `remainingBalance`, `progressPercent`, `lastReceiptDate`, `status`, `receiptCount`) are **never stored** — they're recalculated from `Plan` + `Receipt[]` on every read. Don't add persisted fields to `Plan` that duplicate something derivable from receipts.
- Only receipts with `status === 'paid'` count toward `totalPaid` / `remainingBalance` / `lastReceiptDate` / the overdue calculation. A plan's `status` ('completed' | 'active' | 'overdue') is computed in `PlanService.computeStatus()`: completed wins if `completedManually` or fully paid; otherwise overdue if the most recent *paid* receipt (or `startDate`, if none) is more than 30 days old.
- `PlanDetailComponent.receiptRows` computes a per-row running balance by walking receipts oldest→newest and only decrementing the balance on `status === 'paid'` rows — pending receipts show the same balance as the row before them.

### Backward-compatible field additions

`Receipt` and `Plan` have grown fields across iterations (`status`, `sent`) without a storage version bump. The pattern used in `ReceiptService`'s constructor is: map over records loaded from `StorageService` and backfill missing/legacy field values (see `normalizeStatus()` in `receipt.service.ts`, which also collapses a previously-removed status value onto the current union). Follow this pattern — normalize in the service that owns the field, not in components — when adding another field to an existing model instead of bumping the storage prefix.

### Dates

All dates are stored as ISO strings normalized to UTC midnight (`new Date(dateInputValue).toISOString()`). Every `date` pipe usage in templates **must** pass `'UTC'` as the timezone argument (e.g. `{{ plan.startDate | date: 'dd/MM/yyyy':'UTC' }}`) — omitting it renders one day behind in any timezone with a negative UTC offset, since Angular's `DatePipe` otherwise formats in the browser's local timezone. This bit us once; keep it consistent when adding new date displays.

### Routing / components

Routes (`app.routes.ts`) lazy-load standalone page components: `/` (Home), `/planes` (PlanList), `/planes/:id` (PlanDetail), `/estadisticas` (Stats). `src/app/pages/` holds routed pages; `src/app/shared/` holds reusable presentational/dialog components (`PlanCardComponent`, `AddPlanModalComponent`, `AddReceiptModalComponent`, `ConfirmDialogComponent`). Modals are toggled via a signal in the parent and take the entity being edited (or `null` for create) as an `@Input`, emitting `save`/`close` — there's no modal service.

### Printing a receipt

`PlanDetailComponent.printReceipt()` sets a `printingReceipt` signal and calls `window.print()` on a `setTimeout`. The printable markup lives inline in `plan-detail.component.html` under a `.print-only` block; global rules in `styles.scss` (`.print-only`, `@media print`) hide everything else and reveal only that block when printing. A `window` `afterprint` listener (registered in the constructor, removed in `ngOnDestroy`) resets the signal afterward. `window.print()` opens the OS-native print dialog, which is synchronous/blocking — keep that in mind if driving this flow via browser automation.

### Styling

No external UI/CSS library. `src/styles.scss` defines the design tokens (CSS custom properties, accent `#10b981`), shared classes (`.btn*`, `.card`, `.badge*`, `.modal*`, `.form-group`, `.progress-*`) used across component templates instead of per-component duplication. The favicon is an inline SVG embedded as a base64 `data:` URI directly in `index.html` (no external asset request).
