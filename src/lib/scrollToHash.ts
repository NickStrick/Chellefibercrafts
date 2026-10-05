export type HashScrollOptions = {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  setActiveHref?: (href: string) => void;
  onAfterScroll?: () => void;
};

export function scrollToHash(href: string, options: HashScrollOptions = {}) {
  if (!href.startsWith('#')) return false;
  const target = document.querySelector(href) as HTMLElement | null;
  if (!target) return false;

  target.scrollIntoView({
    behavior: options.behavior ?? 'smooth',
    block: options.block ?? 'start',
  });

  if (window.location.hash !== href) {
    window.history.replaceState(null, '', href);
  }

  options.setActiveHref?.(href);
  options.onAfterScroll?.();
  return true;
}

export function handleHashClick(
  href: string,
  options: HashScrollOptions = {}
) {
  return (e: React.MouseEvent) => {
    if (!href.startsWith('#')) {
      options.setActiveHref?.(href);
      options.onAfterScroll?.();
      return;
    }
    e.preventDefault();
    scrollToHash(href, options);
  };
}
