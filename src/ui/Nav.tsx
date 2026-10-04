import { useEffect, useState } from 'react';
import { brandAssets } from '../config/assets';
import { brand, contact, navLinks } from '../config/site';
import { useStage, type ChapterId } from '../state/stage';

/** Which nav item a chapter belongs to. */
const SECTION_OF: Record<ChapterId, string> = {
  enter: '#enter',
  reveal: '#enter',
  why: '#enter',
  ledger: '#enter',
  story: '#enter',
  precast: '#precast',
  plans: '#precast',
  configure: '#precast',
  journey: '#precast',
  habitat: '#precast',
  precamp: '#precamp',
  capsule: '#precamp',
  contact: '#contact',
};

/** Jump straight to a chapter. The 3D stage cuts cleanly, so no long smooth scroll is needed. */
export function goTo(hash: string) {
  const el = document.querySelector(hash);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: hash === '#enter' ? 0 : top + 2, behavior: 'auto' });
  history.replaceState(null, '', hash === '#enter' ? window.location.pathname + window.location.search : hash);
}

export function Mark({ className }: { className?: string }) {
  return <img className={className} src={brandAssets.mark} alt="" width={200} height={156} />;
}

export function Nav() {
  const chapter = useStage((s) => s.chapter);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('is-locked', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const follow = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    goTo(hash);
  };

  const current = SECTION_OF[chapter];

  return (
    <>
      <header className={`nav ${solid || open ? 'is-solid' : ''}`}>
        <a className="brand" href="#enter" onClick={follow('#enter')} aria-label={`${brand.name} — back to start`}>
          <Mark />
          <span>{brand.name}</span>
        </a>

        <nav className="nav__links" aria-label="Primary">
          {navLinks.map((link) =>
            link.href === '#contact' ? (
              <a key={link.href} className="nav__cta" href={link.href} onClick={follow(link.href)}>
                {link.label}
              </a>
            ) : (
              <a key={link.href} href={link.href} onClick={follow(link.href)} className={current === link.href ? 'is-current' : ''} aria-current={current === link.href ? 'true' : undefined}>
                {link.label}
              </a>
            ),
          )}
        </nav>

        <button className="nav__toggle" type="button" aria-expanded={open} aria-controls="menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((v) => !v)}>
          <span />
          <span />
        </button>
      </header>

      <div id="menu" className={`menu ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
        <nav className="menu__links" aria-label="Mobile">
          {navLinks.map((link, i) => (
            <a key={link.href} href={link.href} onClick={follow(link.href)}>
              <span>0{i + 1}</span>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="menu__foot">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.phoneHref}>{contact.phone}</a>
        </div>
      </div>
    </>
  );
}
