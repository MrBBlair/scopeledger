/**
 * Scroll input into view when keyboard opens (mobile form UX).
 * Use with onFocus for inputs that may be obscured.
 */
export function scrollInputIntoView(element: HTMLElement | null): void {
  if (!element) return
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
