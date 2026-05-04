// Default list identifiers
export const INBOX_LIST_ID = 'inbox';

// UI timing
export const DEBOUNCE_DELAY_MS = 300;

// Date formatting patterns (using date-fns)
export const DATE_FORMATS = {
  FULL_DATE: 'MMM d, yyyy',
  FULL_WEEKDAY: 'EEEE',
  SHORT_DATE: 'MMM d',
} as const;

// Priority configuration
export const PRIORITY_VALUES = ['none', 'low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITY_VALUES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  none: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const PRIORITY_TEXT_COLORS: Record<Priority, string> = {
  none: 'text-foreground',
  low: 'text-green-500',
  medium: 'text-amber-500',
  high: 'text-red-500',
};

export const PRIORITIES = PRIORITY_VALUES.map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
  color: PRIORITY_COLORS[value],
}));

// Recurrence options
export const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'weekday', label: 'Every weekday' },
  { value: 'monthly', label: 'Every month' },
  { value: 'yearly', label: 'Every year' },
  { value: 'custom', label: 'Custom...' },
] as const;

export const RECURRENCE_VALUES = RECURRENCE_OPTIONS.map((o) => o.value);

// Validation limits
export const MAX_LENGTHS = {
  TITLE: 200,
  NAME: 100,
} as const;

// UI strings (simple i18n placeholder)
export const STRINGS = {
  NO_TASKS_FOUND: 'No tasks found',
  CREATE_TASK_TO_GET_STARTED: 'Create a task to get started!',
  TODAY: 'Today',
  TOMORROW: 'Tomorrow',
  NO_DATE: 'No Date',
  PICK_A_DATE: 'Pick a date',
  LOADING: 'Loading...',
  SOMETHING_WENT_WRONG: 'Something went wrong',
  ADD_LABEL: '+ Add Label',
} as const;

// Time constants (ms)
export const TIME_MS = {
  SECOND: 1000,
  DAY: 86400000,
} as const;

// Base URLs
export const DEFAULT_LOCAL_BASE_URL = 'http://localhost:3000';
