# App Store Submission Guide — Mind My Money v3.4.0

This guide walks you through every step needed to build and submit the app to Apple. You will run commands from a terminal on any computer (Mac, Windows, or Linux). The actual iOS binary is built by Expo's cloud servers so **no Mac or Xcode is required locally**.

---

## Prerequisites Checklist

- [ ] **Apple Developer Account** — $99/year at https://developer.apple.com
- [ ] **Expo Account** — Free at https://expo.dev (sign up if you don't have one)
- [ ] **EAS CLI installed** — Run: `npm install -g eas-cli`
- [ ] **RevenueCat account** — https://app.revenuecat.com (you have this)

---

## Part 1 — RevenueCat Dashboard Setup

Before building, make sure your RevenueCat dashboard is configured with the 3-tier model.

### 1. Create Entitlements

In RevenueCat → Project → Entitlements, create:
- Entitlement ID: `plus` — Label: "Plus"
- Entitlement ID: `pro` — Label: "Pro"

> **Note:** If you previously had a `premium` entitlement, leave it but add the new ones too. The mobile app code checks all three.

### 2. App Store Connect Products — Already Created ✅

Your four subscription products are already created and Ready to Submit:

| Product ID | Reference Name | Duration | Price |
|---|---|---|---|
| `mmm_plus_monthly_` | Mind My Money Plus Monthly Subscription | 1 month | $5.99 |
| `mmm_plus_yearly_` | Mind My Money Plus Yearly Subscription | 1 year | $49.00 |
| `mmm_pro_monthly_` | Mind My Money Pro Monthly Subscription | 1 month | $9.99 |
| `mmm_pro_yearly_` | Mind My Money Pro Yearly Subscription | 1 year | $89.00 |

Make sure each product has:
- A **Review Screenshot** attached (required by Apple — screenshot of your paywall)
- Status showing **"Ready to Submit"**

### 3. Add Products to RevenueCat

In RevenueCat → Project → Products → +, import each of the 4 products above using the exact Product IDs listed.

### 4. Create Offerings

In RevenueCat → Project → Offerings → +, create:

**Offering: "default"** (this is what the app loads)
- Add package identifier: `mmm_plus_monthly_` → Product: `mmm_plus_monthly_`
- Add package identifier: `mmm_plus_yearly_` → Product: `mmm_plus_yearly_`
- Add package identifier: `mmm_pro_monthly_` → Product: `mmm_pro_monthly_`
- Add package identifier: `mmm_pro_yearly_` → Product: `mmm_pro_yearly_`

Set "default" as the **Current Offering**.

### 5. Attach Products to Entitlements

- Attach `mmm_plus_monthly_` and `mmm_plus_yearly_` to the `plus` entitlement
- Attach `mmm_pro_monthly_` and `mmm_pro_yearly_` to the `pro` entitlement

### 6. Configure the Webhook

In RevenueCat → Project → Integrations → Webhooks → +

- URL: `https://www.mindmymoneyapp.com/api/webhooks/revenuecat`
- Events to send: All (or at minimum: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE)
- Authorization header: set the `REVENUECAT_WEBHOOK_SECRET` environment variable in Replit Secrets to match whatever token you enter here (optional but recommended)

---

## Part 2 — Build the iOS App

### Step 1: Navigate to mobile directory

```bash
cd mobile
npm install
```

### Step 2: Log in to Expo/EAS

```bash
eas login
```

Enter your Expo account credentials.

### Step 3: Run the production build

```bash
eas build --platform ios --profile production
```

EAS will ask a few things:
- **Apple ID** — your Apple Developer email
- **Team** — select your development team
- **Bundle Identifier** — it's already set to `com.mindmymoney.app` in app.json
- **Provisioning** — choose "Let EAS manage" (recommended)

The build runs in Expo's cloud and takes ~10-20 minutes. You'll get a download link for the `.ipa` file when done.

### Step 4: Submit to App Store

After the build succeeds, run:

```bash
eas submit --platform ios --latest
```

This uses the EAS Submit service to upload the build directly to App Store Connect (TestFlight). You'll need to enter your Apple ID and an **App-Specific Password**:
1. Go to https://appleid.apple.com → Sign-In and Security → App-Specific Passwords
2. Generate one and paste it when prompted

---

## Part 3 — App Store Connect Setup

### App Information

- **Name:** Mind My Money
- **Subtitle:** AI-Powered Personal Finance Coach
- **Category:** Finance
- **Age Rating:** 4+

### Description (paste this)

```
Mind My Money is your AI-powered personal finance coach. Connect your bank accounts, track spending, build budgets, and get personalized financial guidance — all in one app.

FEATURES:
• AI Financial Coach (Money Mind) — Chat with your personal money coach anytime
• Bank Account Integration — Securely link accounts via Plaid
• Smart Budget Creation — AI-generated budgets based on your spending
• 30-Day Money Reset Challenge — Transform your money habits
• What-If Financial Simulator — See how extra savings impact your future
• Debt Payoff Planner — Snowball or avalanche strategies with charts
• Daily Money Check-In — Stay on track every day
• Monthly Money Story — Shareable recap of your financial progress
• Faith-Based Mode — Optional scripture and generosity tracking

SUBSCRIPTION PLANS:
• Basic — Free forever with bank connection and financial overview
• Plus — $5.99/month or $49/year — AI coaching, budgets, and all tools
• Pro — $9.99/month or $89/year — Unlimited AI messaging and advanced insights

Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in App Store Settings.
```

### Keywords (100 chars max)

```
budget,finance,money,ai coach,spending tracker,savings,debt payoff,personal finance,bank
```

### Privacy Policy URL

```
https://www.mindmymoneyapp.com/privacy
```

### Support URL

```
https://www.mindmymoneyapp.com/support
```

### Screenshots Required

Apple requires screenshots for:
- **6.7" iPhone** (iPhone 15 Pro Max) — 1290 × 2796 px — minimum 3 required
- **5.5" iPhone** (iPhone 8 Plus) — 1242 × 2208 px

Use Expo's simulator or a physical device to capture these screens:
1. Paywall / plan selection screen
2. Dashboard (after login)
3. AI Coach conversation
4. Budget page
5. Goals page

### App Review Notes (write this in the Notes field)

```
Test Account:
- This app uses a WebView to load our web app at mindmymoneyapp.com after subscription verification
- For review, please use the "Already subscribed on the web? Log In" button on the paywall
- Test credentials: [provide a test account login + password for the reviewer]

In-App Purchases:
- Subscription products are configured in RevenueCat
- Use sandbox Apple ID to test purchases during review
- Products: Plus Monthly ($5.99), Plus Annual ($49), Pro Monthly ($9.99), Pro Annual ($89)

Architecture Notes:
- This app uses Apple In-App Purchase for all digital subscriptions (RevenueCat)
- Existing web subscribers can log in without purchasing (multiplatform service model per Guideline 3.1.3(b))
- No external payment links exist in the app
```

---

## Part 4 — TestFlight Testing (Recommended Before Submission)

Before submitting for App Store review, test via TestFlight:

1. After `eas submit` completes, go to App Store Connect → TestFlight
2. Add yourself as an internal tester
3. Install the app and test:
   - Paywall loads showing Plus and Pro plans
   - Purchase flow works with sandbox Apple ID
   - "Log In" button takes you to the web app
   - All web app features load correctly
   - Restore Purchases works after reinstalling

---

## Part 5 — Submit for Review

1. Go to App Store Connect → My Apps → Mind My Money → App Store
2. Click **+** next to iOS App to start a new version (3.4.0)
3. Select the build uploaded from TestFlight
4. Fill in all fields (description, screenshots, review notes)
5. Click **Submit for Review**

Apple typically reviews within **24-48 hours** for apps with prior approvals.

---

## Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Login to Expo
eas login

# Build for iOS App Store
eas build --platform ios --profile production

# Submit the latest build to App Store Connect
eas submit --platform ios --latest

# Check build status
eas build:list
```

---

## Troubleshooting

**"No offerings available" on paywall**
- Verify products are "Ready to Submit" in App Store Connect
- Verify products are added to the RevenueCat offering
- Make sure the bundle ID matches exactly: `com.mindmymoney.app`

**Purchases not working in sandbox**
- Create a sandbox Apple ID at https://appstoreconnect.apple.com → Users and Access → Sandbox Testers
- Sign out of real Apple ID on test device, sign in with sandbox ID

**Webhook not updating backend**
- Check RevenueCat webhook logs in the dashboard
- Verify `REVENUECAT_WEBHOOK_SECRET` matches what's set in RevenueCat
- Test endpoint: `POST https://www.mindmymoneyapp.com/api/webhooks/revenuecat`

**Build fails on EAS**
- Run `eas build:cancel` and retry
- Check that `mobile/app.json` has a valid `projectId` under `extra.eas`
- Your projectId is: `4a34e0fe-3a75-411d-a739-5637883800b1`
