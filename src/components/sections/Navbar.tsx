'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Menu, X, ShoppingCart, ChevronDown } from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import { useCart } from '@/context/CartContext';
import type { HeaderSection } from '@/types/site';
import Image from 'next/image';
import { handleHashClick } from '@/lib/scrollToHash';

function normalizeNavHref(href: string) {
  if(!href || href === '' ||href === '/') {
    return { linkHref: '/', hashHref: '#top' };
  }
  if (href.startsWith('#')) {
    return { linkHref: `/${href}`, hashHref: href };
  }
  if (href.startsWith('/#')) {
    return { linkHref: href, hashHref: href.slice(1) };
  }
  return { linkHref: href, hashHref: href };
}

export default function Navbar() {
  const { config } = useSite();
  const { items: cartItems, openCart } = useCart();
  const cartActive = config?.settings?.payments?.cartActive === true;
  const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const header = useMemo<HeaderSection>(() => {
    const fromConfig = config?.header as HeaderSection | undefined;
    // defaults if nothing provided
    return (
      fromConfig ?? {
        id: 'hdr',
        type: 'header',
        logoText: 'Site-Crafter',
        logoImage: '',
        links: [
          { label: 'Features', href: '#features' },
          { label: 'Newsletter', href: '#newsletter' },
          { label: 'Contact', href: '#contact' },
        ],
        style: { sticky: true, blur: true, elevation: 'sm' },
      }
    );
  }, [config]);

  const { sticky = true, blur = true, elevation = 'sm', transparent = false } = header.style ?? {};

  // Dropdown groups only expose their children as navigable hrefs — flatten
  // them out for pathname/scroll-spy matching, which only cares about hrefs.
  const flatLinks = useMemo(
    () => (header.links ?? []).flatMap((l) => (l.children?.length ? l.children : [l])),
    [header.links]
  );

  // Close any open dropdown on route change.
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  // Close an open dropdown when clicking anywhere outside it.
  useEffect(() => {
    if (openDropdown === null) return;
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-nav-dropdown]')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [openDropdown]);

  // Set active link based on current pathname (for full-page routes like /shop, /contact).
  // Falls back to the first link when on the home page.
  useEffect(() => {
    const links = flatLinks;
    if (links.length === 0) return;

    const pageMatch = links.find((l) => {
      const { linkHref } = normalizeNavHref(l.href);
      return !linkHref.startsWith('/#') && linkHref === pathname;
    });

    if (pageMatch) {
      setActiveHref(pageMatch.href);
    } else if (pathname === '/' || !activeHref) {
      // On the home page, default to the first link; scroll will take over from here.
      setActiveHref(links[0].href);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, flatLinks]);

  // Scroll-based active tracking — only relevant on the home page where hash links live.
  useEffect(() => {
    if (pathname !== '/') return;

    const links = flatLinks;
    if (links.length === 0) return;
    const homeHref =
      links.find(l => l.href === '/' || l.href === '#home' || l.href === '#top')?.href ??
      links[0].href;

    const sections = links.map((l) => {
      const { hashHref } = normalizeNavHref(l.href);
      const href = hashHref?.includes('#') ? hashHref : '#top';
      return { href, el: document.querySelector(href) as HTMLElement | null };
    });

    if (sections.length === 0) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (window.scrollY <= 1) {
          if (homeHref !== activeHref) setActiveHref(homeHref);
          ticking = false;
          return;
        }
        const activeLine = sticky ? 64 : 0;
        const measured = sections.map(s => ({
          href: s.href,
          rect: s.el!.getBoundingClientRect(),
        }));

        const crossing = measured.filter(
          s => s.rect.top <= activeLine && s.rect.bottom > activeLine
        );

        const above = measured.filter(s => s.rect.top <= activeLine);

        const nextHref =
          (crossing.length > 0 ? crossing[crossing.length - 1].href
          : above.length > 0 ? above[above.length - 1].href
          : sections[0].href);

        if (nextHref !== activeHref) {
          setActiveHref(nextHref);
        }
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [activeHref, flatLinks, pathname, sticky]);

  // Scale link spacing/size down as more nav items are added, so the center
  // group keeps fitting between the logo and the right-side buttons instead
  // of overflowing behind them.
  const linkCount = (header.links ?? []).length;
  const navGapCls =
    linkCount >= 7 ? 'gap-3' : linkCount >= 6 ? 'gap-4' : linkCount >= 5 ? 'gap-5' : 'gap-6';
  const navTextCls = linkCount >= 6 ? 'text-sm' : 'text-base';

  // computed classes
  const positionCls = sticky ? 'fixed top-0 inset-x-0' : 'relative'; // 👈 sticky toggle
  const bgCls = transparent
    ? 'bg-transparent'
    : 'bg-[color-mix(in_srgb,var(--bg)_80%,transparent)]';
  const blurCls = blur ? 'backdrop-blur supports-[backdrop-filter]:backdrop-blur' : '';
  const shadowCls =
    elevation === 'md' ? 'shadow-md/50 shadow'
    : elevation === 'sm' ? 'shadow-sm'
    : 'shadow-none';

  // Close menu on nav click (mobile)
  const onNav = () => setOpen(false);
  const handleAnchorClick = (href: string, closeMenu: boolean, onDone?: () => void) => {
    const { hashHref } = normalizeNavHref(href);
    const isSectionLink = hashHref.startsWith('#');

    if (!isSectionLink || pathname !== '/') {
      return () => {
        if (closeMenu) onNav();
        onDone?.();
      };
    }

    return handleHashClick(hashHref, {
      setActiveHref,
      onAfterScroll: () => {
        if (closeMenu) onNav();
        onDone?.();
      },
    });
  };

  return (
    <>
      <header
        className={[
          positionCls,
          'z-50 border-b border-[color-mix(in_srgb,var(--fg)_10%,transparent)]',
          bgCls,
          blurCls,
          shadowCls,
        ].join(' ')}
      >
        <nav className="mx-auto max-w-6xl h-[4rem] px-4 md:pr-6 grid grid-cols-[auto_1fr_auto] items-center pl-[80px] nav:pl-4 ">
          {/* Left: Logo */}
          <div className="min-w-0 relative">
            <Link href="/" className="absolute left-[-65px] top-[-15px] rounded-full overflow-hidden w-[60px] h-[60px]">
            {header.logoImage&&header.logoImage.length?
              <Image src={header.logoImage} alt="logo" width={140} height={60}  />
              :<></>}</Link>
            <Link href="/" className="opacity-0 xs:opacity-100 text-sm font-semibold hover:opacity-90 text-[var(--text-1)] gradient-text sm:text-lg text-nowrap">

              {header.logoText ?? 'Site-Crafter'}
            </Link>
          </div>

          {/* Center: Links (desktop) */}
          {/* No overflow-x here: setting overflow-x forces overflow-y to
              resolve away from `visible` too, which would clip the dropdown
              flyout panels below. The dynamic gap/size + grouping keep this
              row from overflowing instead. */}
          <ul className={`hidden nav:flex min-w-0 justify-center text-muted ${navGapCls} ${navTextCls}`}>
            {(header.links ?? []).map((l, i) => {
              const isGroup = !!l.children?.length;
              const isOpen = openDropdown === i;
              const groupHasActiveChild = isGroup && l.children!.some((c) => c.href === activeHref);

              if (isGroup) {
                return (
                  <li key={`${l.label ?? ''}-${i}`} className="relative" data-nav-dropdown>
                    <button
                      type="button"
                      className="relative inline-flex flex-col items-center gap-2 hover:text-fg transition-colors text-nowrap"
                      aria-expanded={isOpen}
                      onClick={() => setOpenDropdown(isOpen ? null : i)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {l.label}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </span>
                      <div
                        className={[
                          'h-[4px] w-full rounded-full',
                          'bg-gradient-to-r from-amber-400 via-[var(--primary)] to-[var(--accent)]',
                          'transition-transform duration-300 ease-out origin-left',
                          groupHasActiveChild ? 'scale-x-100' : 'scale-x-0',
                        ].join(' ')}
                      />
                    </button>

                    {isOpen && (
                      <ul className="absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[180px] rounded-lg border border-[color-mix(in_srgb,var(--fg)_10%,transparent)] bg-[var(--bg)] shadow-lg py-2 z-50">
                        {l.children!.map((c, ci) => (
                          <li key={`${c.href ?? ''}-${ci}`}>
                            <Link
                              href={normalizeNavHref(c.href).linkHref}
                              className="block px-4 py-2 text-nowrap hover:text-fg hover:bg-[color-mix(in_srgb,var(--fg)_6%,transparent)]"
                              onClick={handleAnchorClick(c.href, false, () => setOpenDropdown(null))}
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={`${l.href ?? ''}-${l.label ?? ''}-${i}`}>
                  <Link
                    href={normalizeNavHref(l.href).linkHref}
                    className="relative inline-flex flex-col items-center gap-2 hover:text-fg transition-colors text-nowrap"
                    onClick={handleAnchorClick(l.href, false)}
                  >
                    <span>{l.label}</span>
                    <div
                      className={[
                        'h-[4px] w-full rounded-full',
                        'bg-gradient-to-r from-amber-400 via-[var(--primary)] to-[var(--accent)]',
                        'transition-transform duration-300 ease-out origin-left',
                        activeHref === l.href ? 'scale-x-100' : 'scale-x-0',
                      ].join(' ')}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right: CTA (optional) & Mobile toggle */}
          <div className="min-w-0 flex justify-end items-center gap-3">
            {header.cta ? (
              <Link href={header.cta.href} className="head-cta-btn btn-small text-nowrap btn-gradient hidden nav:inline-flex">
                {header.cta.label}
              </Link>
            ) : null}

            {cartActive && (
              <button
                onClick={openCart}
                aria-label="Open cart"
                className="relative !flex flex-row items-center !p-2 !pr-6 !pl-[25px] btn-gradient text-white rounded-full cart-icon w-[120px]"
              >
                <ShoppingCart size={24} className="inline-block" />
                <span className="ml-1 text-[14px] cart-text">Cart</span>
                {cartQuantity > 0 && (
                  <span className="absolute top-2 left-[.45rem] text-[var(--primary)] rounded-full w-5 h-5 text-xs flex items-center justify-center cart-items-count">
                    {cartQuantity}
                  </span>
                )}
              </button>
            )}

            {/* Mobile menu button */}
            <button
              className="nav:hidden inline-flex items-center justify-center min-w-9 w-9 h-9 rounded-md
                         border border-[color-mix(in_srgb,var(--fg)_12%,transparent)] text-[var(--text-1)]"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen(v => !v)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        <div
          id="mobile-nav"
          className={`
            nav:hidden overflow-hidden transition-[max-height] text-[var(--text-1)]
            border-t border-[color-mix(in_srgb,var(--fg)_10%,transparent)]
            ${open ? 'max-h-[80vh] overflow-y-auto' : 'max-h-0'}
          `}
        >
          <ul className="flex flex-col bg-[color-mix(in_srgb,var(--bg)_92%,transparent)]">
            {(header.links ?? []).map((l, i) => {
              const isGroup = !!l.children?.length;
              const isMobileGroupOpen = openDropdown === i;

              if (isGroup) {
                return (
                  <li key={`${l.label ?? ''}-${i}`} className="border-b border-[color-mix(in_srgb,var(--fg)_8%,transparent)]">
                    <button
                      type="button"
                      className="relative w-full py-3 px-10 text-center text-base text-fg/80 hover:text-fg text-nowrap"
                      aria-expanded={isMobileGroupOpen}
                      onClick={() => setOpenDropdown(isMobileGroupOpen ? null : i)}
                    >
                      {l.label}
                      <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-transform ${isMobileGroupOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMobileGroupOpen && (
                      <ul className="pb-1">
                        {l.children!.map((c, ci) => (
                          <li key={`${c.href ?? ''}-${ci}`} className="border-t border-[color-mix(in_srgb,var(--fg)_6%,transparent)]">
                            <Link
                              href={normalizeNavHref(c.href).linkHref}
                              className="block py-2.5 text-center text-fg/70 hover:text-fg text-nowrap"
                              onClick={handleAnchorClick(c.href, true, () => setOpenDropdown(null))}
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={`${l.href ?? ''}-${l.label ?? ''}-${i}`} className="border-b border-[color-mix(in_srgb,var(--fg)_8%,transparent)]">
                  <Link
                    href={normalizeNavHref(l.href).linkHref}
                    className="block py-3 text-center text-base text-fg/80 hover:text-fg text-nowrap"
                    onClick={handleAnchorClick(l.href, true)}
                  >
                    <span className="inline-flex flex-col items-center gap-1">
                      {l.label}
                      <div
                        className={[
                          'h-[2px] w-full rounded-full',
                          'bg-gradient-to-r from-amber-400 via-[var(--primary)] to-[var(--accent)]',
                          'transition-transform duration-300 ease-out origin-left',
                          activeHref === l.href ? 'scale-x-100' : 'scale-x-0',
                        ].join(' ')}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
            {/* {header.cta ? (
              <li className="pt-2">
                <Link href={header.cta.href} className="btn-gradient w-full" onClick={onNav}>
                  {header.cta.label}
                </Link>
              </li>
            ) : null} */}
          </ul>
        </div>
      </header>

      {/* Spacer so content isn't hidden when sticky */}
      {sticky && <div aria-hidden className="h-[4rem]" />}
    </>
  );
}
