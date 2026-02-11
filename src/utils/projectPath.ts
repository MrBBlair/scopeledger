/**
 * Build a URL slug from a project name for use in the address bar.
 * Lowercase, letters/numbers/unicode/hyphens only.
 */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'project'
}

/**
 * Resolve URL slug to project ID.
 * - "electrical" -> needs projects list to resolve (returns null, caller must use resolveSlugToProjectId)
 * - "electrical--abc123" (legacy) -> abc123
 * - "PUORNFyXzHjxJsUJOLQT" (legacy ID-only) -> use slug as id
 */
export function parseProjectSlug(slug: string): string | null {
  const sep = '--'
  const idx = slug.lastIndexOf(sep)
  if (idx >= 0) return slug.slice(idx + sep.length)
  return null
}

/** True if slug looks like a legacy Firestore ID (no hyphens, 20 chars). */
export function isLegacyProjectId(slug: string): boolean {
  return !slug.includes('--') && /^[a-zA-Z0-9]{15,}$/.test(slug)
}

/** Build project URL path: /app/projects/electrical (name only) */
export function projectPath(project: { id: string; name: string }): string {
  return `/app/projects/${slugify(project.name)}`
}

/** Build project edit URL path */
export function projectEditPath(project: { id: string; name: string }): string {
  return `${projectPath(project)}/edit`
}

/** Resolve slug to project ID by matching project name. Returns first match if duplicates. */
export function resolveSlugToProjectId(slug: string, projects: { id: string; name: string }[]): string | null {
  const normalized = slugify(slug)
  const match = projects.find((p) => slugify(p.name) === normalized)
  return match?.id ?? null
}
