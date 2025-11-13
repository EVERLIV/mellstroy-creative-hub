# Design System Optimization Plan

## Current Issues

### Color Usage Problems
1. **Hard-coded colors instead of semantic tokens**
   - `text-white` → should be `text-primary-foreground` or `text-background`
   - `bg-white` → should be `bg-card` or `bg-background`
   - `text-black` → should be `text-foreground`
   - `bg-[#FF6B35]` → should be `bg-primary`

2. **Files with most issues:**
   - Pages: AICoachPage, AboutMePage, AdminDashboardPage, AdminPage (295 instances)
   - Components: AddEditClassModal, BookingModal, FilterModal (91 instances)

### Dark Mode Compatibility
- Hard-coded white/black colors break dark mode
- Need semantic tokens that adapt automatically

## Recommended Token Mapping

### Background Colors
- `bg-white` → `bg-card` (for card/panel backgrounds)
- `bg-white` → `bg-background` (for page backgrounds)
- `bg-slate-100` → `bg-muted` (for subtle backgrounds)

### Text Colors
- `text-white` → `text-primary-foreground` (on primary colored backgrounds)
- `text-white` → `text-background` (on dark backgrounds)
- `text-black` → `text-foreground` (primary text)
- `text-slate-700` → `text-foreground` (primary text)
- `text-slate-500` → `text-muted-foreground` (secondary text)

### Primary/Accent Colors
- `bg-[#FF6B35]` → `bg-primary`
- `text-[#FF6B35]` → `text-primary`
- `border-[#FF6B35]` → `border-primary`
- `hover:bg-orange-600` → `hover:bg-primary/90`

### Border Colors
- `border-gray-200` → `border-border`
- `border-slate-300` → `border-input`

## Implementation Priority

### Phase 1: Critical Components (High Impact)
1. Button component - already uses semantic tokens ✓
2. BookingModal
3. FilterModal  
4. AddEditClassModal

### Phase 2: Key Pages
1. MyBookingsPage
2. Explore page
3. ClassDetailPage
4. AuthPage

### Phase 3: Admin & Secondary Pages
1. AdminDashboardPage
2. AICoachPage
3. MealPlannerPage

## Benefits After Fix
- ✅ Automatic dark mode support
- ✅ Consistent colors across all pages
- ✅ Easy theme customization
- ✅ Maintainable codebase
