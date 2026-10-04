import { Component, Suspense, lazy, useEffect, useRef, type ReactNode } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Configure } from './sections/Configure';
import { Contact, Footer } from './sections/Contact';
import { Enter } from './sections/Enter';
import { Future } from './sections/Future';
import { Habitat, Journey } from './sections/Journey';
import { Plans } from './sections/Plans';
import { Precast } from './sections/Precast';
import { Reveal } from './sections/Reveal';
import { Story } from './sections/Story';
import { Ledger, Why } from './sections/Why';
import { scroll, useStage } from './state/stage';
import { Backdrop } from './ui/Backdrop';
import { CatalogueDialog } from './ui/CatalogueDialog';
import { Loader } from './ui/Loader';
import { Nav, goTo } from './ui/Nav';
import { Rail } from './ui/Rail';

// The 3D engine is its own chunk: text and layout paint first, the scene follows.
const Experience = lazy(() => import('./three/Experience'));

/** If anything in the 3D tree throws, drop to the static backdrop instead of a blank page. */
class StageBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('[Wieldy] 3D stage failed — showing the static experience.', error);
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const FONTS = ['500 1em "Manrope Variable"', '400 1em "Instrument Sans Variable"', '500 1em "IBM Plex Mono"'];

export default function App() {
  const webgl = useStage((s) => s.webgl);
  const typeReady = useStage((s) => s.loaded.type);
  const ready = useStage((s) => s.ready);
  const markLoaded = useStage((s) => s.markLoaded);
  const setWebgl = useStage((s) => s.setWebgl);
  const veil = useRef<HTMLDivElement>(null);

  // Milestone 1: typography. Never block on it for more than a few seconds.
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      markLoaded('type');
      ScrollTrigger.refresh();
    };
    Promise.all(FONTS.map((f) => document.fonts.load(f))).then(finish, finish);
    const id = window.setTimeout(finish, 4000);
    return () => window.clearTimeout(id);
  }, [markLoaded]);

  useEffect(() => {
    const onScroll = () => {
      scroll.y = window.scrollY;
    };
    const onResize = () => {
      scroll.vh = window.innerHeight;
      onScroll();
    };
    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Honour a deep link once the experience is ready.
  useEffect(() => {
    if (!ready) return;
    ScrollTrigger.refresh();
    if (window.location.hash.length > 1 && document.querySelector(window.location.hash)) goTo(window.location.hash);
  }, [ready]);

  return (
    <>
      <a className="skip-link" href="#contact">
        Skip to contact
      </a>

      {webgl ? (
        typeReady && (
          <StageBoundary onFail={() => setWebgl(false)}>
            <Suspense fallback={null}>
              <Experience veil={veil} />
            </Suspense>
          </StageBoundary>
        )
      ) : (
        <Backdrop />
      )}
      <div ref={veil} className="veil" />
      <div className="vignette" />
      <div id="callouts" className="callouts" />

      <Nav />
      <Rail />

      <main>
        <Enter />
        <Reveal />
        <Why />
        <Ledger />
        <Story />
        <Precast />
        <Plans />
        <Configure />
        <Journey />
        <Habitat />
        <Future />
        <Contact />
      </main>
      <Footer />

      <CatalogueDialog />
      <Loader />
    </>
  );
}
