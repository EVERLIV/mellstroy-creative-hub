/**
 * App shell geometry — classic top nav (no sidebar).
 * Header and page body share APP_CONTENT so cards align with the menu.
 */

/** Shared content rail: top nav + ScreenBody use the same max-width + gutters. */
export const APP_CONTENT = 'mx-auto w-full max-w-7xl px-4 sm:px-6';

/** Bottom clearance for mobile tab bar. */
export const ABOVE_MOBILE_NAV =
  'bottom-[calc(4.75rem_+_env(safe-area-inset-bottom))] md:bottom-0';

/** @deprecated Use ABOVE_MOBILE_NAV */
export const ABOVE_BOTTOM_NAV = ABOVE_MOBILE_NAV;

/** @deprecated No sidebar — kept for legacy imports. */
export const FIXED_LEFT_OFFSET = 'md:left-0';
export const CONTENT_OFFSET = '';
export const SIDEBAR_WIDTH = 'w-0';

/** Screen content widths — pick by content type, never hand-roll max-w on a page. */
export const SCREEN_WIDTH = {
  /** Forms, settings, chat. */
  form: 'max-w-2xl',
  /** Detail pages, lists, profiles. */
  detail: 'max-w-5xl',
  /** Feeds, grids, dashboards — matches APP_CONTENT. */
  feed: 'max-w-7xl',
} as const;

export type ScreenWidth = keyof typeof SCREEN_WIDTH;

/** Legacy Page width map → new screen widths. */
export const PAGE_WIDTH = {
  narrow: SCREEN_WIDTH.form,
  default: SCREEN_WIDTH.detail,
  wide: SCREEN_WIDTH.feed,
} as const;

export type PageWidth = keyof typeof PAGE_WIDTH;

/** Horizontal gutter — must match APP_CONTENT. */
export const SCREEN_GUTTER = 'px-4 sm:px-6';
export const PAGE_GUTTER = SCREEN_GUTTER;

/** Mobile bottom padding so content clears tab bar (shell also pads). */
export const SCREEN_BOTTOM_SAFE = 'pb-8 md:pb-8';
