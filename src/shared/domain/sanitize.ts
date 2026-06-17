const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/**
 * Returns a safe href for use in anchors, or undefined when the URL is unsafe.
 */
export function sanitizeHref(href: string | undefined): string | undefined {
  if (!href?.trim()) {
    return undefined;
  }

  const trimmed = href.trim();

  // Protocol-relative URLs resolve to an allowed scheme via URL() but must be rejected.
  if (trimmed.startsWith('//')) {
    return undefined;
  }

  try {
    const url = new URL(trimmed, window.location.href);

    if (trimmed.startsWith('#')) {
      return url.hash || undefined;
    }

    if (trimmed.startsWith('/')) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    if (!ALLOWED_LINK_PROTOCOLS.has(url.protocol)) {
      return undefined;
    }

    return url.href;
  } catch {
    return undefined;
  }
}
