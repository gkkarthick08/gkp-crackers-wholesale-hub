## Audit Verification Summary

I verified all three audit files against the current codebase. Many items from prior sessions are **already fixed** (AuthGuard, QueryClient staleTime, footer year, stock check before order, block_stock on POS/WhatsApp, restore_stock on cancel, mobile menu auto-close, admin sidebar auto-close, fresh price refetch on WhatsApp, POSReceipt edit-mode add-product, confirm password, password min 8, AnnouncementPopup localStorage, AdminAnalytics date filter, AdminPOSSettings single-upsert, etc.).

About **50 real issues remain**. The audits also include style/refactor opinions (file size, duplicate imports, barrel exports) — I will skip those unless you want them; they don't affect users.

## Phased Fix Plan

Each phase = one approve/build cycle. After each phase you can review the preview before continuing.

### Phase 1 — Critical data integrity & security (DB + code)
- **Referral bonus hardcoded ₹50** → migration: read amount from `site_settings.referral_bonus`, fall back to 50
- **Referral race condition** → claim_referral_bonus + UI: add `WHERE is_claimed = false` guard, surface "already claimed"
- **Wallet negative-balance guard** in `Cart.tsx` (`walletBalance > 0` check) and server validation in `user_wallet_purchase`
- **Orders cancellation scope** → `Orders.tsx canCancelOrder` restrict to `pending` only (confirmed orders need admin)
- **robots.txt** → block `/admin`, `/admin/*`, `/pos`, `/wallet`, `/account`, `/orders`
- **Hardcoded WhatsApp phone in Cart.tsx** → read from `site_settings`
- **Cart quantity ≤ 0** → CartContext auto-removes item when qty < 1
- **AdminContactMessages**: add delete + reply (mailto/wa.me) buttons
- **WholesaleCatalog purchase_price exposure** → audit query/select to drop `purchase_price` field
- **AdminStaff N+1** → single join query

### Phase 2 — Admin tooling: pagination, filters, alerts
- **AdminOrders**: pagination (50/page) + date-range filter + status filter polish
- **AdminPOSHistory**: pagination + date filter + remove fragile 500 ms print timeout (use `onafterprint`)
- **TransactionHistory**: pagination (load-more or pages)
- **AdminWallet**: new "All Transactions" tab (global ledger across users)
- **AdminProducts**: low-stock badge/alert (threshold from settings), `min="0"` on stock inputs, `display_order` input field
- **AdminCustomers / AdminAnalytics** light pagination where lists are unbounded

### Phase 3 — POS & GST compliance
- **HSN code** column on `products` + `wholesale_products` (migration) and admin form fields
- **GST invoice breakdown** in `POSReceipt`: CGST/SGST/IGST split with configurable rate from settings
- **POS wallet deduction** option (mirror website checkout)
- **POS default packing %** auto-applied on new bills from `pos_settings`
- **AdminPOSHistory**: editing a bill triggers stock recalc (delta-based block/restore)

### Phase 4 — UX, mobile, SEO, content
- **HeroSection**: admin-editable hero image via `site_settings.hero_image_url`
- **LoginOptions**: hide when `user` is present
- **OfferTimer**: show "Offer Ended" state after countdown
- **Contact.tsx**: confirm-dialog before WhatsApp open; simple rate-limit (60 s cooldown + localStorage) for form
- **About.tsx**: stats fetched from DB (`products`, `orders`, `profiles` counts) instead of hardcoded
- **Auth.tsx**: redirect back to `from` location after login
- **Account.tsx**: GST regex (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`), Indian phone regex, surface wallet balance on Profile tab
- **AnnouncementPopup**: add `cta_label` + `cta_url` columns (migration) and render button; image `onError` fallback
- **Tables overflow on mobile** (AdminWallet, AdminReferrals): wrap in horizontal scroll container
- **WholesaleCatalog**: OOS disable on add buttons + low-stock badge
- **SEO**: add `og:image` to index.html; extend `usePageMeta` to set keywords + canonical; add `public/sitemap.xml`
- **Image fallbacks**: shared `<ProductImage>` with `onError` swap to placeholder, `loading="lazy"`, `decoding="async"` across Products, WholesaleCatalog, ProductDetailDialog, POSProductGrid

### Phase 5 — Code-split & hardening (optional polish)
- Lazy-load `/admin/*` and `/pos` routes via `React.lazy` + `Suspense` (reduces customer bundle ~30 %)
- Global React Query `onError` handler with toast
- Standardize toast variants (destructive for failures)
- Add `useCallback` for row-handlers in long admin lists
- Email-verification enforcement (toggle in admin settings; default on)

## Out of Scope (audit opinions, not user-facing bugs)
- 832-line file refactors, barrel-export `@/components/ui` index, eliminating "duplicate imports", state-update-style refactors. Happy to do these in a separate dedicated pass.
- "Disposable-email blocklist", "fake-testimonial replacement" — need your real content first.
- CSRF — Supabase auth tokens already mitigate this for our usage.

## Execution

After you approve, I'll execute **Phase 1** first (single message, includes one DB migration), verify the build, and stop. You review the preview, then say "next" for Phase 2, etc. Each phase is independently shippable.
