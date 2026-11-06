# Unified Design System Progress

Stack: **shadcn/ui** (fields, buttons, menus) + **Kokonut UI** (interactive / animated) + theme tokens.
Rules: `DESIGN_SYSTEM.md` · `.claude/rules/design-system.md` · `.claude/rules/kokonut-ui.md`

## Foundation ✅

- Page shell: `Page` / `PageHeader` / `PageContent` / `PageSection` / `PageActions`
- Forms: `FormField` / `FormGrid` + `Input` / `Textarea` / `NativeSelect` / `Checkbox` / `Switch` / `Button`
- States: `PageLoader` / `EmptyState` / `ErrorState` / `StatusBadge`
- Nav: `BottomNav` · `SideNav` (+ ⌘K `CommandPalette`) · `HamburgerMenu` · `UnifiedHeader`
- Kokonut installed: `carousel-cards`, `smooth-tab`, `hold-button`, `particle-button`, `loader`, `action-search-bar`, `ai-prompt`, `file-upload`

## Migrated screens ✅

Explore, Search, Favorites, MyBookings, ClassDetail, Dashboard/Home, Profile / Student / Trainer edit,
Bookings, Messages list, Chat / ChatConversation, Auth, Welcome/Onboarding, Events/Venues,
MealPlanner / MyMealPlans, Verification, MediaUpload, **AdminDashboard**, **AICoach**, Subscription,
Documents, Requests flow, etc.

## Kokonut wiring (this pass) ✅

| Component | Where |
|---|---|
| `ai-prompt` | AICoachPage composer |
| `file-upload` | MediaUploadPage |
| `action-search-bar` | SideNav `CommandPalette` (⌘K / Ctrl+K) |
| `smooth-tab` | MyBookings + AdminDashboard |
| `hold-button` / `particle-button` / carousels | Bookings, MealPlanner, Verification, rails |

## Token cleanup (this pass) ✅

- Dashboard / PromoBanner → `text-primary-foreground` on brand gradients
- ClassDetail gallery overlays → theme-safe scrims
- StudentProfile premium CTA → card/secondary tokens
- Auth brand glass → `primary-foreground` borders
- Welcome category labels → `primary-foreground`
- Chat menus → shadcn `DropdownMenu`

## Cleanup ✅

- Removed empty `components/Header.tsx`
- Removed dead duplicate `pages/AuthPage.tsx` (routed auth is `src/pages/AuthPage.tsx`)

## Remaining optional polish

- Unrouted stubs: `AdminPage`, `CategoryPage`, `CreateProfilePage`, `Create.tsx`, `Index.tsx`, `Profile.tsx`
- Pre-existing App/Supabase typing mismatches (requests tables, ChatPage prop names) — not design-system blockers
- Photo overlays may keep high-contrast light text by design; prefer `primary-foreground` over raw `text-white` when on brand surfaces
