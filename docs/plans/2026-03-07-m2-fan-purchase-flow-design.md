# M2 Fan Purchase Flow -- Design

## Overview

Build the fan-facing merch purchase experience inside the existing React Native app. Fans discover merch through artist drops they've collected, browse products, select variants, enter shipping info, pay via Stripe, and track their orders.

## Entry Points

1. **Drop Detail Screen (DMDetailPage):** When a fan views a collected drop that has merch, a "Shop Merch" button appears. Tapping it opens the merch store for that drop.
2. **Push Notification:** When a merch drop goes live, fans receive a notification. Tapping it navigates directly to the merch store for that drop.

## Screens

### MerchStorePage (Product Grid)
- Receives `dropId` from navigation params
- Calls `GET /merch/drops/:dropId` to get drop with products
- Groups products by type (Hoodie, T-Shirt, Tank, Poster)
- Shows product image (Printful mockup URL), name, starting price
- Shows countdown timer for 48-hour expiry (calculated from `expires_at`)
- If drop is expired, shows "This merch drop has ended" state
- Tapping a product navigates to MerchProductPage

### MerchProductPage (Product Detail + Variant Picker)
- Receives product data from navigation params
- Shows large product image
- Size picker (S, M, L, XL, 2XL, 3XL) with availability
- Color picker (swatches based on product colors)
- Price updates based on selected size (S-XL vs 2XL-3XL pricing tiers)
- Quantity selector (default 1)
- "Buy Now" button navigates to MerchCheckoutPage with selected variant + quantity

### MerchCheckoutPage (Address + Payment)
- Address form: full name, street, city, state/province, zip, country
- Order summary: item, variant, quantity, subtotal, shipping estimate
- Free shipping badge if order >= $95
- "Place Order" calls `POST /merch/orders` with item + address
- Backend returns `client_secret` + total including shipping
- Presents Stripe Payment Sheet via `@stripe/stripe-react-native`
- On success: shows confirmation with order number
- On failure: shows error, allows retry

### MerchOrderDetailPage (Order Tracking)
- Receives `orderId` from navigation params
- Calls `GET /merch/orders/:orderId`
- Shows order number, date, status badge, items with images
- If SHIPPED: shows tracking number + carrier
- If SHIPPED: shows "Request Return" button calling `PATCH /merch/orders/:id/return`

### MyCollectionsPage Modification
- Add segment control at top: "Drops | Orders"
- Orders segment calls `GET /merch/orders/fan`
- Shows order cards: order number, date, status, total
- Tapping a card navigates to MerchOrderDetailPage

## Data Flow

1. Fan views drop (DMDetailPage) -> `GET /merch/drops/post/:postId` checks if merch exists
2. Fan taps "Shop Merch" -> MerchStorePage with drop data
3. Fan taps product -> MerchProductPage (size/color picker)
4. Fan taps "Buy Now" -> MerchCheckoutPage (address form)
5. Address submitted -> `POST /merch/orders` returns `client_secret` + order total
6. Stripe Payment Sheet presented -> fan pays
7. Payment succeeds -> confirmation shown
8. Fan checks orders -> MyCollectionsPage "Orders" tab -> `GET /merch/orders/fan`

## Payment Integration

- SDK: `@stripe/stripe-react-native` (Payment Sheet)
- `StripeProvider` wrapper in App.tsx with publishable key
- Single item per purchase (no cart)
- Supports Apple Pay + Google Pay via Payment Sheet
- PCI compliance handled by Stripe SDK

## Shipping Address

- Custom address form in MerchCheckoutPage (before payment)
- Backend requires address at order creation to calculate shipping cost from Printful
- Address submitted with `POST /merch/orders`, shipping cost returned in response

## Push Notifications + Deep Linking

Backend already sends OneSignal notifications for merch events. Frontend adds two new notification type handlers in App.tsx `onNotificationClick`:

- Type `merch_drop`: navigate to MerchStorePage with drop ID
- Type `merch_order_shipped`: navigate to MerchOrderDetailPage with order ID

Backend may need minor update to include `type` and entity ID in OneSignal data payload.

## API Endpoints Used

| Endpoint | Screen | Purpose |
|----------|--------|---------|
| GET /merch/drops/post/:postId | DMDetailPage | Check if drop has merch |
| GET /merch/drops/:id | MerchStorePage | Get drop products |
| POST /merch/orders | MerchCheckoutPage | Create order + get client_secret |
| GET /merch/orders/fan | MyCollectionsPage | Fan order history |
| GET /merch/orders/:id | MerchOrderDetailPage | Order detail + tracking |
| PATCH /merch/orders/:id/return | MerchOrderDetailPage | Request return |

## New Files

```
services/merch.service.ts
screens/fan/MerchStorePage.js
screens/fan/MerchProductPage.js
screens/fan/MerchCheckoutPage.js
screens/fan/MerchOrderDetailPage.js
```

## Modified Files

```
assets/constants.js                -- BASEURL -> https://api.dayones.app
screens/fan/DMDetailPage.js        -- Add "Shop Merch" button
screens/fan/MyCollectionsPage.js   -- Add "Drops | Orders" segment
navigation/FanStack.js             -- Register merch screens
App.tsx                            -- StripeProvider + merch notification deep links
package.json                       -- Add @stripe/stripe-react-native
```

## Dependencies

- `@stripe/stripe-react-native` (new)
- No other new packages required

## Configuration Required

- Stripe publishable key (`pk_test_...`) from client
- BASEURL update to `https://api.dayones.app`

## Out of Scope (M3)

- Artist-side screens (drop creation, order dashboard, payout dashboard)
- Multi-item cart
- Wishlist / saved items
- Order cancellation by fan
- Reviews / ratings
