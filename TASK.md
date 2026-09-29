# OneMed Pre-Live Launch Tasks (`TASK.md`)

This task list tracks all remaining features and optimizations required before releasing **OneMed** to live production.

---

## 📱 Task 1: PWA Integration for Portals
- [x] **Consumer Portal PWA**: Basic PWA manifest and service worker configured (`/`).
- [x] **Vendor Portal PWA (`/vendor`)**:
  - Add web manifest / sub-app PWA configuration & PWA icons for Vendor Portal.
  - Implement PWA install banner / prompt for Vendors.
  - Enable offline fallback / caching strategy for Vendor portal routes.
- [x] **Rider Portal PWA (`/rider`)**:
  - Add web manifest / sub-app PWA configuration & PWA icons for Rider Portal.
  - Implement PWA install banner / prompt for Delivery Riders.
  - Enable offline fallback / caching strategy for Rider portal routes.

---

## 📐 Task 2: Mobile Responsiveness Audit & Polish
- [x] **Consumer Portal Responsiveness**:
  - Verify layout, header, drawer, navigation bar, product cards, and checkout pages on small & medium screens.
- [x] **Vendor Portal Responsiveness**:
  - Optimize vendor dashboard, inventory table, order management cards, and analytics on mobile viewports.
- [x] **Rider Portal Responsiveness**:
  - Ensure rider dashboard, live order pickup/delivery workflow, and map view are touch-friendly and fluid on all mobile screen sizes.

---

## 💬 Task 3: Dynamic WhatsApp Support Contact Feature
- [x] **Backend (Django)**:
  - Create/Update System Settings model to store `whatsapp_support_number`.
  - Public API endpoint `GET /api/settings/whatsapp/` (returns active support number for consumers).
  - Restricted API endpoint `PUT/PATCH /api/settings/whatsapp/` (Super Admin permission required).
- [x] **Frontend - Consumer Portal**:
  - Add a floating/header WhatsApp support button (`https://wa.me/<number>?text=...`).
  - Fetch dynamic support number from backend API.
- [x] **Frontend - Admin Portal**:
  - Add WhatsApp Support Number configuration field in Admin Panel.
  - Restrict visibility & edit access strictly to **Super Admin** users.


---

## 🚀 Task 4: Final Pre-Live Production Audit
- [ ] Environment variables & security check (`.env`).
- [ ] Final production build test (`npm run build` & Django deployment check).
