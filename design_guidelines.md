# Mind My Money Mobile App Design Guidelines

## Design Approach: Mobile-First Financial System

**Foundation**: Using emerald green (#059669) as the primary color to convey trust, growth, and money, while drawing inspiration from modern fintech leaders (Revolut's card interactions, Robinhood's data visualization, Cash App's simplicity).

**Philosophy**: Trust through clarity, control through intuitive interactions, engagement through subtle motion.

---

## Typography System

**Primary Font**: Inter or SF Pro (native iOS feel)
- Large Title: 34px, Bold (Dashboard headers)
- Title 1: 28px, Semibold (Section headers)
- Headline: 20px, Semibold (Card titles, categories)
- Body: 16px, Regular (Primary content)
- Subhead: 14px, Medium (Labels, metadata)
- Caption: 12px, Regular (Timestamps, hints)

**Financial Display Font**: 
- Amounts: Tabular numbers, 24-32px, Bold
- Small amounts: 16-18px, Medium

---

## Layout & Spacing System

**Container Strategy**:
- Screen padding: 16px horizontal (mobile standard)
- Card padding: 16px internal
- Section spacing: 24px between major sections
- Element spacing: 8px, 12px, 16px, 24px (consistent rhythm)

**Safe Areas**: Respect iOS notch/Android status bar with 44px top padding on main screens

---

## Component Library

### Navigation
**Bottom Tab Bar**:
- Height: 80px (including safe area)
- Icons: 24px with 4px text labels below
- Active state: #059669 (emerald) fill with subtle scale (1.05x)
- Inactive: Gray with 60% opacity
- Tabs: Dashboard, Transactions, Budget, Analytics, Profile

**Top Navigation**:
- Height: 56px + safe area
- Logo: Left-aligned, 32px height
- Actions: Right-aligned icons (notifications, settings)
- Shadow: Subtle 2px blur on scroll

### Cards & Containers

**Account Balance Card** (Hero):
- Gradient: #059669 to #047857 (emerald diagonal 45deg)
- Height: 200px
- Corner radius: 20px
- White text with 40% opacity subtitle
- Micro-interaction: Parallax scroll, lift on press
- Include: Total balance (large), account name, last updated

**Transaction Cards**:
- White background with 1px border (#E5E5E5)
- Corner radius: 16px
- Height: Auto (min 72px)
- Left: Category icon (40px circle, colored background)
- Center: Title (16px) + subtitle (14px gray)
- Right: Amount (18px, green for income, default for expense)
- Swipe actions: Delete (red), Edit (blue)

**Quick Action Cards**:
- 2-column grid with 12px gap
- Square aspect ratio
- Gradient backgrounds (complementary to #1877F2)
- Icon (32px) + Label (14px)
- Actions: Send Money, Request, Add Transaction, View Reports

**Budget Progress Cards**:
- Horizontal progress bars with rounded ends (8px height)
- Category name + spent/limit ratio
- Progress fill: #059669 (emerald), background: #F0F0F0
- Percentage indicator on right

### Forms & Inputs

**Text Fields**:
- Height: 56px
- Border: 1px solid #E5E5E5, focus: 2px #059669 (emerald)
- Corner radius: 12px
- Padding: 16px horizontal
- Label: 12px above field (floating label pattern)
- Error state: Red border with message below

**Number Pad Input** (for amounts):
- Large custom keypad at bottom
- Clear, backspace, decimal controls
- Real-time display above with currency symbol
- Haptic feedback on tap

**Date Pickers**: Native iOS/Android date selectors

**Category Selector**:
- Horizontal scrollable chips
- 40px height, 12px corner radius
- Selected: #059669 (emerald) background, white text
- Unselected: Light gray background

### Buttons

**Primary**:
- Height: 56px
- Background: #059669 (emerald)
- Corner radius: 28px (pill shape)
- Text: 16px, Semibold, White
- Full width with 16px side margins
- Shadow: 0 4px 12px rgba(5, 150, 105, 0.3)

**Secondary**:
- Height: 48px
- Border: 2px solid #059669
- Background: White
- Text: #059669 (emerald)
- Corner radius: 24px

**Icon Buttons**:
- 44x44px touch target minimum
- Icon: 24px
- Background: Light gray circle on press

### Charts & Visualizations

**Spending Chart** (Pie/Donut):
- 280px diameter
- Segment colors: Derived from #1877F2 palette
- Center: Total amount display
- Tap segments for detail popup

**Trend Line Graph**:
- Fill gradient from #1877F2 to transparent
- Stroke: 2px #1877F2
- Grid: Light gray dotted lines
- Interactive touch points with value labels

### Lists

**Transaction List**:
- Grouped by date (sticky headers)
- Header: 14px, Gray, 40px height
- Dividers: 1px #F0F0F0 between items
- Pull-to-refresh: Custom blue loader

**Search & Filter Bar**:
- 48px height
- Search icon left, filter icon right
- Placeholder: "Search transactions..."
- Results: Instant filter with highlight

### Overlays & Modals

**Bottom Sheet** (for actions):
- Slide up from bottom
- Handle: 36px wide, 4px thick, gray rounded pill at top
- Background: White with 20px top corner radius
- Backdrop: 40% black overlay

**Alert Dialogs**:
- Centered card, 90% screen width
- 24px corner radius
- Title (20px Bold) + message (16px)
- Actions: Horizontal buttons at bottom

---

## Animations

**Purposeful Motion**:
- Card press: Scale 0.98, duration 150ms
- Page transitions: Slide horizontal, 300ms ease-out
- List updates: Fade + slide 200ms
- Balance refresh: Pulse animation on total (300ms)
- Chart draw: Animate on appear, 600ms ease-in-out

**Avoid**: Excessive bounces, long delays, distracting loops

---

## Images

**Logo Placement**:
- Top navigation: 32px height, white/blue version based on background
- Splash screen: 80px height, centered

**Hero Image**: 
- **Not required** - Use gradient balance card instead for immediate financial focus
- If needed for onboarding: Full-screen financial lifestyle imagery (optimistic, professional, diverse users managing money)

**Empty States**: 
- Illustrations for "No transactions," "Budget not set"
- 200px height, centered, blue accent color
- Supportive message + CTA button below

**Category Icons**:
- Custom icon set or use Heroicons
- 24px size for cards, 20px for chips
- Consistent 2px stroke weight

---

## Screen-Specific Layouts

**Dashboard Screen**:
1. Balance card (gradient hero)
2. Quick actions grid (2x2)
3. Recent transactions (last 5 with "View All")
4. Spending insights card

**Transactions Screen**:
1. Search/filter bar
2. Grouped list by date
3. Floating + button (bottom right)

**Budget Screen**:
1. Monthly overview card
2. Category budget progress list
3. Add budget category button

**Analytics Screen**:
1. Time period selector (tabs: Week, Month, Year)
2. Spending chart
3. Trend graph
4. Category breakdown list

**Profile Screen**:
1. User info card
2. Settings list (grouped sections)
3. Logout button at bottom

---

**Quality Mandate**: Every screen demonstrates production-ready polish with thoughtful micro-interactions, consistent spacing, and professional financial credibility. No placeholder states in initial implementation.