/**
 * @deprecated Import from `@/src/components/layout/screen` instead.
 * Re-exports map old Page* names onto the new AppScreen system.
 */
export {
  AppScreen as Page,
  ScreenHeader as PageHeader,
  ScreenBody as PageContent,
  ScreenSection as PageSection,
  ScreenStickyBar as PageActions,
  AppScreen,
  ScreenHeader,
  ScreenBody,
  ScreenSection,
  ScreenSplit,
  ScreenStickyBar,
} from './screen';

/** Map legacy width prop values used by old pages. */
export type { ScreenWidth as PageWidth } from './shell';
