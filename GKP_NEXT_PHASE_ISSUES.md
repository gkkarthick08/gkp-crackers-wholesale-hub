# GKP Crackers — NEXT PHASE ISSUES
## Medium Priority Fixes (Phase 2)
**Date Generated:** June 2, 2026
**Status:** After all 38 critical issues fixed
**Total Issues:** 61 Medium + 15 Low = 76 remaining issues

---

## 🟡 MEDIUM PRIORITY (61 Issues) — Fix Soon

### SECTION 1: APP ROUTING & CONFIG (4 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 1 | JSX.Element outdated type in AuthGuard | App.tsx | React 18+ uses `React.ReactNode` instead of `JSX.Element` | 5 min |
| 2 | QueryClient no staleTime config | App.tsx | Add `staleTime: 5 * 60 * 1000` to reduce API calls | 5 min |
| 3 | AuthGuard blank screen while loading | App.tsx | Shows `null` instead of `<LoadingScreen />` | 5 min |
| 4 | Role-based code loads for all users | App.tsx | Admin components included in all bundle | 15 min |

**Fix Priority:** HIGH - These affect user experience and performance

---

### SECTION 2: REFERRAL SYSTEM (1 Issue)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 6 | Referral code collision risk | DB Trigger | Two simultaneous signups could generate same code | 30 min |

**Action:** Add UUID generation or timestamp uniqueness constraint

---

### SECTION 3: WALLET SYSTEM (2 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 8 | Transaction history limited to 20 | TransactionHistory | No pagination - users can't see older transactions | 20 min |
| 9 | No admin global transaction view | AdminWallet | Can't see all customer transactions in one place | 30 min |

---

### SECTION 4: ORDERS MANAGEMENT (3 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 10 | Admin orders loads ALL at once | AdminOrders | No pagination - VERY SLOW on 1000+ orders | 45 min |
| 12 | No date filter in admin orders | AdminOrders | Can't filter by date range | 20 min |
| 13 | Customer can cancel confirmed orders | Orders.tsx | Should only allow cancellation of pending orders | 15 min |

---

### SECTION 5: STOCK MANAGEMENT (4 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 17 | No low stock alert/notification | AdminProducts | Admin doesn't know when to reorder | 25 min |
| 18 | Wholesale stock uses product_code not ID | DB Function | Stock restore fails if product code changes | 30 min |
| 19 | Admin can set negative stock | AdminProducts | No min="0" validation on input | 5 min |
| 20 | No low stock warning badge | Products.tsx | Customers can't see if product is running low | 15 min |

---

### SECTION 6: PRICE FLOWS (5 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 21 | WhatsApp submit uses stale prices | Cart.tsx | No fresh DB fetch before sending order | 20 min |
| 22 | POS has no wallet deduction | POS.tsx | Can't pay from wallet in POS billing | 30 min |
| 23 | POS charges not in website total | POS.tsx | Packing/delivery shown separately | 15 min |
| 24 | POS brief price mismatch | POS.tsx | State vs panel price differs | 20 min |
| 25 | Wholesale WhatsApp case_price stale | Cart.tsx | Fetched from old cart state | 15 min |

---

### SECTION 7: ADMIN SYSTEM (3 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 28 | Analytics loads ALL items | AdminAnalytics | No date filter - extremely slow | 40 min |
| 29 | Staff N+1 query problem | AdminStaff | One DB call per staff member | 25 min |
| 30 | Contact messages no delete/reply | AdminContactMessages | No action buttons available | 30 min |

---

### SECTION 8: HOMEPAGE & HERO (4 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 34 | Hero image hardcoded | HeroSection | Admin can't change from dashboard | 20 min |
| 35 | LoginOptions shows to logged-in users | LoginOptions | Should hide for authenticated users | 10 min |
| 36 | OfferTimer shows 00:00:00 after end | OfferTimer | Should display "Offer Ended" message | 15 min |
| 37 | Footer copyright year hardcoded | Footer | Should be `new Date().getFullYear()` | 5 min |

---

### SECTION 9: ABOUT & CONTACT (5 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 46 | Contact form auto-opens WhatsApp | Contact | Should ask user first before opening | 15 min |
| 47 | No spam protection on contact form | Contact | Can be flooded with messages | 30 min |
| 48 | FAQ inconsistency | Contact | Says Tamil Nadu but homepage says Pan India | 10 min |
| 49 | About page stats hardcoded | About | Should fetch real counts from DB | 20 min |
| 50 | Testimonials are fake placeholder | About | Damages trust - need real testimonials | 60 min |

---

### SECTION 10: CUSTOMER ACCOUNT (5 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 53 | `any` type used throughout | Account components | Should use proper TypeScript types | 40 min |
| 54 | No quick links to Orders/Wallet | Account | Difficult to navigate | 15 min |
| 55 | Wallet balance in wrong tab | AccountSettings | Shows in Security tab instead of Profile | 10 min |
| 56 | GST number no format validation | Account | Accepts invalid GST numbers | 15 min |
| 57 | Phone validation too weak | Account | No Indian phone format check | 20 min |

---

### SECTION 11: AUTH FLOW (5 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 59 | No redirect after login | Auth.tsx | Always goes to /products, not back to page | 20 min |
| 60 | No confirm password field | Auth.tsx | Customer can mistype password | 10 min |
| 61 | Business name optional/required mismatch | Auth.tsx | Zod schema says optional but UI requires | 10 min |
| 62 | Password min 6 chars too weak | Auth, Account | Should be 8+ chars everywhere | 10 min |
| 63 | No email verification enforced | Auth.tsx | Users can signup with fake email | 45 min |

---

### SECTION 12: WHOLESALE & POS (8 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 66 | WholesaleCatalog is duplicate | WholesaleCatalog | Same code as Products page | 60 min |
| 67 | WholesaleCatalog no OOS check | WholesaleCatalog | Dealers can add out-of-stock items | 15 min |
| 68 | WholesaleCatalog no detail dialog | WholesaleCatalog | Missing info like Products page | 25 min |
| 69 | POS settings saved one-by-one | AdminPOSSettings | 11 DB calls instead of 1 batch | 20 min |
| 70 | Default packing % not auto-applied | AdminPOSSettings | New bills don't use default % | 20 min |
| 71 | POS History no pagination | AdminPOSHistory | All bills load at once | 30 min |
| 72 | POS History no date filter | AdminPOSHistory | Can't find specific bills | 20 min |
| 73 | POS History print timeout fragile | AdminPOSHistory | 500ms timeout unreliable | 15 min |

---

### SECTION 13: POS BILL & GST (4 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 75 | Cannot add products to bill in edit | POSReceipt | Edit mode only modifies existing items | 25 min |
| 76 | No proper GST invoice | POSReceipt | Missing CGST/SGST/IGST breakdown | 40 min |
| 77 | No HSN codes on products | Products/Admin | Required for GST compliance | 30 min |
| 78 | Partial payment not recordable | POS.tsx | Can't mark "Paid ₹X, Balance ₹Y" at billing | 30 min |

---

### SECTION 14: ANNOUNCEMENTS (3 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 83 | No CTA button on announcements | AnnouncementPopup | Missing "Shop Now" link | 15 min |
| 84 | sessionStorage resets every session | AnnouncementPopup | Same popup shows too often | 20 min |
| 85 | No announcement banner/ticker | — | Only popup exists, need persistent banner | 40 min |

---

### SECTION 15: SEO (3 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 88 | OG image missing everywhere | index.html | No preview on WhatsApp/Facebook | 15 min |
| 89 | Keywords meta tag never applied | usePageMeta | Tag saved but never used | 10 min |
| 90 | OG tags not dynamic per page | index.html | All pages share same OG description | 20 min |

---

### SECTION 16: MOBILE RESPONSIVENESS (4 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 94 | Admin sidebar doesn't close on mobile | Admin.tsx | Sidebar stays open after navigation | 15 min |
| 95 | Header menu doesn't close | Header.tsx | Mobile menu persists after clicking | 15 min |
| 96 | Tables overflow on mobile | AdminWallet, AdminReferrals | Horizontal scroll needed | 25 min |
| 97 | Product cards cramped on mobile | WholesaleCatalog | Layout breaks on small screens | 20 min |

---

### SECTION 17: ERROR HANDLING (6 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 103 | No offline handling (except POS) | All pages | Silent failures when network drops | 60 min |
| 104 | Raw technical errors shown | ErrorBoundary | Customers see "TypeError: undefined" | 20 min |
| 105 | No error reporting system | ErrorBoundary | Never know when customers crash | 45 min |
| 106 | Toast messages inconsistent | Multiple files | Some missing destructive variant | 20 min |
| 107 | No image fallbacks | Products | Broken images show ugly icon | 25 min |
| 108 | No global React Query error handler | App.tsx | Errors not centralized | 20 min |

---

### SECTION 18: DISPLAY ORDER (2 Issues)

| # | Issue | File | Details | Est. Time |
|---|-------|------|---------|-----------|
| 110 | Retail display_order no admin input | AdminProducts | Field exists but no form control | 10 min |
| 111 | Retail products sort wrong | Products.tsx | Uses created_at instead of display_order | 5 min |

---

## 🟢 LOW PRIORITY (15 Issues) — Nice to Have

| # | Issue | Details | Est. Time |
|---|-------|---------|-----------|
| 31 | changeUserType confusing code | Copy-paste error in logic | 10 min |
| 38 | Staff missing POS quick link | Header needs Staff menu item | 10 min |
| 39 | Trust badges hardcoded | Admin can't edit trust section | 30 min |
| 40 | No social media links | Footer missing social icons | 20 min |
| 41 | Google Maps hardcoded coords | Not exact shop location | 15 min |
| 79 | Bill number not GST compliant | Format validation missing | 15 min |
| 80 | No daily sales summary | Missing end-of-day report | 60 min |
| 86 | Announcement image error handling | Broken images show icon | 15 min |
| 91 | No robots.txt | Admin/pos pages getting indexed | 5 min |
| 92 | No sitemap.xml | Google can't crawl efficiently | 10 min |
| 98 | Cart qty buttons too small | Touch targets too small | 15 min |
| 109 | Success toasts missing | Many actions have no feedback | 30 min |

---

## 📋 RECOMMENDED FIX ORDER

### Phase 2A (HIGH IMPACT, QUICK) — 1-2 days
```
Priority 1: Footer copyright (5 min) ✅
Priority 2: AuthGuard loading screen (5 min) ✅
Priority 3: JSX.Element type (5 min) ✅
Priority 4: Admin sidebar mobile close (15 min) ✅
Priority 5: Header menu mobile close (15 min) ✅
Priority 6: QueryClient staleTime (5 min) ✅
Priority 7: Admin orders pagination (45 min) ✅
Priority 8: POS History pagination (30 min) ✅
Total: ~2.5 hours
```

### Phase 2B (MEDIUM IMPACT) — 2-3 days
```
Priority 1: Contact form anti-spam (30 min)
Priority 2: Image fallbacks (25 min)
Priority 3: Error handling consistency (20 min)
Priority 4: Off-line handling (60 min)
Priority 5: Low stock alerts (25 min)
Priority 6: Admin analytics date filter (40 min)
Total: ~4 hours
```

### Phase 2C (COMPLIANCE & UX) — 3-4 days
```
Priority 1: Email verification (45 min)
Priority 2: GST compliance items (70 min)
Priority 3: SEO meta tags (45 min)
Priority 4: Type safety improvements (40 min)
Priority 5: Form validation (50 min)
Total: ~4.5 hours
```

---

## 🎯 ESTIMATED TOTAL EFFORT

| Phase | Issues | Est. Hours | Timeline |
|-------|--------|-----------|----------|
| Phase 2A (Quick Wins) | 8 | 2.5h | 1 day |
| Phase 2B (Medium) | 6 | 4h | 2 days |
| Phase 2C (Polish) | 15 | 4.5h | 2 days |
| **TOTAL** | **61** | **~11 hours** | **~1 week** |

---

## ✅ COMPLETION CHECKLIST

After Phase 2 completes, you'll have:
- ✅ All 38 critical issues FIXED
- ✅ 61 medium issues FIXED
- ✅ 15 low priority issues addressed
- ✅ **114 total issues resolved**
- ✅ Production-ready application

---

## 🚀 NEXT STEPS

1. **Start Phase 2A immediately** - Quick wins improve UX fast
2. **Prioritize pagination fixes** - Affects performance with real data
3. **Add error handling** - Prevents silent failures for customers
4. **Implement validations** - Prevents bad data entry
5. **Mobile fixes** - Essential for user experience

---

*Generated: June 2, 2026*
*Project: GKP Crackers Wholesale Hub*
*Status: 38/114 critical issues fixed (33% complete)*
