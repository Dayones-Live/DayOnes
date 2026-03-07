# M2 Fan Purchase Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the fan-facing merch purchase flow in the React Native app -- from browsing merch on a drop, through checkout with Stripe, to order tracking.

**Architecture:** New merch screens added to FanStack navigation. API calls via axios through a dedicated merch service. Stripe Payment Sheet for checkout. Entry point from DMDetailPage (drop detail) and push notification deep links.

**Tech Stack:** React Native 0.74.5, @react-navigation/stack v6, axios, @stripe/stripe-react-native, Redux, OneSignal

---

## Task 1: Install Stripe SDK and Update Config

**Files:**
- Modify: `package.json`
- Modify: `assets/constants.js`
- Modify: `App.tsx`

**Step 1: Install Stripe React Native SDK**

Run:
```bash
cd /Volumes/external/hevin/freelancing/Fiverr/Clients/ericbush996/DayOnes
npm install @stripe/stripe-react-native
```

**Step 2: Update BASEURL**

In `assets/constants.js`, change:
```js
export const BASEURL = 'https://api.dayones.app'
```

**Step 3: Add StripeProvider to App.tsx**

Add import at top:
```tsx
import { StripeProvider } from '@stripe/stripe-react-native';
```

Wrap the App return in StripeProvider (use placeholder key until client provides real one):
```tsx
const App = () => {
  return (
    <StripeProvider publishableKey="pk_test_PLACEHOLDER">
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <AppContent />
        </Provider>
      </QueryClientProvider>
    </StripeProvider>
  );
};
```

**Step 4: Run iOS pod install (if on Mac)**

Run:
```bash
cd ios && pod install && cd ..
```

**Step 5: Commit**

```bash
git add package.json package-lock.json assets/constants.js App.tsx ios/Podfile.lock
git commit -m "Install Stripe SDK and update BASEURL to HTTPS"
```

---

## Task 2: Create Merch API Service

**Files:**
- Create: `services/merch.service.ts`

**Step 1: Create the service file**

```typescript
import axiosInstance from '../utils/axiosConfig';

const MERCH_BASE = '/api/v1/merch';

export const getMerchDropByPost = async (postId: string) => {
  const response = await axiosInstance.get(`${MERCH_BASE}/drops/post/${postId}`);
  return response.data?.data;
};

export const getMerchDrop = async (dropId: string) => {
  const response = await axiosInstance.get(`${MERCH_BASE}/drops/${dropId}`);
  return response.data?.data;
};

export const createMerchOrder = async (orderData: {
  merchDropId: string;
  items: { merchProductId: string; quantity: number }[];
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
  };
}) => {
  const response = await axiosInstance.post(`${MERCH_BASE}/orders`, orderData);
  return response.data?.data;
};

export const getFanOrders = async () => {
  const response = await axiosInstance.get(`${MERCH_BASE}/orders`);
  return response.data?.data;
};

export const getOrder = async (orderId: string) => {
  const response = await axiosInstance.get(`${MERCH_BASE}/orders/${orderId}`);
  return response.data?.data;
};

export const requestReturn = async (orderId: string) => {
  const response = await axiosInstance.patch(`${MERCH_BASE}/orders/${orderId}/return`);
  return response.data?.data;
};
```

**Step 2: Commit**

```bash
git add services/merch.service.ts
git commit -m "Add merch API service layer"
```

---

## Task 3: Create MerchStorePage (Product Grid)

**Files:**
- Create: `screens/fan/MerchStorePage.js`
- Create: `screens/fan/fanStyles/MerchStorePageStyles.js`

**Step 1: Create styles file**

`screens/fan/fanStyles/MerchStorePageStyles.js`:

Dark theme matching existing app style (black background, white text, #FF0080 accent). Product cards in a 2-column grid. Countdown timer bar at top. Each card shows: product mockup image, product type name, starting price.

**Step 2: Create the screen**

`screens/fan/MerchStorePage.js`:

- Receives `dropId` from `route.params`
- On mount, calls `getMerchDrop(dropId)` from merch service
- Groups products by `product_type` (HOODIE, TSHIRT, TANK, POSTER)
- For each type, picks one representative product (first variant) to show in grid
- Shows countdown timer: calculates remaining time from `drop.expires_at`
- If drop expired or status !== 'ACTIVE', show "This merch drop has ended" overlay
- Loading state with `ActivityIndicator`
- Error state with retry button
- Tapping a product card navigates to `MerchProductPage` with params:
  ```js
  navigation.navigate('MerchProductPage', {
    dropId: drop.id,
    productType: product.product_type,
    products: productsOfType, // all variants of this type
  });
  ```

**Step 3: Commit**

```bash
git add screens/fan/MerchStorePage.js screens/fan/fanStyles/MerchStorePageStyles.js
git commit -m "Add MerchStorePage with product grid and expiry countdown"
```

---

## Task 4: Create MerchProductPage (Variant Picker)

**Files:**
- Create: `screens/fan/MerchProductPage.js`
- Create: `screens/fan/fanStyles/MerchProductPageStyles.js`

**Step 1: Create styles file**

Dark theme. Large product image at top (60% of screen). Below: size pills in a horizontal row, color swatches as circles, price display, quantity stepper, "Buy Now" button (#FF0080 background).

**Step 2: Create the screen**

`screens/fan/MerchProductPage.js`:

- Receives `dropId`, `productType`, `products` (array of all variants of this type) from `route.params`
- Extract unique sizes from products: `[...new Set(products.map(p => p.size))]`
- Extract unique colors from products: dedupe by `color_code`
- State: `selectedSize`, `selectedColor`, `quantity` (default 1)
- When size or color changes, find matching product variant:
  ```js
  const selectedProduct = products.find(p => p.size === selectedSize && p.color_code === selectedColor);
  ```
- Display `selectedProduct.retail_price` (updates with size selection since S-XL vs 2XL-3XL differ)
- Display `selectedProduct.mockup_url` as main image (or `selectedProduct.image_url` fallback)
- For POSTER type: hide size/color pickers (single variant)
- Quantity stepper: minus/plus buttons, min 1, max 10
- "Buy Now" button navigates to:
  ```js
  navigation.navigate('MerchCheckoutPage', {
    dropId,
    product: selectedProduct,
    quantity,
  });
  ```
- Disable "Buy Now" if no valid variant selected

**Step 3: Commit**

```bash
git add screens/fan/MerchProductPage.js screens/fan/fanStyles/MerchProductPageStyles.js
git commit -m "Add MerchProductPage with size, color, and quantity selection"
```

---

## Task 5: Create MerchCheckoutPage (Address + Payment)

**Files:**
- Create: `screens/fan/MerchCheckoutPage.js`
- Create: `screens/fan/fanStyles/MerchCheckoutPageStyles.js`

**Step 1: Create styles file**

Dark theme. Address form fields with light borders. Order summary section. "Place Order" button (#FF0080). Free shipping badge (green).

**Step 2: Create the screen**

`screens/fan/MerchCheckoutPage.js`:

- Receives `dropId`, `product`, `quantity` from `route.params`
- Import `{ useStripe }` from `@stripe/stripe-react-native`
- Address state:
  ```js
  const [address, setAddress] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state_code: '',
    country_code: 'US',
    zip: '',
  });
  ```
- Order summary section shows: product type, size, color, quantity, subtotal (`product.retail_price * quantity`)
- Free shipping badge if subtotal >= 95
- "Place Order" flow:
  1. Validate all required address fields filled
  2. Call `createMerchOrder()` with:
     ```js
     {
       merchDropId: dropId,
       items: [{ merchProductId: product.id, quantity }],
       shippingAddress: address,
     }
     ```
  3. Backend returns `{ id, order_number, total, shipping_cost, stripe_payment_intent_id }` and the PaymentIntent has a `client_secret`
  4. Present Stripe Payment Sheet:
     ```js
     const { initPaymentSheet, presentPaymentSheet } = useStripe();

     await initPaymentSheet({
       paymentIntentClientSecret: orderResult.client_secret,
       merchantDisplayName: 'DayOnes',
     });

     const { error } = await presentPaymentSheet();
     ```
  5. On success: navigate to confirmation state (show order number, "View Orders" button)
  6. On error: show error message, allow retry
- Note: need to check how the backend returns `client_secret`. Review `merch-order.service.ts:createOrder` return value.

**Step 3: Check backend createOrder return value**

Read `src/modules/merch/merch-order.service.ts` to confirm what `createOrder` returns, specifically whether `client_secret` is included in the response.

**Step 4: Commit**

```bash
git add screens/fan/MerchCheckoutPage.js screens/fan/fanStyles/MerchCheckoutPageStyles.js
git commit -m "Add MerchCheckoutPage with address form and Stripe Payment Sheet"
```

---

## Task 6: Create MerchOrderDetailPage

**Files:**
- Create: `screens/fan/MerchOrderDetailPage.js`
- Create: `screens/fan/fanStyles/MerchOrderDetailPageStyles.js`

**Step 1: Create styles file**

Dark theme. Status badge with color coding (green=shipped, blue=production, gray=pending). Tracking section. Item list. Return button.

**Step 2: Create the screen**

`screens/fan/MerchOrderDetailPage.js`:

- Receives `orderId` from `route.params`
- On mount, calls `getOrder(orderId)` from merch service
- Displays:
  - Order number (`order_number`)
  - Date (`created_at` formatted)
  - Status badge with color:
    - PENDING/PAID: gray
    - PRODUCTION: blue
    - SHIPPED: green
    - DELIVERED: green
    - REFUNDED: red
    - CANCELLED: red
    - RETURN_REQUESTED: orange
  - Items list with product type, size, color, quantity, price
  - Subtotal, shipping, total
  - If SHIPPED: tracking number + carrier, "Track Package" link (tracking_url)
  - If SHIPPED: "Request Return" button -> calls `requestReturn(orderId)`, shows confirmation alert
- Loading state with ActivityIndicator
- Back button in header

**Step 3: Commit**

```bash
git add screens/fan/MerchOrderDetailPage.js screens/fan/fanStyles/MerchOrderDetailPageStyles.js
git commit -m "Add MerchOrderDetailPage with tracking and return request"
```

---

## Task 7: Modify MyCollectionsPage (Add Orders Tab)

**Files:**
- Modify: `screens/fan/MyCollectionsPage.js`
- Modify: `screens/fan/fanStyles/MyCollectionsPageStyles.js`

**Step 1: Add segment control state**

At top of `MyCollectionsPage` component, add:
```js
const [activeTab, setActiveTab] = useState('drops'); // 'drops' | 'orders'
const [orders, setOrders] = useState([]);
const [ordersLoading, setOrdersLoading] = useState(false);
```

**Step 2: Add orders fetch function**

```js
import { getFanOrders } from '../../services/merch.service';

const fetchOrders = async () => {
  setOrdersLoading(true);
  try {
    const data = await getFanOrders();
    setOrders(data || []);
  } catch (error) {
    console.error('Error fetching orders:', error);
  } finally {
    setOrdersLoading(false);
  }
};
```

Call `fetchOrders()` in the `useFocusEffect` when `activeTab === 'orders'`.

**Step 3: Add segment control UI**

Above the existing content, add a row with two touchable tabs:
```jsx
<View style={styles.segmentControl}>
  <TouchableOpacity
    style={[styles.segmentButton, activeTab === 'drops' && styles.segmentButtonActive]}
    onPress={() => setActiveTab('drops')}
  >
    <Text style={[styles.segmentText, activeTab === 'drops' && styles.segmentTextActive]}>Drops</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.segmentButton, activeTab === 'orders' && styles.segmentButtonActive]}
    onPress={() => { setActiveTab('orders'); fetchOrders(); }}
  >
    <Text style={[styles.segmentText, activeTab === 'orders' && styles.segmentTextActive]}>Orders</Text>
  </TouchableOpacity>
</View>
```

**Step 4: Render orders list when active**

When `activeTab === 'orders'`, render a FlatList of order cards instead of the drops content:
```jsx
{activeTab === 'orders' ? (
  <FlatList
    data={orders}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('MerchOrderDetailPage', { orderId: item.id })}
      >
        <Text style={styles.orderNumber}>{item.order_number}</Text>
        <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        <Text style={styles.orderStatus}>{item.status}</Text>
        <Text style={styles.orderTotal}>${Number(item.total).toFixed(2)}</Text>
      </TouchableOpacity>
    )}
    ListEmptyComponent={<Text style={styles.emptyText}>No orders yet</Text>}
  />
) : (
  /* existing drops content */
)}
```

**Step 5: Add styles for segment control and order cards**

In `MerchCollectionsPageStyles.js` add: `segmentControl`, `segmentButton`, `segmentButtonActive`, `segmentText`, `segmentTextActive`, `orderCard`, `orderNumber`, `orderDate`, `orderStatus`, `orderTotal`, `emptyText`.

**Step 6: Commit**

```bash
git add screens/fan/MyCollectionsPage.js screens/fan/fanStyles/MyCollectionsPageStyles.js
git commit -m "Add Orders tab to MyCollectionsPage with segment control"
```

---

## Task 8: Register Merch Screens in Navigation

**Files:**
- Modify: `navigation/FanStack.js`

**Step 1: Import merch screens**

```js
import MerchStorePage from '../screens/fan/MerchStorePage';
import MerchProductPage from '../screens/fan/MerchProductPage';
import MerchCheckoutPage from '../screens/fan/MerchCheckoutPage';
import MerchOrderDetailPage from '../screens/fan/MerchOrderDetailPage';
```

**Step 2: Add screens to RootStack**

Inside `RootStackScreen`, add after `BlockedUsers`:
```jsx
<RootStack.Screen name="MerchStorePage" component={MerchStorePage} />
<RootStack.Screen name="MerchProductPage" component={MerchProductPage} />
<RootStack.Screen name="MerchCheckoutPage" component={MerchCheckoutPage} />
<RootStack.Screen name="MerchOrderDetailPage" component={MerchOrderDetailPage} />
```

All with `screenOptions={{ headerShown: false }}` (inherited from RootStack).

**Step 3: Commit**

```bash
git add navigation/FanStack.js
git commit -m "Register merch screens in FanStack navigation"
```

---

## Task 9: Add "Shop Merch" Button to DMDetailPage

**Files:**
- Modify: `screens/fan/DMDetailPage.js`

**Step 1: Import merch service**

```js
import { getMerchDropByPost } from '../../services/merch.service';
```

**Step 2: Add merch drop state**

Inside `DMDetailPage` component, add:
```js
const [merchDrop, setMerchDrop] = useState(null);
const navigation = useNavigation();
```

**Step 3: Fetch merch drop on mount**

Add a `useEffect` after existing ones:
```js
useEffect(() => {
  const checkMerchDrop = async () => {
    try {
      const drop = await getMerchDropByPost(postId);
      if (drop && drop.status === 'ACTIVE') {
        setMerchDrop(drop);
      }
    } catch (error) {
      // No merch for this post, that's fine
    }
  };
  checkMerchDrop();
}, [postId]);
```

**Step 4: Add Shop Merch button to UI**

Below the post content area (before comments section), conditionally render:
```jsx
{merchDrop && (
  <TouchableOpacity
    style={{
      backgroundColor: '#FF0080',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginHorizontal: 16,
      marginVertical: 12,
      alignItems: 'center',
    }}
    onPress={() => navigation.navigate('MerchStorePage', { dropId: merchDrop.id })}
  >
    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>Shop Merch</Text>
  </TouchableOpacity>
)}
```

**Step 5: Commit**

```bash
git add screens/fan/DMDetailPage.js
git commit -m "Add Shop Merch button to drop detail page"
```

---

## Task 10: Add Push Notification Deep Linking

**Files:**
- Modify: `App.tsx`

**Step 1: Add merch notification handlers**

In `App.tsx`, inside the `onNotificationClick` handler, after the existing `comment` handler block, add:

```tsx
else if (data.type === 'merch_drop' && data.drop_id) {
  if (navigationRef.current) {
    navigationRef.current.navigate('MerchStorePage', {
      dropId: data.drop_id,
    });
  }
} else if (data.type === 'merch_order_shipped' && data.order_id) {
  if (navigationRef.current) {
    navigationRef.current.navigate('MerchOrderDetailPage', {
      orderId: data.order_id,
    });
  }
}
```

**Step 2: Verify backend sends correct notification data**

Check that `PushNotificationService` in the backend includes `type` and entity ID in the OneSignal data payload. If not, add a small backend update (Task 11).

**Step 3: Commit**

```bash
git add App.tsx
git commit -m "Add merch notification deep linking in App.tsx"
```

---

## Task 11: Backend -- Add Notification Type to OneSignal Payload

**Files:**
- Modify (backend): `src/modules/merch/processors/merch-creation.processor.ts`
- Modify (backend): `src/modules/merch/merch-order.service.ts`
- Modify (backend): `src/shared/services/push-notification.service.ts`

**Step 1: Check current push notification implementation**

Read `src/shared/services/push-notification.service.ts` to see what data payload is sent with notifications. If it doesn't include a `type` field and entity ID, update the `sendNotification` method to accept and pass through a `data` parameter.

**Step 2: Update merch notification calls**

In `merch-creation.processor.ts` (drop activation notification), add data:
```typescript
{ type: 'merch_drop', drop_id: drop.id }
```

In `merch-order.service.ts` (shipped notification), add data:
```typescript
{ type: 'merch_order_shipped', order_id: order.id }
```

**Step 3: Verify createOrder returns client_secret**

Read `merch-order.service.ts:createOrder` to confirm it returns the PaymentIntent `client_secret` in its response. If not, update it to include `client_secret` from the Stripe PaymentIntent.

**Step 4: Commit (backend repo)**

```bash
cd /Volumes/external/hevin/freelancing/Fiverr/Clients/ericbush996/Dayones-Bakcend
git add src/modules/merch/ src/shared/services/push-notification.service.ts
git commit -m "Add notification type and entity ID to OneSignal push data"
```

---

## Task 12: End-to-End Testing

**Step 1: Test merch store entry**

- Log in as fan (hakeem2@mailinator.com)
- Navigate to a collected drop that has merch (drop 293e146a should still be active or create new one)
- Verify "Shop Merch" button appears
- Tap it, verify MerchStorePage loads with products grouped by type
- Verify countdown timer shows correct remaining time

**Step 2: Test product selection**

- Tap a product (e.g., T-Shirt)
- Verify size options show (S, M, L, XL, 2XL, 3XL)
- Verify color swatches show (White, Asphalt, Black)
- Select size and color, verify price updates
- Verify "Buy Now" button becomes active

**Step 3: Test checkout flow**

- Tap "Buy Now"
- Fill in shipping address
- Verify order summary shows correct item + price
- Tap "Place Order"
- Verify Stripe Payment Sheet appears
- Enter test card: 4242 4242 4242 4242, any future date, any CVC
- Confirm payment
- Verify success confirmation with order number

**Step 4: Test order history**

- Navigate to "My Collections"
- Tap "Orders" segment
- Verify new order appears in list
- Tap order to view detail
- Verify order info is correct

**Step 5: Test push notification deep link**

- Simulate a merch_drop notification via OneSignal or test on server
- Verify tapping it opens MerchStorePage

**Step 6: Test on Android**

- Repeat all tests on Android emulator/device
- Verify Stripe Payment Sheet works on Android

**Step 7: Commit any fixes**

```bash
git add -A
git commit -m "Fix issues found during E2E testing"
```

---

## Task 13: Push to Remote

**Step 1: Push frontend**

```bash
cd /Volumes/external/hevin/freelancing/Fiverr/Clients/ericbush996/DayOnes
git push origin react-native-version
```

**Step 2: Push backend (if Task 11 had changes)**

```bash
cd /Volumes/external/hevin/freelancing/Fiverr/Clients/ericbush996/Dayones-Bakcend
git push origin main
```

**Step 3: Deploy backend (if changed)**

```bash
ssh to EC2
cd daysone-backend
git pull origin main
npm run build
pm2 restart all
```
