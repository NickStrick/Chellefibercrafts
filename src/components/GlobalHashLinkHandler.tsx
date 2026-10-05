'use client';

import { useEffect } from 'react';
import { scrollToHash } from '@/lib/scrollToHash';

function getHrefFromElement(el: Element) {
  return el.getAttribute('href') ?? el.getAttribute('data-href') ?? '';
}

export default function GlobalHashLinkHandler() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as Element | null;
      if (!target) return;

      const clickable = target.closest('a[href], [data-href], button[href]') as Element | null;
      if (!clickable) return;
      if (clickable.closest('[data-admin-ui=\"true\"]')) return;

      const href = getHrefFromElement(clickable);
      if (!href) return;

      if (href.startsWith('#')) {
        e.preventDefault();
        scrollToHash(href);
        return;
      }

      if (!href.includes('#')) return;

      try {
        const url = new URL(href, window.location.href);
        const isSamePage =
          url.origin === window.location.origin &&
          url.pathname === window.location.pathname &&
          url.hash;
        if (!isSamePage) return;
        e.preventDefault();
        scrollToHash(url.hash);
      } catch {
        // ignore invalid URLs
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
