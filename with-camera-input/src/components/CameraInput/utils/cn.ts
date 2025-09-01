import { clsx } from 'clsx';

/**
 * Utility function to combine class names
 */
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return clsx(classes);
}
