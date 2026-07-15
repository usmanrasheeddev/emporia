/**
 * Format a numeric amount as a USD price string.
 * @example formatPrice(12.9) => '$12.90'
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string or Date object into a human-readable string.
 * @example formatDate('2026-01-15') => 'Jan 15, 2026'
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Truncate a string to the given length, appending an ellipsis if truncated.
 * @example truncate('Hello World', 5) => 'Hello…'
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + '…';
}

/**
 * Join class names, filtering out falsy values.
 * @example cn('base', false && 'hidden', 'active') => 'base active'
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get initials from a first and last name.
 * @example getInitials('John', 'Doe') => 'JD'
 */
export function getInitials(firstName: string, lastName: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
}

/**
 * Pluralize a word based on count.
 * @example pluralize(1, 'item') => '1 item'
 * @example pluralize(3, 'item') => '3 items'
 * @example pluralize(2, 'category', 'categories') => '2 categories'
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

/**
 * Create a debounced version of a function.
 * The returned function delays invoking `fn` until after `ms` milliseconds
 * have elapsed since the last invocation.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, ms);
  };
}
