import { sanitizeHref } from '../sanitize';

describe('sanitizeHref', () => {
  it('allows https URLs', () => {
    expect(sanitizeHref('https://grafana.com/docs')).toBe('https://grafana.com/docs');
  });

  it('allows relative paths', () => {
    expect(sanitizeHref('/explore')).toBe('/explore');
  });

  it('allows relative paths with query params', () => {
    expect(sanitizeHref('/explore?orgId=1')).toBe('/explore?orgId=1');
  });

  it('allows fragment links', () => {
    expect(sanitizeHref('#section')).toBe('#section');
  });

  it('allows mailto URLs', () => {
    expect(sanitizeHref('mailto:user@example.com')).toBe('mailto:user@example.com');
  });

  it('rejects javascript URLs', () => {
    expect(sanitizeHref('javascript:alert(1)')).toBeUndefined();
  });

  it('rejects data URLs', () => {
    expect(sanitizeHref('data:text/html,<script>alert(1)</script>')).toBeUndefined();
  });

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeHref('//evil.example')).toBeUndefined();
  });
});
