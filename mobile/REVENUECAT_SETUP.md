# RevenueCat Integration Guide

## Overview

Mind My Money mobile app now uses RevenueCat for Apple In-App Purchase (IAP) compliance. This hybrid architecture combines native subscription screens with a WebView for the main app.

## Multiplatform Service Model (Apple Guideline 3.1.3(b))

**Mind My Money operates as a multiplatform service:**

- **Web Platform:** Users subscribe via Stripe at https://www.mindmymoneyapp.com
- **Mobile Platform:** Users subscribe via Apple In-App Purchase
- **Cross-Platform Access:** Users with an active subscription on EITHER platform can access the mobile app

This complies with Apple App Store Guideline 3.1.3(b) which allows:
> "Apps may allow a user to access previously purchased content or content subscriptions... specifically: Apps may allow a user to access content, subscriptions, or features they have acquired elsewhere, including content, subscriptions, or features that unlock in the app after the user has used the app to send themselves a link directing them to purchase said items outside of the app, as long as those items are also available as in-app purchases."

**How It Works:**
1. ✅ Existing web subscribers can login to mobile app and access all features
2. ✅ New mobile users can purchase via Apple IAP (14-day free trial available)
3. ✅ Users can purchase on web, then access on mobile
4. ✅ Users can purchase on mobile, then access on web
5. ❌ Mobile app does NOT link to external payment pages or Stripe checkout

**Backend Implementation:**
- `hasAccess()` function checks BOTH Stripe and RevenueCat subscriptions for mobile requests
- Web subscribers are identified by `stripeSubscriptionId`, `isPremium`, or `stripeCustomerId`
- Mobile subscribers are identified by `revenuecatExpiresAt` or RevenueCat entitlements
- Free trials are honored regardless of platform

## Architecture

### Before (WebView Only)
- Single WebView loading web app
- Stripe payments opened in Safari
- **Rejected by Apple** for Guideline 3.1.1 violation

### After (Hybrid Native + WebView)
- Native paywall screen (RevenueCat)
- WebView for main app (after subscription)
- Compliant with Apple IAP requirements

## Components

### 1. App.tsx
Main entry point that:
- Initializes RevenueCat SDK
- Checks subscription status
- Shows paywall if not subscribed
- Shows WebView if subscribed

### 2. PaywallScreen.tsx
Native subscription screen featuring:
- RevenueCat package display (monthly/annual)
- Free trial messaging
- Purchase flow
- Restore purchases
- Professional UI with features list

### 3. MainApp.tsx
WebView wrapper with:
- Navigation controls (back/forward/refresh)
- Cookie-based authentication
- External link handling
- Error management

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

This will install `react-native-purchases@^8.2.2` and all dependencies.

### 2. Configure RevenueCat

**RevenueCat Dashboard:**
1. Create project at https://app.revenuecat.com
2. Add iOS app with bundle ID: `com.mindmymoneyapp.mobile`
3. Create entitlement: `premium`
4. Create offerings with products:
   - Monthly subscription
   - Annual subscription
5. Configure webhook: `https://www.mindmymoneyapp.com/api/webhooks/revenuecat`

**Environment Variables:**
```bash
# Already configured in Replit Secrets
REVENUECAT_PUBLIC_KEY=appl_xxx  # iOS API key from RevenueCat
REVENUECAT_SECRET_KEY=sk_xxx    # Secret key for backend
REVENUECAT_WEBHOOK_SECRET=xxx   # Optional: Webhook auth token
```

### 3. Update API Key

In `mobile/src/App.tsx`, replace the test API key:
```typescript
const REVENUECAT_API_KEY = 'your_actual_ios_api_key';
```

### 4. App Store Connect Setup

1. Create in-app purchase products:
   - Product ID: `com.mindmymoneyapp.monthly`
   - Product ID: `com.mindmymoneyapp.annual`
2. Configure pricing
3. Add to App Store Connect

### 5. Build and Deploy

```bash
# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform ios
```

## How It Works

### User Flow

1. **New User:**
   - Opens app → RevenueCat initializes
   - No subscription → Shows PaywallScreen
   - Selects plan → Apple IAP purchase
   - Purchase confirmed → RevenueCat webhook fires
   - Backend updates user → Shows WebView

2. **Existing Subscriber:**
   - Opens app → RevenueCat checks status
   - Active subscription → Shows WebView immediately

3. **Restore Purchases:**
   - User taps "Restore Purchases"
   - RevenueCat queries Apple
   - Active purchase found → Access granted

### Subscription Sync

**RevenueCat → Backend Webhook:**
```
POST /api/webhooks/revenuecat
{
  "type": "INITIAL_PURCHASE",
  "app_user_id": "17",  // Our user.id
  "product_id": "com.mindmymoneyapp.annual",
  "expiration_at_ms": 1735689600000
}
```

**Backend Updates:**
- Sets `revenuecatExpiresAt` to expiration date
- Sets `isPremium = true`
- Sets `subscriptionStatus = 'active'`

**Access Control:**
Backend checks (in priority order):
1. Stripe customer/subscription
2. Premium flag
3. **RevenueCat expiration date** ✅
4. Active Stripe subscription
5. Valid trial period

## Database Schema

New fields in `users` table:
```sql
revenuecat_user_id TEXT           -- RevenueCat user identifier
revenuecat_subscription_id TEXT   -- Subscription ID
revenuecat_product_id TEXT        -- Product purchased
revenuecat_expires_at TIMESTAMP   -- Expiration date
revenuecat_platform TEXT          -- 'ios' or 'android'
```

## Revenue Split

- **Web Users:** Stripe (direct payment, no fees to Apple)
- **Mobile Users:** Apple IAP (70% to us, 30% to Apple)

## Testing

### Test Purchases

1. Use sandbox Apple ID
2. Test product IDs in RevenueCat
3. Verify webhook fires to backend
4. Check database updates
5. Confirm access granted

### Local Testing

```bash
# Run development build
eas build --profile development --platform ios
# Install on device
# Test purchase flow
```

## Troubleshooting

### "Subscription not found"
- Check RevenueCat API key in App.tsx
- Verify entitlement ID is "premium"
- Check App Store Connect products

### Webhook not firing
- Verify webhook URL in RevenueCat dashboard
- Check backend logs: `grep "RevenueCat webhook" logs/*`
- Test with RevenueCat sandbox

### Purchase fails
- Verify App Store Connect products are "Ready to Submit"
- Check sandbox Apple ID is configured
- Review RevenueCat debugger logs

## Important Notes

1. **User ID Mapping:** RevenueCat `app_user_id` must match our database `user.id`
2. **Entitlement Name:** Must be exactly "premium" (hardcoded in App.tsx)
3. **Webhook Security:** Optional REVENUECAT_WEBHOOK_SECRET for production
4. **Trial Handling:** RevenueCat free trials are separate from our web trials
5. **Account Switching (MVP Limitation):** Current implementation stores userId in AsyncStorage and persists across app launches. Users who want to switch accounts should:
   - Clear app data/storage in device settings, OR
   - Log out via web app and force-quit mobile app
   - Future enhancement: Native logout button that clears AsyncStorage and calls Purchases.logOut()

## Next Steps

1. Set up RevenueCat products in App Store Connect
2. Configure production webhook URL
3. Test purchase flow end-to-end
4. Submit to App Store for review
5. Monitor RevenueCat dashboard for analytics

## Known Limitations (v3.0.0 MVP)

1. **Account Switching:** Users must clear app data to switch accounts. Future versions will include native logout button.
2. **WebView Session Detection:** User ID is detected once within first 30 seconds of WebView load. Subsequent logins/logouts in same session may require app restart.
3. **Shared Devices:** Not recommended for shared devices in current version. Each device should be used by one user.

## Future Enhancements

1. Native logout button that calls `Purchases.logOut()` and clears AsyncStorage
2. Real-time WebView ↔ Native communication for logout/login events
3. Account switcher UI for multi-user devices
4. Improved session management and sync

## Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Apple IAP Guidelines](https://developer.apple.com/app-store/review/guidelines/#payments)
- [React Native Purchases SDK](https://github.com/RevenueCat/react-native-purchases)
