# RhinoFit — design system (Kokonut + shadcn rebuild)

Stack: **shadcn/ui** (primitives) + **Kokonut UI** (motion / interactive) + semantic theme tokens.

Agent rules: `.claude/rules/design-system.md`, `.claude/rules/kokonut-ui.md`.

---

## 1. App shell

Authenticated screens render inside `AppShell` (`components/AppShell.tsx`):

- **Desktop:** shadcn `Sidebar` (collapsible icon rail) — Primary / Discover / Account groups, profile dropdown, command palette, theme switch.
- **Mobile:** sticky top bar (brand, search, theme, profile) + Kokonut `MorphicNavbar` for Home / Explore / Messages / Bookings / Profile.
- **Bare (no shell):** `/auth`, `/welcome`, `/onboarding`.

Nav paths live in `components/navItems.ts`. Explore is role-aware (`/explore` vs `/requests/explore`).

---

## 2. Screen skeleton

```tsx
import {
  AppScreen,
  ScreenHeader,
  ScreenBody,
  ScreenSection,
  ScreenSplit,
  ScreenStickyBar,
} from '@/src/components/layout/screen';

<AppScreen>
  <ScreenHeader
    title="Edit profile"
    description="Desktop-only subtitle"
    onBack={() => navigate(-1)}
    width="form"
    breadcrumbs={[{ label: 'Profile', href: '/profile' }, { label: 'Edit' }]}
  />
  <ScreenBody width="form">
    <ScreenSection title="Personal info" variant="panel">…</ScreenSection>
    <ScreenStickyBar width="form">
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </ScreenStickyBar>
  </ScreenBody>
</AppScreen>
```

| Width | max-width | Use |
|---|---|---|
| `form` | 672px | forms, settings, chat |
| `detail` | 1024px | detail, lists, profile |
| `feed` | 1280px | grids, dashboards, discovery |

Legacy aliases `Page` / `PageHeader` / `PageContent` / `PageSection` / `PageActions` and widths `narrow` / `default` / `wide` still resolve, but new code should use `AppScreen*` + `form|detail|feed`.

Geometry constants: `src/components/layout/shell.ts`.

---

## 3. States

```tsx
import { PageLoader, EmptyState, ErrorState } from '@/src/components/layout/states';

if (loading) return <PageLoader title="Loading bookings…" />;
<EmptyState icon={Calendar} title="No bookings yet" action={<Button>Find a trainer</Button>} />
<ErrorState onRetry={reload} />
```

Uses Kokonut `loader`, shadcn `Empty`, shadcn `Alert`.

---

## 4. Forms

Prefer shadcn `Field` / `FieldGroup` / `FieldLabel` / `FieldDescription` / `FieldError` from `@/src/components/ui/field`.

```tsx
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/src/components/ui/field';
import { Input } from '@/src/components/ui/input';

<FieldGroup>
  <Field data-invalid={!!errors.name}>
    <FieldLabel htmlFor="name">Name</FieldLabel>
    <Input id="name" aria-invalid={!!errors.name} />
    {errors.name ? <FieldError>{errors.name}</FieldError> : <FieldDescription>Public display name</FieldDescription>}
  </Field>
</FieldGroup>
```

Legacy `FormField` / `FormGrid` may remain until a screen is rewritten; do not use them on new screens.

---

## 5. Tokens & motion

- Semantic tokens only: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`. No raw `gray-*` / hex.
- Prices: `formatVND` from `@/src/lib/format`.
- Status: `<StatusBadge status={…} />`.
- After every `npx shadcn@latest add @kokonutui/<name>` run `python scripts/kokonut-compat.py`.

### Kokonut usage map

| Need | Component |
|---|---|
| Primary nav (mobile) | `morphic-navbar` |
| Theme toggle | `switch-button` |
| Async submit | `particle-button` |
| Purchase qty | `cart-button` / `AddToCartButton` |
| Hold confirm | `hold-button` / `slide-to-confirm` |
| Profile menu | `profile-dropdown` |
| ⌘K jump | `action-search-bar` |
| Horizontal rails | `carousel-cards` |
| Tabs | `smooth-tab` |
| Upload | `file-upload` |
| AI composer | `ai-prompt` |
| Favorites | `save-button` |
| Marketing CTA | `attract-button` |
| Dashboard tiles | `bento-grid` / `metric-card` |
| Gallery | `lightbox-grid` |
| Checkout sheet | `smooth-drawer` |

Registries for new blocks: **`@kokonutui`** or **`@shadcn` only**.
