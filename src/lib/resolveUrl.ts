// src/lib/resolveUrl.ts
export function resolveCdnUrl(s: string): string {
  if (/^https?:\/\//i.test(s)) return s;
  const base = process.env.NEXT_PUBLIC_S3_CDN_BASE || '';
  return `${base.replace(/\/$/, '')}/${s.replace(/^\//, '')}`;
}

// Quick YouTube embed path helper
export function toYouTubeEmbed(url: string): string {
  // supports full or short URLs
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${u.pathname.replace('/', '')}`;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      // already embed or shorts
      if (u.pathname.startsWith('/embed/')) return url;
      if (u.pathname.startsWith('/shorts/')) {
        const id2 = u.pathname.split('/')[2];
        return `https://www.youtube.com/embed/${id2}`;
      }
    }
    // Fallback: return original
    return url;
  } catch {
    return url;
  }
}
