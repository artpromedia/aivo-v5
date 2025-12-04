// Accessible UI Components
// WCAG 2.1 AA Compliant
// Grade-themed for K-12 learners

// Button
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Card
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from './Card';

// Citation
export { Citation } from './Citation';
export type { CitationProps, CitationSource } from './Citation';

// Input
export { Input } from './Input';
export type { InputProps } from './Input';

// Badge
export { Badge, BadgeGroup } from './Badge';
export type { BadgeProps, BadgeGroupProps, BadgeIntent, BadgeSize } from './Badge';

// Progress
export { Progress, CircularProgress } from './Progress';
export type {
  ProgressProps,
  CircularProgressProps,
  ProgressSize,
  ProgressIntent,
} from './Progress';

// Alert
export { Alert, AlertTitle, AlertDescription } from './Alert';
export type {
  AlertProps,
  AlertTitleProps,
  AlertDescriptionProps,
  AlertIntent,
  AlertVariant,
} from './Alert';

// Modal
export { Modal } from './Modal';
export type { ModalProps } from './Modal';

// FormField
export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';

// LiveRegion & Announcer
export {
  LiveRegion,
  useAnnounce,
  useAnnouncer,
  AnnouncerProvider,
  VisuallyHidden,
  LoadingAnnouncement,
} from './LiveRegion';
export type {
  LiveRegionProps,
  UseAnnounceReturn,
  AnnounceOptions,
  AnnouncerProviderProps,
  VisuallyHiddenProps,
  LoadingAnnouncementProps,
} from './LiveRegion';

// ThemeSwitcher - Grade-based theme selector
export { ThemeSwitcher } from './ThemeSwitcher';
export type { ThemeSwitcherProps } from './ThemeSwitcher';

// ThemeDevTools (Development Only)
// Zero bundle size in production
export {
  ThemeDevTools,
  ThemePreviewPanel,
  AccessibilityPanel,
  ContrastChecker,
  ComponentGallery,
  CSSVariableInspector,
  useDevTools,
} from './ThemeDevTools';
export type { ThemeDevToolsProps, DevToolsTab } from './ThemeDevTools';
